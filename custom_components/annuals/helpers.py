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
import io

from homeassistant.core import HomeAssistant
from homeassistant.helpers import translation

from .const import (
    ALL_EVENT_TYPES,
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_EVENT_TYPE,
    CONF_HUB,
    CONF_ICON,
    CONF_LAST_NAME,
    CONF_MONTH,
    CONF_VIP,
    CONF_YEAR,
    DOMAIN,
    TYPE_HOLIDAY,
)


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


def export_csv_text(hass: HomeAssistant) -> tuple[str, int]:
    """Render every exportable event as CSV text (same columns as import,
    so the result can be re-imported unchanged) and how many rows it has.
    """
    rows = export_rows(hass)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["name", "type", "day", "month", "year", "icon", "vip", "last_name"])
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
            ]
        )
    return buffer.getvalue(), len(rows)


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
}


def hub_title(hass: HomeAssistant) -> str:
    """The Annuals hub entry's title, e.g. "Annuals Settings" / "Annuals Einstellungen"."""
    return f"Annuals {_HUB_TITLE_WORD.get(hass.config.language, 'Settings')}"
