from __future__ import annotations

import csv
from datetime import date
import io
import logging

import holidays as holidays_lib
import voluptuous as vol

from homeassistant.components.file_upload import process_uploaded_file
from homeassistant.config_entries import ConfigEntry, SOURCE_IMPORT, ConfigFlow, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.selector import selector

from .const import (
    CONF_CATEGORY,
    CONF_COUNTRY,
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_EVENT_TYPE,
    CONF_HOLIDAY_KEY,
    CONF_HUB,
    CONF_ICON,
    CONF_IMPORTANT_THRESHOLDS,
    CONF_LANGUAGE,
    CONF_MONTH,
    CONF_SUBDIVISION,
    CONF_VIP,
    CONF_YEAR,
    DEFAULT_IMPORTANT_THRESHOLDS,
    DOMAIN,
    EVENT_TYPES,
    HUB_UNIQUE_ID,
    TYPE_BIRTHDAY,
    TYPE_HOLIDAY,
)
from .dates import _holiday_calendar, holiday_key_from_name
from .helpers import async_event_type_labels, hub_title

_LOGGER = logging.getLogger(__name__)

_MONTH_OPTIONS = [str(m) for m in range(1, 13)]
_CSV_REQUIRED_COLUMNS = {"name", "type", "day", "month"}

# Form-only field name for the "which categories to import" multi-select in
# the holiday-import options step - not a CONF_ constant since it's never
# stored as-is on a config entry; each imported entry gets exactly one
# CONF_CATEGORY (see _build_holiday_rows).
FORM_CATEGORIES = "categories"

# Every 2-letter country code the `holidays` library supports - it also
# registers 3-letter ISO 3166-1 alpha-3 aliases for the same countries, which
# are deliberately excluded here so the picker (and HA's built-in country
# selector, which expects alpha-2) shows each country exactly once.
_SUPPORTED_HOLIDAY_COUNTRIES = sorted(
    code for code in holidays_lib.list_supported_countries() if len(code) == 2
)

def _event_type_selector():
    return selector(
        {
            "select": {
                "options": EVENT_TYPES,
                "translation_key": "event_type",
                "mode": "dropdown",
            }
        }
    )


def _month_selector():
    return selector(
        {
            "select": {
                "options": _MONTH_OPTIONS,
                "translation_key": "month",
                "mode": "dropdown",
            }
        }
    )


def _event_schema(defaults: dict | None = None) -> vol.Schema:
    defaults = defaults or {}
    return vol.Schema(
        {
            vol.Required(CONF_EVENT_NAME, default=defaults.get(CONF_EVENT_NAME, "")): str,
            vol.Required(
                CONF_EVENT_TYPE, default=defaults.get(CONF_EVENT_TYPE, TYPE_BIRTHDAY)
            ): _event_type_selector(),
            vol.Required(
                CONF_DAY, default=defaults.get(CONF_DAY, 1)
            ): selector({"number": {"min": 1, "max": 31, "mode": "box"}}),
            # The month selector's options are strings ("1".."12", translated
            # labels via translation_key), so the submitted value needs
            # coercing back to int before storage.
            vol.Required(
                CONF_MONTH, default=str(defaults.get(CONF_MONTH, 1))
            ): _month_selector(),
            # Day, month, and year are separate fields instead of a native
            # date picker on purpose: reaching a birth year like 1970 in the
            # picker means clicking back month by month, while a plain number
            # field is one keystroke. Leaving the year empty means "unknown"
            # and hides the occurrence-number attribute - no separate
            # checkbox needed. No default= either, otherwise clearing the
            # field on reconfigure would silently restore the stored year
            # (the frontend omits empty optional fields from the payload and
            # voluptuous would re-fill them from the schema default).
            vol.Optional(
                CONF_YEAR,
                description={"suggested_value": defaults.get(CONF_YEAR)},
            ): selector({"number": {"min": 1, "max": 9999, "mode": "box"}}),
            # Native icon picker (searchable MDI grid) instead of a plain
            # text field - still stores/returns a plain "mdi:..." string.
            vol.Optional(
                CONF_ICON, default=defaults.get(CONF_ICON, "")
            ): selector({"icon": {}}),
            vol.Optional(
                CONF_VIP, default=defaults.get(CONF_VIP, False)
            ): selector({"boolean": {}}),
        }
    )


