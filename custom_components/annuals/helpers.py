"""Shared helpers for translated event-type labels.

The event-type labels live once in translations/<lang>.json (as the
selector's option labels) and are read back at runtime for everything
shown outside the config form itself - config entry titles and calendar
event summaries - so adding a language never means maintaining a second,
code-side label table. Both render in the server's configured language:
they are stored/global strings, not per-viewing-user UI.
"""

from __future__ import annotations

import csv
from datetime import date
import io

from homeassistant.core import HomeAssistant
from homeassistant.helpers import translation

from .const import (
    ALL_EVENT_TYPES,
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_EVENT_TYPE,
    CONF_CATEGORY,
    CONF_COUNTRY,
    CONF_HOLIDAY_KEY,
    CONF_HOLIDAY_OBSERVED,
    CONF_HOLIDAY_SPAN,
    CONF_HUB,
    CONF_SUBDIVISION,
    CONF_ICON,
    CONF_END_DATE,
    CONF_LAST_NAME,
    CONF_MONTH,
    CONF_NTH,
    CONF_NAME_TRANSLATIONS,
    CONF_VIP,
    CONF_WEEKDAY,
    CONF_YEAR,
    DOMAIN,
    NAME_TRANSLATION_LANGUAGES,
    SPAN_DAY,
    SPAN_END,
    SPAN_START,
    TYPE_HOLIDAY,
)
from .dates import holiday_occurrence_in_year, holiday_span_kwargs


def ui_language(library_code: str | None) -> str | None:
    """The NAME_TRANSLATION_LANGUAGES entry a `holidays` language code maps to.

    The two live in different code spaces and do not always agree: the library
    speaks "en_US", "pt_BR", "zh_CN", this integration speaks "en", "pt-BR",
    "zh-Hans". Name overrides are keyed by *this* integration's codes, since
    that is what the dashboard card renders in - so anything coming from the
    library has to be translated across first. None when there is no
    counterpart at all (the library knows languages this integration is not
    translated into, e.g. "th" or "uk").
    """
    if not library_code:
        return None
    normalised = library_code.replace("_", "-")
    for candidate in NAME_TRANSLATION_LANGUAGES:
        if candidate.lower() == normalised.lower():
            return candidate
    base = normalised.split("-")[0].lower()
    for candidate in NAME_TRANSLATION_LANGUAGES:
        if candidate.split("-")[0].lower() == base:
            return candidate
    return None


def library_language(ui_code: str, supported) -> str | None:
    """The reverse: which of a country's own languages to ask the library for
    when the user picked `ui_code`. Falls back to a match on the primary
    subtag ("en" -> "en_US"), and to None when the country simply has no names
    in that language - which is exactly the case a hand-written translation
    exists for.
    """
    if not ui_code:
        return None
    normalised = ui_code.replace("-", "_").lower()
    for candidate in supported:
        if candidate.lower() == normalised:
            return candidate
    base = ui_code.split("-")[0].lower()
    for candidate in supported:
        if candidate.split("_")[0].lower() == base:
            return candidate
    return None


def full_name(data: dict) -> str:
    """First + last name, or just the first name when no last name was
    given - used anywhere a single display string is needed (entry title,
    calendar event summary, CSV-import identity). TYPE_HOLIDAY entries never
    carry CONF_LAST_NAME, so this is always a no-op passthrough of the
    imported holiday name for them.
    """
    last_name = (data.get(CONF_LAST_NAME) or "").strip()
    return f"{data[CONF_EVENT_NAME]} {last_name}".strip() if last_name else data[CONF_EVENT_NAME]


def export_rows(hass: HomeAssistant) -> list[dict]:
    """Every manually-added/CSV-imported event's data, in the shape
    csv-import rows are parsed into (see config_flow._parse_csv_rows) - the
    mirror of CSV import. Holidays are excluded since they're never
    CSV-imported either (see EVENT_TYPES), and the hub entry itself has no
    event fields.
    """
    return [
        entry.data
        for entry in hass.config_entries.async_entries(DOMAIN)
        if not entry.data.get(CONF_HUB) and entry.data.get(CONF_EVENT_TYPE) != TYPE_HOLIDAY
    ]


def _csv_number(value: int | None) -> str:
    """A number for the CSV, or an empty cell where there is none."""
    return "" if value is None else str(value)


