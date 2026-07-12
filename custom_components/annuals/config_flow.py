from __future__ import annotations

import csv
from datetime import date
import io
import logging

import voluptuous as vol

from homeassistant.components.file_upload import process_uploaded_file
from homeassistant.config_entries import SOURCE_IMPORT, ConfigFlow, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.selector import selector

from .const import (
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_EVENT_TYPE,
    CONF_HUB,
    CONF_ICON,
    CONF_MONTH,
    CONF_YEAR,
    DOMAIN,
    EVENT_TYPES,
    HUB_UNIQUE_ID,
    TYPE_BIRTHDAY,
)
from .helpers import async_event_type_labels, hub_title

_LOGGER = logging.getLogger(__name__)

_MONTH_OPTIONS = [str(m) for m in range(1, 13)]
_CSV_REQUIRED_COLUMNS = {"name", "type", "day", "month"}


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
    }
    return data, errors


_CSV_TYPE_LOOKUP = {event_type: event_type for event_type in EVENT_TYPES}


def _csv_schema() -> vol.Schema:
    return vol.Schema({vol.Required("csv_file"): selector({"file": {"accept": ".csv"}})})


def _parse_csv_rows(text: str) -> tuple[list[dict], list[str]]:
    """Parse CSV text into validated event data dicts, plus per-line errors.

    Columns: name, type, day, month, year (optional), icon (optional).
    `type` must be one of the internal English keys (e.g. "birthday"),
    case-insensitively - translated labels are deliberately not accepted, so
    the same file works regardless of the server's language.
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
            }
        )
    return rows, errors


def _parse_uploaded_csv(hass: HomeAssistant, uploaded_file_id: str) -> tuple[list[dict], list[str]]:
    with process_uploaded_file(hass, uploaded_file_id) as file_path:
        text = file_path.read_text(encoding="utf-8-sig")
    return _parse_csv_rows(text)


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
        """Create one entry from a validated CSV row (see AnnualsOptionsFlow.async_step_import_csv)."""
        data, errors = _validate_and_normalise(import_data)
        if data is None:
            _LOGGER.warning("Annuals CSV import: skipped invalid row (%s)", errors)
            return self.async_abort(reason="invalid_import_row")
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
                    for row in rows:
                        self.hass.async_create_task(
                            self.hass.config_entries.flow.async_init(
                                DOMAIN, context={"source": SOURCE_IMPORT}, data=row
                            )
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

    async def async_step_hub_menu(self, user_input=None):
        return self.async_show_menu(step_id="hub_menu", menu_options=["import_csv", "delete_all"])

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