def _validate_and_normalise(user_input: dict) -> tuple[dict | None, dict[str, str]]:
    """Validate the submitted event, returning (data, errors)."""
    errors: dict[str, str] = {}

    name = user_input[CONF_EVENT_NAME].strip()
    if not name:
        errors["base"] = "name_required"
        return None, errors

    day = int(user_input[CONF_DAY])
    month = int(user_input[CONF_MONTH])
    year = user_input.get(CONF_YEAR)
    year = int(year) if year is not None else None

    # Validate against the given year when known (so Feb 29 in a non-leap
    # year is rejected as the impossible date it is), or against a leap year
    # when unknown (so a yearless Feb 29 stays allowed).
    try:
        date(year if year is not None else 2000, month, day)
    except ValueError:
        errors[CONF_DAY] = "invalid_date"
        return None, errors

    data = {
        CONF_EVENT_NAME: name,
        CONF_EVENT_TYPE: user_input[CONF_EVENT_TYPE],
        CONF_DAY: day,
        CONF_MONTH: month,
        CONF_YEAR: year,
        CONF_ICON: user_input.get(CONF_ICON, "").strip(),
        CONF_VIP: bool(user_input.get(CONF_VIP, False)),
    }
    return data, errors


_CSV_TYPE_LOOKUP = {event_type: event_type for event_type in EVENT_TYPES}


def _csv_schema() -> vol.Schema:
    return vol.Schema({vol.Required("csv_file"): selector({"file": {"accept": ".csv"}})})


_CSV_TRUE_VALUES = {"1", "true", "yes", "y", "x"}


def _parse_csv_rows(text: str) -> tuple[list[dict], list[str]]:
    """Parse CSV text into validated event data dicts, plus per-line errors.

    Columns: name, type, day, month, year (optional), icon (optional),
    vip (optional). `type` must be one of the internal English keys (e.g.
    "birthday"), case-insensitively - translated labels are deliberately
    not accepted, so the same file works regardless of the server's
    language. `vip` accepts 1/true/yes/y/x (case-insensitive); anything
    else (including a missing column) means not VIP.
    """
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return [], ["file has no header row"]

    fields = {f.strip().lower() for f in reader.fieldnames}
    if not _CSV_REQUIRED_COLUMNS.issubset(fields):
        missing = ", ".join(sorted(_CSV_REQUIRED_COLUMNS - fields))
        return [], [f"missing required column(s): {missing}"]

    rows: list[dict] = []
    errors: list[str] = []
    for line_no, raw in enumerate(reader, start=2):  # line 1 is the header
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items()}

        name = row.get("name", "")
        event_type = _CSV_TYPE_LOOKUP.get(row.get("type", "").lower())
        if not name or event_type is None:
            errors.append(f"line {line_no}: missing name or unknown type '{row.get('type', '')}'")
            continue

        year_raw = row.get("year", "")
        icon_raw = row.get("icon", "")
        # A row that omits the trailing comma for an empty "year" (e.g.
        # "Anna,birthday,1,1,mdi:cake" instead of "Anna,birthday,1,1,,mdi:cake")
        # shifts the icon value left into the year column. Since a real year
        # is always numeric and an icon never is, recover from this common
        # mistake instead of just rejecting the row.
        if year_raw and not year_raw.isdigit() and not icon_raw:
            icon_raw = year_raw
            year_raw = ""

        try:
            day = int(row["day"])
            month = int(row["month"])
            year = int(year_raw) if year_raw else None
            date(year or 2000, month, day)
        except (KeyError, ValueError):
            errors.append(f"line {line_no}: invalid day/month/year")
            continue

        rows.append(
            {
                CONF_EVENT_NAME: name,
                CONF_EVENT_TYPE: event_type,
                CONF_DAY: day,
                CONF_MONTH: month,
                CONF_YEAR: year,
                CONF_ICON: icon_raw,
                CONF_VIP: row.get("vip", "").lower() in _CSV_TRUE_VALUES,
            }
        )
    return rows, errors


def _parse_uploaded_csv(hass: HomeAssistant, uploaded_file_id: str) -> tuple[list[dict], list[str]]:
    with process_uploaded_file(hass, uploaded_file_id) as file_path:
        text = file_path.read_text(encoding="utf-8-sig")
    return _parse_csv_rows(text)