def export_csv_text(hass: HomeAssistant) -> tuple[str, int]:
    """Render every exportable event as CSV text (same columns as import,
    so the result can be re-imported unchanged) and how many rows it has.
    """
    rows = export_rows(hass)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    # "end_date" and the two rule columns come last, after the columns that
    # were there before them, so an older CSV without them still imports and
    # a newer one still opens in whatever the last spreadsheet did with the
    # file. Same reason a column is never removed from this list.
    writer.writerow(
        [
            "name",
            "type",
            "day",
            "month",
            "year",
            "icon",
            "vip",
            "last_name",
            "end_date",
            "nth",
            "weekday",
        ]
    )
    for data in rows:
        writer.writerow(
            [
                data[CONF_EVENT_NAME],
                data[CONF_EVENT_TYPE],
                data[CONF_DAY],
                data[CONF_MONTH],
                data.get(CONF_YEAR) or "",
                data.get(CONF_ICON) or "",
                "1" if data.get(CONF_VIP) else "",
                data.get(CONF_LAST_NAME) or "",
                data.get(CONF_END_DATE) or "",
                # Empty on every event without a recurrence rule, which is
                # every event but a custom one that was given one - see
                # CONF_WEEKDAY in const.py. 0 is Monday, so "or" would be
                # wrong here.
                _csv_number(data.get(CONF_NTH)),
                _csv_number(data.get(CONF_WEEKDAY)),
            ]
        )
    return buffer.getvalue(), len(rows)


TRANSLATIONS_CSV_COLUMNS = [
    "country",
    "subdivision",
    "category",
    "holiday_key",
    "observed",
    "language",
    "name",
]


def translations_csv_text(hass: HomeAssistant) -> tuple[str, int]:
    """Every hand-written holiday name, one row per language, as CSV text.

    Keyed by the holiday's own identity rather than by entry id, so the file
    survives deleting and re-importing a country: re-imported entries get new
    entry ids but the same country/subdivision/category/holiday_key/observed
    combination, which is also what config_flow._import_unique_id matches on.

    Its real purpose is bulk work. Translating a country's holidays one
    dialog at a time is fine for a handful and unbearable for two hundred -
    exported, edited in a spreadsheet and imported back, it's one pass.
    """
    rows: list[list[str]] = []
    # The identity below deliberately excludes CONF_HOLIDAY_SPAN, so every
    # part of one multi-day break (its start, its end, each of its days -
    # see const.py) shares a single translation row instead of exporting the
    # same name forty-five times over.
    seen: set[tuple] = set()
    for entry in hass.config_entries.async_entries(DOMAIN):
        data = entry.data
        if data.get(CONF_HUB) or data.get(CONF_EVENT_TYPE) != TYPE_HOLIDAY:
            continue
        for language, name in sorted((data.get(CONF_NAME_TRANSLATIONS) or {}).items()):
            if (identity := (*holiday_identity(data), language)) in seen:
                continue
            seen.add(identity)
            rows.append(
                [
                    data.get(CONF_COUNTRY, ""),
                    data.get(CONF_SUBDIVISION) or "",
                    data.get(CONF_CATEGORY, ""),
                    data.get(CONF_HOLIDAY_KEY, ""),
                    "1" if data.get(CONF_HOLIDAY_OBSERVED) else "",
                    language,
                    name,
                ]
            )
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(TRANSLATIONS_CSV_COLUMNS)
    for row in rows:
        writer.writerow(row)
    return buffer.getvalue(), len(rows)


# The category that wins when one date arrives under more than one of them.
# "public" is the broadest and most meaningful classification a date can
# have; below it nothing outranks anything, and a tie is settled by which
# entry was there first.
CATEGORY_PUBLIC = "public"


def outranks(category: str, other: str) -> bool:
    """Whether `category` should replace `other` for the same date."""
    return category == CATEGORY_PUBLIC and other != CATEGORY_PUBLIC


def holiday_date(data: dict, year: int) -> date | None:
    """Where one holiday entry or import row falls in the given year.

    The date, not the name, is what says two entries are the same holiday
    across categories: the `holidays` library often files one date under
    several of them, and under a different name in each - "Washington's
    Birthday" as government, "Washington and Lincoln Day" as public. Blocking
    (it builds a calendar), so callers run it in an executor.

    None where the date cannot be worked out at all - the library refuses a
    country, region or category it does not know, and a stored entry can
    name one it has since dropped. Such an entry simply takes no part in the
    merge, which is the safe answer: nothing is removed on account of a date
    nobody could resolve.
    """
    try:
        return holiday_occurrence_in_year(
            data.get(CONF_COUNTRY),
            data.get(CONF_SUBDIVISION),
            data.get(CONF_CATEGORY),
            data.get(CONF_HOLIDAY_KEY),
            year,
            bool(data.get(CONF_HOLIDAY_OBSERVED)),
            **holiday_span_kwargs(data),
        )
    except (KeyError, NotImplementedError, ValueError):
        return None