def _import_unique_id(data: dict) -> str:
    """Stable identity for an imported event (CSV row or holiday).

    CSV rows are keyed on type + day/month + name, deliberately excluding
    year, so re-importing the same row later - e.g. a centrally maintained
    CSV synced on a schedule - matches the existing entry (see
    AnnualsConfigFlow.async_step_import) instead of creating a duplicate,
    even if that later import corrects a wrong birth year.

    Holidays are keyed on country + subdivision + category + holiday_key
    instead - re-running "Import public holidays" for the same
    country/subdivision is what needs to be idempotent there (e.g. to pick
    up a newly-legislated holiday), not correcting a typo.
    """
    if data[CONF_EVENT_TYPE] == TYPE_HOLIDAY:
        subdivision_key = (data.get(CONF_SUBDIVISION) or "").casefold()
        return (
            f"holiday:{data[CONF_COUNTRY]}:{subdivision_key}:"
            f"{data[CONF_CATEGORY]}:{data[CONF_HOLIDAY_KEY]}"
        )
    name_key = data[CONF_EVENT_NAME].strip().casefold()
    return f"{data[CONF_EVENT_TYPE]}:{data[CONF_DAY]:02d}{data[CONF_MONTH]:02d}:{name_key}"


def _validate_and_normalise_holiday(user_input: dict) -> tuple[dict | None, dict[str, str]]:
    """Validate one queued holiday row (see _build_holiday_rows)."""
    errors: dict[str, str] = {}
    name = (user_input.get(CONF_EVENT_NAME) or "").strip()
    country = user_input.get(CONF_COUNTRY)
    category = user_input.get(CONF_CATEGORY)
    holiday_key = user_input.get(CONF_HOLIDAY_KEY)
    if not name or not country or not category or not holiday_key:
        errors["base"] = "invalid_import_row"
        return None, errors

    data = {
        CONF_EVENT_NAME: name,
        CONF_EVENT_TYPE: TYPE_HOLIDAY,
        CONF_COUNTRY: country,
        CONF_SUBDIVISION: user_input.get(CONF_SUBDIVISION) or None,
        CONF_CATEGORY: category,
        CONF_LANGUAGE: user_input.get(CONF_LANGUAGE) or None,
        CONF_HOLIDAY_KEY: holiday_key,
        CONF_ICON: (user_input.get(CONF_ICON) or "").strip(),
        CONF_VIP: bool(user_input.get(CONF_VIP, False)),
    }
    return data, errors


def _country_class(country_code: str):
    """The `holidays` library's calendar class for this country code - its
    .subdivisions/.supported_categories/.supported_languages describe what's
    selectable for it in the "Import public holidays" step below.
    """
    return holidays_lib.country_holidays(country_code).__class__


def _default_category(cls) -> str:
    categories = cls.supported_categories
    return "public" if "public" in categories else categories[0]


def _default_language(cls) -> str | None:
    languages = cls.supported_languages
    if not languages:
        return None
    return cls.default_language if cls.default_language in languages else languages[0]


def _needs_holiday_options_step(country_code: str) -> bool:
    """Whether the country has more than one meaningful subdivision/category/
    language choice - if not, skip straight to importing with the defaults
    instead of showing a form with nothing real to decide.
    """
    cls = _country_class(country_code)
    return (
        bool(cls.subdivisions)
        or len(cls.supported_categories) > 1
        or len(cls.supported_languages) > 1
    )


def _holiday_options_schema(country_code: str) -> vol.Schema:
    cls = _country_class(country_code)
    fields: dict = {}
    if cls.subdivisions:
        fields[vol.Optional(CONF_SUBDIVISION)] = selector(
            {"select": {"options": list(cls.subdivisions), "mode": "dropdown"}}
        )
    if len(cls.supported_categories) > 1:
        fields[vol.Required(FORM_CATEGORIES, default=[_default_category(cls)])] = selector(
            {
                "select": {
                    "options": list(cls.supported_categories),
                    "multiple": True,
                    "translation_key": "holiday_category",
                }
            }
        )
    if len(cls.supported_languages) > 1:
        fields[vol.Optional(CONF_LANGUAGE, default=_default_language(cls))] = selector(
            {"select": {"options": list(cls.supported_languages), "mode": "dropdown"}}
        )
    return vol.Schema(fields)