def merge_group(data: dict) -> tuple:
    """Which holidays are even comparable by date.

    A region's own calendar and the country's are different lists, and a
    holiday's observed variant is deliberately a second entry beside its
    literal one (see CONF_HOLIDAY_OBSERVED) - in a year with no shift the
    two land on the same day, and merging them would delete one for good.
    """
    return (
        (data.get(CONF_COUNTRY) or "").upper(),
        (data.get(CONF_SUBDIVISION) or "").upper(),
        bool(data.get(CONF_HOLIDAY_OBSERVED)),
    )


def mergeable(data: dict) -> bool:
    """Whether this entry takes part in the by-date merge at all.

    Multi-day breaks do not: a break's first day coinciding with a statutory
    holiday (Christmas Eve is the obvious one) would let the single-day
    holiday swallow the whole break - the same reason _build_holiday_rows
    keeps them out of its own merge.
    """
    return data.get(CONF_EVENT_TYPE) == TYPE_HOLIDAY and not data.get(CONF_HOLIDAY_SPAN)


def holiday_identity(data: dict) -> tuple[str, str, str, str, bool]:
    """The composite key a holiday translation row is matched back onto.

    Every part case-folded, the holiday key included: it is the holiday's
    name in the library's own default language, and the library has been
    known to change nothing about a name but its capitalisation (see
    config_flow._import_unique_id). A translations file exported before
    such a release would otherwise stop matching the very holidays it was
    written for.
    """
    return (
        (data.get(CONF_COUNTRY) or "").strip().upper(),
        (data.get(CONF_SUBDIVISION) or "").strip().upper(),
        (data.get(CONF_CATEGORY) or "").strip().lower(),
        (data.get(CONF_HOLIDAY_KEY) or "").strip().casefold(),
        bool(data.get(CONF_HOLIDAY_OBSERVED)),
    )


async def async_event_type_labels(hass: HomeAssistant) -> dict[str, str]:
    """Map each event type to its label in the server's language.

    ALL_EVENT_TYPES (not EVENT_TYPES) so this also covers "holiday" - it
    isn't in the manual add-event selector, but still needs a label for its
    calendar.annuals_holiday translation_key. Falls back to a title-cased
    version of the type's own key when no translation exists yet.
    """
    translations = await translation.async_get_translations(
        hass, hass.config.language, "selector", {DOMAIN}
    )
    return {
        event_type: translations.get(
            f"component.{DOMAIN}.selector.event_type.options.{event_type}",
            event_type.replace("_", " ").title(),
        )
        for event_type in ALL_EVENT_TYPES
    }


async def async_span_labels(hass: HomeAssistant) -> dict[str, str]:
    """The words marking which part of a break an entry is, in the server's
    language - "start"/"end"/"day {day}", "Beginn"/"Ende"/"Tag {day}".

    Read once when a break is imported and stored on the entry from then on
    (see CONF_HOLIDAY_SUFFIX), so entries keep the wording they were created
    with. Falls back to English, which is what the untranslated key would
    have produced anyway.
    """
    translations = await translation.async_get_translations(
        hass, hass.config.language, "selector", {DOMAIN}
    )
    defaults = {SPAN_START: "start", SPAN_END: "end", SPAN_DAY: "day {day}"}
    return {
        span: translations.get(
            f"component.{DOMAIN}.selector.holiday_span.options.{span}", fallback
        )
        for span, fallback in defaults.items()
    }


def holiday_span_suffix(span_labels: dict[str, str], span: str, block: int, day: int) -> str:
    """One entry's break decoration, ready to store (see CONF_HOLIDAY_SUFFIX).

    The block number only appears when the breaks under one name could not be
    told apart and given names of their own (see dates.holiday_break_names) -
    it is a last resort for distinguishing them, not a label anyone wants to
    read. It stays a bare number in every language.
    """
    word = span_labels.get(span, span)
    if span == SPAN_DAY:
        word = word.replace("{day}", str(day + 1))
    return f"({block + 1}) ({word})" if block else f"({word})"


async def async_break_note(hass: HomeAssistant) -> str:
    """The holiday-import step's sentence about multi-day breaks.

    Substituted into that step's description as a placeholder, so it only
    appears for the countries whose data actually has breaks (see
    config_flow.async_step_import_holidays_options). It lives under "selector"
    rather than with the step's own text because hassfest only accepts the
    keys a step is defined to have, and a second description isn't one of
    them - the same constraint the reminder phrases below are subject to.
    """
    translations = await translation.async_get_translations(
        hass, hass.config.language, "selector", {DOMAIN}
    )
    return translations.get(f"component.{DOMAIN}.selector.holiday_breaks.options.note", "")


# Localized phrases for a "days until" countdown, per language - deliberately
# mirrors the exact wording the frontend card's own STRINGS.today/inDay/
# inDays already use (annuals-card.js), so the two stay consistent. Kept as a
# plain code-side table rather than real translations/<lang>.json strings:
# hassfest's schema only accepts a fixed set of top-level categories there
# ("selector", "config", "options", ... - see the other tables in this file
# for those), and rejects anything else (confirmed live - a "reminder"
# category failed CI with "extra keys not allowed"), so this data has nowhere
# else to live short of hardcoding it.
#
# Only distinguishes "today"/"tomorrow" (singular) from every other count
# (formatted into "in_days") - a simplified two-form split rather than each
# language's full CLDR plural rules (Polish/Russian/Czech, notably, have more
# than two forms), the same trade-off the card's own strings already make.
_REMINDER_STRINGS: dict[str, dict[str, str]] = {
    "en": {"today": "Today", "tomorrow": "Tomorrow", "in_days": "in {days} days"},
    "de": {"today": "Heute", "tomorrow": "Morgen", "in_days": "in {days} Tagen"},
    "fr": {"today": "Aujourd'hui", "tomorrow": "Demain", "in_days": "dans {days} jours"},
    "nl": {"today": "Vandaag", "tomorrow": "Morgen", "in_days": "over {days} dagen"},
    "pl": {"today": "Dzisiaj", "tomorrow": "Jutro", "in_days": "za {days} dni"},
    "es": {"today": "Hoy", "tomorrow": "Mañana", "in_days": "en {days} días"},
    "it": {"today": "Oggi", "tomorrow": "Domani", "in_days": "tra {days} giorni"},
    "pt-BR": {"today": "Hoje", "tomorrow": "Amanhã", "in_days": "em {days} dias"},
    "ru": {"today": "Сегодня", "tomorrow": "Завтра", "in_days": "через {days} дн."},
    "sv": {"today": "Idag", "tomorrow": "Imorgon", "in_days": "om {days} dagar"},
    "zh-Hans": {"today": "今天", "tomorrow": "明天", "in_days": "{days} 天后"},
    "cs": {"today": "Dnes", "tomorrow": "Zítra", "in_days": "za {days} dní"},
    "nb": {"today": "I dag", "tomorrow": "I morgen", "in_days": "om {days} dager"},
    "da": {"today": "I dag", "tomorrow": "I morgen", "in_days": "om {days} dage"},
    "tr": {"today": "Bugün", "tomorrow": "Yarın", "in_days": "{days} gün sonra"},
}


async def async_reminder_strings(hass: HomeAssistant) -> dict[str, str]:
    """This "days until" countdown's phrases in the server's language - see
    _REMINDER_STRINGS above - exposed as each event sensor's
    "reminder_message" attribute (see sensor.py) so the bundled "Upcoming
    Event Reminders" blueprint's notifications/to-do items read naturally
    instead of always in English. Still `async def` (despite doing no I/O
    now) to match async_event_type_labels' signature, since both are called
    the same way in __init__.py.
    """
    return _REMINDER_STRINGS.get(hass.config.language, _REMINDER_STRINGS["en"])


# The hub entry's title ("Annuals Settings") deliberately keeps "Annuals"
# untranslated (it's the product name) with only the second word localized.
# That single word isn't a config-flow-rendered string, so it lives here as a
# small code-side table instead of in translations/<lang>.json - there's no
# HA translation category for a plain config-entry title.
_HUB_TITLE_WORD = {
    "de": "Einstellungen",
    "fr": "Paramètres",
    "nl": "Instellingen",
    "pl": "Ustawienia",
    "es": "Ajustes",
    "it": "Impostazioni",
    "pt-BR": "Configurações",
    "ru": "Настройки",
    "sv": "Inställningar",
    "zh-Hans": "设置",
    "cs": "Nastavení",
    "nb": "Innstillinger",
    "da": "Indstillinger",
    "tr": "Ayarları",
    "sk": "Nastavenia",
}


def hub_title(hass: HomeAssistant) -> str:
    """The Annuals hub entry's title, e.g. "Annuals Settings" / "Annuals Einstellungen"."""
    return f"Annuals {_HUB_TITLE_WORD.get(hass.config.language, 'Settings')}"