def _build_holiday_rows(
    country: str, subdivision: str | None, categories: list[str], language: str | None
) -> list[dict]:
    """One row per distinct holiday in the given category(ies), for the
    current year.

    Some categories (school holidays, notably) list every single calendar
    day of a break under the same name, e.g. "Weihnachtsferien" on 13
    separate dates rather than one date. Since dates.py's own resolver
    already always locks onto the *earliest* matching date each year (see
    holiday_occurrence_in_year), a whole such run is really one yearly event
    that starts on that first day - so it's deduplicated the same way here,
    to the earliest occurrence per name, before ever building a row. Without
    this, a 13-day break would queue 13 rows that all collapse into the same
    entry anyway (via the unique_id dedup in AnnualsConfigFlow.async_step_import),
    just wastefully and with a misleading "N events queued" count.

    Keyed for identity (CONF_HOLIDAY_KEY) using the *default*-language name
    with any "(observed)"/"(estimated)" suffix stripped (see
    dates.holiday_key_from_name) - kept separate from the *display* name,
    which uses whatever language was actually requested. Both come from the
    same underlying dates so they always describe the same holiday, even
    though matching happens by date, not by name.
    """
    year = date.today().year
    rows: list[dict] = []
    for category in categories:
        default_cal = _holiday_calendar(country, subdivision, category, year, None)
        display_cal = (
            _holiday_calendar(country, subdivision, category, year, language)
            if language
            else default_cal
        )

        earliest_by_key: dict[str, date] = {}
        for occurrence, default_name in default_cal.items():
            key = holiday_key_from_name(default_name)
            if key not in earliest_by_key or occurrence < earliest_by_key[key]:
                earliest_by_key[key] = occurrence

        for key, occurrence in earliest_by_key.items():
            default_name = default_cal[occurrence]
            rows.append(
                {
                    CONF_EVENT_NAME: display_cal.get(occurrence, default_name),
                    CONF_EVENT_TYPE: TYPE_HOLIDAY,
                    CONF_COUNTRY: country,
                    CONF_SUBDIVISION: subdivision,
                    CONF_CATEGORY: category,
                    CONF_LANGUAGE: language,
                    CONF_HOLIDAY_KEY: key,
                    CONF_ICON: "",
                    CONF_VIP: False,
                }
            )
    return rows


async def _entry_title(hass: HomeAssistant, data: dict) -> str:
    """Type-prefixed entry title, e.g. "Geburtstag: Anna" - the prefix makes
    the alphabetically-sorted entry list on the integration page group by
    type, and the search box match on either part.
    """
    labels = await async_event_type_labels(hass)
    label = labels[data[CONF_EVENT_TYPE]]
    return f"{label}: {data[CONF_EVENT_NAME]}"


class AnnualsConfigFlow(ConfigFlow, domain=DOMAIN):
    """Each event is its own config entry - lets Home Assistant's own
    Devices & Services search/list handle finding and managing events,
    instead of a custom picker menu.
    """

    VERSION = 1

    async def async_step_user(self, user_input=None):
        # First-ever "Add Integration" click: set up just the hub and its
        # calendars, with no event form - a fresh install shouldn't demand a
        # birthday before you've decided to add one. Every later click (once
        # the hub exists) adds a single event as before.
        hub_exists = any(
            entry.data.get(CONF_HUB) for entry in self.hass.config_entries.async_entries(DOMAIN)
        )
        if not hub_exists:
            return await self.async_step_hub()

        errors: dict[str, str] = {}
        if user_input is not None:
            data, errors = _validate_and_normalise(user_input)
            if data is not None:
                title = await _entry_title(self.hass, data)
                return self.async_create_entry(title=title, data=data)

        return self.async_show_form(
            step_id="user",
            data_schema=_event_schema(user_input),
            errors=errors,
        )

    async def async_step_import(self, import_data: dict):
        """Create one entry from a validated CSV row or holiday row (see
        AnnualsOptionsFlow.async_step_import_csv / async_step_import_holidays_options).

        Sets a unique_id so re-importing the same row - e.g. a centrally
        maintained CSV synced on a schedule, or re-running "Import public
        holidays" to pick up a newly-legislated one - updates the existing
        entry's data in place instead of creating a duplicate. Manually
        added events never get a unique_id, so this only affects entries
        that came from an import.
        """
        if import_data.get(CONF_EVENT_TYPE) == TYPE_HOLIDAY:
            data, errors = _validate_and_normalise_holiday(import_data)
        else:
            data, errors = _validate_and_normalise(import_data)
        if data is None:
            _LOGGER.warning("Annuals import: skipped invalid row (%s)", errors)
            return self.async_abort(reason="invalid_import_row")

        await self.async_set_unique_id(_import_unique_id(data))
        self._abort_if_unique_id_configured(updates=data, reload_on_update=True)

        title = await _entry_title(self.hass, data)
        return self.async_create_entry(title=title, data=data)

    async def async_step_hub(self, user_input=None):
        """Create the shared hub entry - from the first "Add Integration"
        click (async_step_user) or programmatically as a safety net (see
        __init__.py's _async_ensure_hub). The unique_id makes it a singleton
        even if several callers race to create it.
        """
        await self.async_set_unique_id(HUB_UNIQUE_ID)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title=hub_title(self.hass), data={CONF_HUB: True})

    async def async_step_reconfigure(self, user_input=None):
        entry = self._get_reconfigure_entry()
        if entry.data.get(CONF_HUB):
            return self.async_abort(reason="hub_not_configurable")

        errors: dict[str, str] = {}
        if user_input is not None:
            data, errors = _validate_and_normalise(user_input)
            if data is not None:
                title = await _entry_title(self.hass, data)
                return self.async_update_reload_and_abort(entry, title=title, data=data)

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_event_schema(user_input or dict(entry.data)),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return AnnualsOptionsFlow()


class AnnualsOptionsFlow(OptionsFlow):
    """For a single event entry: the same event form again, behind the
    prominent Configure button (reconfigure alone only shows up in the
    entry's overflow menu, which is easy to miss). For the "Annuals" hub
    entry: hub-level tools (CSV import, deleting everything) instead, since
    the hub has no event fields of its own to edit.
    """

    async def async_step_init(self, user_input=None):
        if self.config_entry.data.get(CONF_HUB):
            return await self.async_step_hub_menu()

        entry = self.config_entry
        errors: dict[str, str] = {}
        if user_input is not None:
            data, errors = _validate_and_normalise(user_input)
            if data is not None:
                title = await _entry_title(self.hass, data)
                self.hass.config_entries.async_update_entry(entry, title=title, data=data)
                self.hass.config_entries.async_schedule_reload(entry.entry_id)
                return self.async_create_entry(title="", data={})

        return self.async_show_form(
            step_id="init",
            data_schema=_event_schema(user_input or dict(entry.data)),
            errors=errors,
        )

    async def async_step_import_csv(self, user_input=None):
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                rows, row_errors = await self.hass.async_add_executor_job(
                    _parse_uploaded_csv, self.hass, user_input["csv_file"]
                )
            except (OSError, UnicodeDecodeError, csv.Error):
                errors["base"] = "invalid_csv"
            else:
                for message in row_errors:
                    _LOGGER.warning("Annuals CSV import: %s", message)

                if not rows:
                    errors["base"] = "no_valid_rows"
                else:
                    # Awaited sequentially, not fired off via async_create_task -
                    # each row's unique_id dedup check (see _import_unique_id)
                    # must see every earlier row already committed, or two rows
                    # (or two overlapping import runs) that should collapse into
                    # one entry could each independently conclude "no existing
                    # entry yet" and both create one, i.e. a real duplicate.
                    for row in rows:
                        await self.hass.config_entries.flow.async_init(
                            DOMAIN, context={"source": SOURCE_IMPORT}, data=row
                        )
                    return self.async_abort(
                        reason="import_started",
                        description_placeholders={
                            "created": str(len(rows)),
                            "skipped": str(len(row_errors)),
                        },
                    )

        return self.async_show_form(
            step_id="import_csv",
            data_schema=_csv_schema(),
            errors=errors,
        )

    async def async_step_import_holidays(self, user_input=None):
        """Step 1 of importing public holidays: pick a country.

        Skips straight to importing with sensible defaults when that
        country has no subdivisions and only one category/language to begin
        with (nothing left to actually choose) - otherwise continues to
        async_step_import_holidays_options for those.
        """
        if user_input is not None:
            country = user_input[CONF_COUNTRY]
            self._holiday_country = country
            if _needs_holiday_options_step(country):
                return await self.async_step_import_holidays_options()
            cls = _country_class(country)
            return await self._async_finish_holiday_import(
                country, None, [_default_category(cls)], _default_language(cls)
            )

        return self.async_show_form(
            step_id="import_holidays",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_COUNTRY): selector(
                        {"country": {"countries": _SUPPORTED_HOLIDAY_COUNTRIES}}
                    )
                }
            ),
            # Most countries have a follow-up options step, so this shows
            # "Next" rather than "OK" - the few that skip straight to
            # importing (no subdivisions/extra categories/languages) are the
            # exception, not worth a separate always-wrong label for either case.
            last_step=False,
        )

    async def async_step_import_holidays_options(self, user_input=None):
        """Step 2 (only shown when relevant): subdivision/categories/language."""
        country = self._holiday_country
        if user_input is not None:
            cls = _country_class(country)
            subdivision = user_input.get(CONF_SUBDIVISION) or None
            categories = user_input.get(FORM_CATEGORIES) or [_default_category(cls)]
            language = user_input.get(CONF_LANGUAGE) or _default_language(cls)
            return await self._async_finish_holiday_import(country, subdivision, categories, language)

        return self.async_show_form(
            step_id="import_holidays_options",
            data_schema=_holiday_options_schema(country),
            description_placeholders={"country": country},
            last_step=True,
        )

    async def _async_finish_holiday_import(
        self, country: str, subdivision: str | None, categories: list[str], language: str | None
    ):
        rows = await self.hass.async_add_executor_job(
            _build_holiday_rows, country, subdivision, categories, language
        )
        # Awaited sequentially - see the matching comment in async_step_import_csv
        # on why fire-and-forget (async_create_task) here would race the
        # unique_id dedup check, letting re-running this same import create
        # duplicates instead of updating the existing entries.
        for row in rows:
            await self.hass.config_entries.flow.async_init(
                DOMAIN, context={"source": SOURCE_IMPORT}, data=row
            )
        return self.async_abort(
            reason="holiday_import_started",
            description_placeholders={"count": str(len(rows)), "country": country},
        )

    async def async_step_remove_holidays(self, user_input=None):
        """Bulk-remove previously imported holidays, grouped by the country
        (+subdivision) they came from - so removing "Germany (Bavaria)"
        doesn't also remove an unrelated "United States" import, but you're
        not stuck deleting a dozen entries by hand either.
        """
        holiday_entries = [
            entry
            for entry in self.hass.config_entries.async_entries(DOMAIN)
            if entry.data.get(CONF_EVENT_TYPE) == TYPE_HOLIDAY
        ]
        if not holiday_entries:
            return self.async_abort(reason="no_holidays_imported")

        groups: dict[tuple[str, str | None], list[ConfigEntry]] = {}
        for entry in holiday_entries:
            key = (entry.data[CONF_COUNTRY], entry.data.get(CONF_SUBDIVISION))
            groups.setdefault(key, []).append(entry)

        def _batch_value(country: str, subdivision: str | None) -> str:
            return f"{country}|{subdivision or ''}"

        # Country/subdivision codes and counts are language-neutral (ISO
        # codes and numbers, not natural-language text) - no translation
        # needed for these option labels. The one thing that *would* need
        # translating, an "all of them" choice, is instead its own proper
        # boolean field below (data.remove_all) so it goes through the
        # normal, correctly-viewer-language-translated schema mechanism,
        # rather than a hand-built string with no reliable way to know the
        # viewing user's language from inside a config/options flow.
        batch_options = [
            {
                "value": _batch_value(country, subdivision),
                "label": f"{country}" + (f" ({subdivision})" if subdivision else "")
                + f" - {len(entries)}",
            }
            for (country, subdivision), entries in sorted(groups.items())
        ]

        errors: dict[str, str] = {}
        if user_input is not None:
            if user_input.get("remove_all"):
                to_remove = holiday_entries
            else:
                choice = user_input.get("batch")
                country, _sep, subdivision = (choice or "").partition("|")
                to_remove = groups.get((country, subdivision or None), []) if choice else []

            if not to_remove:
                errors["base"] = "no_batch_selected"
            else:
                # Awaited sequentially for the same reason imports are - see
                # the comments on async_step_import_csv/_async_finish_holiday_import.
                for entry in to_remove:
                    await self.hass.config_entries.async_remove(entry.entry_id)
                return self.async_abort(
                    reason="holidays_removed",
                    description_placeholders={"count": str(len(to_remove))},
                )

        return self.async_show_form(
            step_id="remove_holidays",
            data_schema=vol.Schema(
                {
                    vol.Optional("remove_all", default=False): selector({"boolean": {}}),
                    vol.Optional("batch"): selector({"select": {"options": batch_options}}),
                }
            ),
            errors=errors,
            description_placeholders={"total": str(len(holiday_entries))},
        )

    async def async_step_hub_menu(self, user_input=None):
        return self.async_show_menu(
            step_id="hub_menu",
            menu_options=[
                "annual_settings",
                "import_csv",
                "import_holidays",
                "remove_holidays",
                "delete_all",
            ],
        )

    async def async_step_annual_settings(self, user_input=None):
        """Per-type "important" occurrence-number milestones (e.g. round
        birthdays, work anniversaries) - hub-level, so they apply to every
        event of that type at once rather than being set per event.
        """
        if user_input is not None:
            # Every field is always rendered (never conditionally hidden), so
            # a key missing from user_input means the user cleared that text
            # box - the frontend omits emptied optional string fields from
            # the payload rather than submitting "". Treating "missing" as
            # "" here (instead of falling back to the old stored value) is
            # what lets a field actually be cleared to disable that type.
            new_options = {
                **self.config_entry.options,
                **{
                    f"{CONF_IMPORTANT_THRESHOLDS}_{event_type}": user_input.get(
                        f"{CONF_IMPORTANT_THRESHOLDS}_{event_type}", ""
                    )
                    for event_type in EVENT_TYPES
                },
            }
            # Commit the new options ourselves *before* scheduling reloads -
            # returning CREATE_ENTRY only applies "data" to config_entry.options
            # after this function returns, so scheduling the reloads first (as
            # this used to) would reload every event entry against the *old*
            # thresholds, leaving "important" unchanged until the next hourly
            # poll happened to run after the real options had landed.
            self.hass.config_entries.async_update_entry(self.config_entry, options=new_options)
            for entry in self.hass.config_entries.async_entries(DOMAIN):
                if not entry.data.get(CONF_HUB):
                    self.hass.config_entries.async_schedule_reload(entry.entry_id)
            # Still return the same data so the framework's own
            # options-overwrite (see above) is a no-op rather than reverting
            # anything - belt and suspenders, not required for correctness.
            return self.async_create_entry(title="", data=new_options)

        schema = vol.Schema(
            {
                vol.Optional(
                    f"{CONF_IMPORTANT_THRESHOLDS}_{event_type}",
                    description={
                        "suggested_value": self.config_entry.options.get(
                            f"{CONF_IMPORTANT_THRESHOLDS}_{event_type}",
                            DEFAULT_IMPORTANT_THRESHOLDS.get(event_type, ""),
                        )
                    },
                ): str
                for event_type in EVENT_TYPES
            }
        )
        return self.async_show_form(step_id="annual_settings", data_schema=schema)

    async def async_step_delete_all(self, user_input=None):
        """Remove every Annuals config entry (all events plus the hub itself).

        Deletion is deferred via async_create_task so it runs after this flow
        (which belongs to the hub entry) has finished, instead of trying to
        unload the hub entry from within its own options flow.
        """
        entries = self.hass.config_entries.async_entries(DOMAIN)
        if user_input is not None:
            for entry in entries:
                self.hass.async_create_task(self.hass.config_entries.async_remove(entry.entry_id))
            return self.async_abort(reason="deleted_all")

        event_count = sum(1 for entry in entries if not entry.data.get(CONF_HUB))
        return self.async_show_form(
            step_id="delete_all",
            data_schema=vol.Schema({}),
            description_placeholders={"count": str(event_count)},
        )
