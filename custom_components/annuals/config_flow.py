from __future__ import annotations

import csv
from datetime import date, datetime, timedelta
import io
import logging
import re

import holidays as holidays_lib
from icalendar import Calendar
import vobject
import voluptuous as vol

from homeassistant.components.file_upload import process_uploaded_file
from homeassistant.components.http.auth import async_sign_path
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
    CONF_IMPORT_SOURCE,
    CONF_LANGUAGE,
    CONF_LAST_NAME,
    CONF_MONTH,
    CONF_SUBDIVISION,
    CONF_VIP,
    CONF_YEAR,
    DEFAULT_IMPORTANT_THRESHOLDS,
    DOMAIN,
    EVENT_TYPES,
    HUB_UNIQUE_ID,
    MILESTONE_EVENT_TYPES,
    TYPE_BIRTHDAY,
    TYPE_CUSTOM,
    TYPE_HOLIDAY,
    TYPE_ONE_TIME,
    TYPE_WEDDING_ANNIVERSARY,
)
from .dates import _holiday_calendar, holiday_key_from_name
from .helpers import async_event_type_labels, export_csv_text, full_name, hub_title
from .http import EXPORT_CSV_URL

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
            # Optional - lets a compact dashboard card show the first name
            # only (the existing "name" field/attribute, unchanged) while
            # still keeping the full name available for entry titles,
            # calendar messages, and the card's {last_name}/{full_name}
            # placeholders. Never offered for TYPE_HOLIDAY - that type never
            # reaches this schema at all (see EVENT_TYPES above), holidays
            # keep the single imported name as-is. No default= - same reason
            # as CONF_YEAR below: the frontend omits an emptied optional
            # field from the submitted payload, so a schema default= would
            # make voluptuous silently refill it with the old stored value,
            # making it impossible to actually clear a last name once set.
            vol.Optional(
                CONF_LAST_NAME,
                description={"suggested_value": defaults.get(CONF_LAST_NAME)},
            ): str,
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

    # Unlike every other type, a one-time event (see TYPE_ONE_TIME in
    # const.py) has no "unknown year" concept - its whole point is a single,
    # exact, fixed date, so the year field that's optional for every other
    # type is mandatory here.
    if user_input[CONF_EVENT_TYPE] == TYPE_ONE_TIME and year is None:
        errors[CONF_YEAR] = "year_required"
        return None, errors

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
        CONF_LAST_NAME: user_input.get(CONF_LAST_NAME, "").strip(),
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
    vip (optional), last_name (optional). `type` must be one of the internal
    English keys (e.g. "birthday"), case-insensitively - translated labels
    are deliberately not accepted, so the same file works regardless of the
    server's language. `vip` accepts 1/true/yes/y/x (case-insensitive);
    anything else (including a missing column) means not VIP. `last_name`
    is never applied to holiday-type rows in practice, since holidays are
    never CSV-imported (see EVENT_TYPES) - not worth rejecting the column
    if present, just meaningless for those rows.
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

        # Same "year is mandatory" rule as the manual add-event form - see
        # _validate_and_normalise.
        if event_type == TYPE_ONE_TIME and year is None:
            errors.append(f"line {line_no}: one-time events require a year")
            continue

        rows.append(
            {
                CONF_EVENT_NAME: name,
                CONF_LAST_NAME: row.get("last_name", ""),
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


# Anything at or below Google's own "unknown birth year" sentinel (1604) is
# treated as no year at all, matching this integration's existing convention
# of an absent year meaning "unknown" (see CONF_YEAR in const.py). Shared by
# both the ICS and vCard parsers.
_UNKNOWN_YEAR_THRESHOLD = 1605

# Best-effort strip of a common "<Name>'s Birthday"-style phrase so the
# remainder is (usually) just the contact's name - not exhaustive across every
# language a source calendar might use. Whatever's left over is still fully
# editable in the review step, so an imperfect match here is never fatal.
_ICS_NAME_PATTERNS = [
    re.compile(r"^(.*?)'s [Bb]irthday$"),
    re.compile(r"^(.*?)s Geburtstag$"),
    re.compile(r"^Geburtstag von (.*?)$"),
    re.compile(r"^(.*?) [Bb]irthday$"),
]


def _strip_birthday_phrase(summary: str) -> str:
    text = summary.strip()
    for pattern in _ICS_NAME_PATTERNS:
        match = pattern.match(text)
        if match:
            return match.group(1).strip()
    return text


# Matches a plausible birth year (1800-2099) surrounded by non-digits, so it
# doesn't grab a fragment of a longer number - used to pull a year out of an
# ICS event's free-text DESCRIPTION (e.g. "geb. 1985", "*1990", "DOB:
# 12.03.1988") for the optional "use description year" import setting.
_YEAR_IN_TEXT_PATTERN = re.compile(r"(?<!\d)(1[89]\d{2}|20\d{2})(?!\d)")


def _extract_year_from_text(text: str) -> int | None:
    """Best-effort: the first plausible year found anywhere in free text.
    Purely heuristic - a description mentioning an unrelated 4-digit number
    (e.g. a work anniversary "since 2015") can produce a false match, which
    is why this is opt-in and every row stays fully editable in review.
    """
    if not text:
        return None
    match = _YEAR_IN_TEXT_PATTERN.search(text)
    return int(match.group(1)) if match else None


def _split_name(name: str) -> tuple[str, str]:
    """Split "Anna Maria Miller" into ("Anna Maria", "Miller") - split on the
    last space, since that's the only heuristic that works without knowing the
    actual number of given names. No space at all means "first name only".
    """
    name = name.strip()
    if " " not in name:
        return name, ""
    first, _sep, last = name.rpartition(" ")
    return first.strip(), last.strip()


def _parse_ics_bytes(data: bytes) -> tuple[list[dict], list[str]]:
    """Parse ICS bytes into candidate rows for the review step, plus a list of
    human-readable skip reasons for entries deliberately left out (a timed
    event, a recurrence override, or an unparseable date) - mirrors
    _parse_csv_rows' (rows, errors) shape.

    Only all-day VEVENTs are candidates - birthdays are never timed, so a real
    time component means this isn't a birthday-style entry. Only the master
    VEVENT per UID is used; RECURRENCE-ID override instances are skipped
    (accepted limitation - good enough for a yearly-recurring birthday).
    """
    try:
        calendar = Calendar.from_ical(data)
    except ValueError as err:
        return [], [f"could not parse calendar: {err}"]

    rows: list[dict] = []
    errors: list[str] = []
    seen_uids: set[str] = set()

    for component in calendar.walk("VEVENT"):
        uid = str(component.get("uid", ""))
        summary = str(component.get("summary", "")).strip()
        label = summary or uid or "(unnamed event)"

        if component.get("recurrence-id") is not None:
            errors.append(f"{label}: skipped recurrence override")
            continue
        if uid and uid in seen_uids:
            errors.append(f"{label}: skipped duplicate UID")
            continue

        dtstart = component.get("dtstart")
        value = dtstart.dt if dtstart is not None else None
        if isinstance(value, datetime):
            errors.append(f"{label}: skipped timed (non-all-day) event")
            continue
        if not isinstance(value, date):
            errors.append(f"{label}: missing or unparseable start date")
            continue

        if uid:
            seen_uids.add(uid)

        first_name, last_name = _split_name(_strip_birthday_phrase(summary))
        if not first_name and not last_name:
            errors.append(f"{label}: skipped - no name")
            continue

        year = value.year if value.year >= _UNKNOWN_YEAR_THRESHOLD else None
        description = str(component.get("description", "")).strip()

        rows.append(
            {
                "uid": uid,
                "summary": summary,
                "day": value.day,
                "month": value.month,
                "year": year,
                "first_name": first_name,
                "last_name": last_name,
                # Preserved separately from "year" (the currently-effective
                # value, editable in review) so the "use description year"
                # import setting can be toggled on and off without losing
                # either candidate - see async_step_import_options.
                "dtstart_year": year,
                "description_year": _extract_year_from_text(description),
            }
        )

    return rows, errors


def _parse_uploaded_ics(hass: HomeAssistant, uploaded_file_id: str) -> tuple[list[dict], list[str]]:
    with process_uploaded_file(hass, uploaded_file_id) as file_path:
        data = file_path.read_bytes()
    return _parse_ics_bytes(data)


def _ics_schema() -> vol.Schema:
    return vol.Schema({vol.Required("ics_file"): selector({"file": {"accept": ".ics"}})})


def _parse_vcard_bday(raw: str) -> tuple[int, int, int | None] | None:
    """"YYYY-MM-DD"/"YYYYMMDD" -> a full date. "--MM-DD"/"--MMDD" - vCard's
    own defined "year unknown" form, RFC 6474 - -> (day, month, None), no
    guessing needed unlike ICS. Also treats a suspiciously old year as
    unknown, same threshold as the ICS import, for messy real-world exports.
    """
    digits = raw.split("T", 1)[0].replace("-", "").strip()
    try:
        if len(digits) == 8:
            year, month, day = int(digits[0:4]), int(digits[4:6]), int(digits[6:8])
            date(year, month, day)
            return day, month, (year if year >= _UNKNOWN_YEAR_THRESHOLD else None)
        if len(digits) == 4:
            month, day = int(digits[0:2]), int(digits[2:4])
            date(2000, month, day)
            return day, month, None
    except (ValueError, IndexError):
        return None
    return None


def _vcard_name_parts(vcard, fn: str) -> tuple[str, str]:
    """Prefer the structured N property (Family;Given;Additional;...) - a
    real split, not a guess. Falls back to splitting FN on the last space
    (_split_name, also used for ICS) only when N is absent or empty.
    """
    if hasattr(vcard, "n"):
        name = vcard.n.value
        given = " ".join(p for p in (name.given, name.additional) if p).strip()
        family = (name.family or "").strip()
        if given or family:
            return given, family
    return _split_name(fn)


def _parse_vcard_bytes(data: bytes) -> tuple[list[dict], list[str]]:
    """Mirrors _parse_ics_bytes' (rows, errors) shape exactly, so the shared
    options/review/finalize pipeline needs no source-specific branching.
    """
    try:
        text = data.decode("utf-8-sig")
        components = list(vobject.readComponents(text, ignoreUnreadable=True))
    except Exception as err:  # vobject has no single documented exception type
        return [], [f"could not parse vCard file: {err}"]

    rows: list[dict] = []
    errors: list[str] = []
    seen: set[str] = set()

    for vcard in components:
        if getattr(vcard, "name", "").upper() != "VCARD":
            continue
        fn = str(vcard.fn.value).strip() if hasattr(vcard, "fn") else ""
        uid = str(vcard.uid.value).strip() if hasattr(vcard, "uid") else ""
        label = fn or uid or "(unnamed contact)"

        key = uid or fn
        if key and key in seen:
            errors.append(f"{label}: skipped duplicate entry")
            continue
        if not hasattr(vcard, "bday"):
            errors.append(f"{label}: no birthday set")
            continue

        parsed = _parse_vcard_bday(str(vcard.bday.value).strip())
        if parsed is None:
            errors.append(f"{label}: unparseable birthday ({vcard.bday.value!r})")
            continue

        first_name, last_name = _vcard_name_parts(vcard, fn)
        if not first_name and not last_name:
            errors.append(f"{label}: skipped - no name")
            continue

        if key:
            seen.add(key)

        day, month, year = parsed

        rows.append(
            {
                "uid": uid,
                "summary": fn or f"{first_name} {last_name}".strip(),
                "day": day,
                "month": month,
                "year": year,
                "first_name": first_name,
                "last_name": last_name,
            }
        )

    return rows, errors


def _parse_uploaded_vcard(hass: HomeAssistant, uploaded_file_id: str) -> tuple[list[dict], list[str]]:
    with process_uploaded_file(hass, uploaded_file_id) as file_path:
        data = file_path.read_bytes()
    return _parse_vcard_bytes(data)


def _vcard_schema() -> vol.Schema:
    return vol.Schema({vol.Required("vcard_file"): selector({"file": {"accept": ".vcf"}})})


# Apple wraps its own built-in date/label choices as "_$!<Anniversary>!$_" -
# a convention only Contacts.app itself is meant to interpret. Anything typed
# in by hand as a custom label is already plain text and passes through
# unchanged.
_APPLE_LABEL_PATTERN = re.compile(r"^_\$!<(.+)>!\$_$")


def _clean_vcard_label(raw: str) -> str:
    match = _APPLE_LABEL_PATTERN.match(raw.strip())
    return match.group(1) if match else raw.strip()


def _default_type_for_label(label: str) -> str:
    """Best-effort default for the per-row event type selector - always
    editable in review, so a wrong guess here is never fatal."""
    return TYPE_WEDDING_ANNIVERSARY if "annivers" in label.casefold() else TYPE_CUSTOM


def _extract_vcard_other_dates(vcard) -> list[tuple[str, str]]:
    """(raw_date_value, cleaned_label) pairs for every date on this contact
    except BDAY: the standard vCard 4.0 ANNIVERSARY property, plus each
    Apple/Google "custom date" - an item<N>.X-ABDATE grouped with its own
    item<N>.X-ABLABEL, matched up via vobject's shared .group attribute.
    """
    results: list[tuple[str, str]] = []
    if hasattr(vcard, "anniversary"):
        results.append((str(vcard.anniversary.value).strip(), "Anniversary"))

    labels_by_group = {
        child.group: str(child.value).strip()
        for child in vcard.getChildren()
        if child.name == "X-ABLABEL" and child.group
    }
    for child in vcard.getChildren():
        if child.name == "X-ABDATE" and child.group:
            label = _clean_vcard_label(labels_by_group.get(child.group, "Other"))
            results.append((str(child.value).strip(), label))
    return results


def _parse_vcard_other_dates_bytes(data: bytes) -> tuple[list[dict], list[str]]:
    """Mirrors _parse_vcard_bytes' (rows, errors) shape, but yields zero or
    more rows per contact - one per detected non-birthday date - each
    carrying its own suggested "event_type" (see _default_type_for_label),
    edited per-row in review instead of one type for the whole batch (unlike
    every other import row shape, which shares a single batch-wide type).
    """
    try:
        text = data.decode("utf-8-sig")
        components = list(vobject.readComponents(text, ignoreUnreadable=True))
    except Exception as err:  # vobject has no single documented exception type
        return [], [f"could not parse vCard file: {err}"]

    rows: list[dict] = []
    errors: list[str] = []
    seen: set[str] = set()

    for vcard in components:
        if getattr(vcard, "name", "").upper() != "VCARD":
            continue
        fn = str(vcard.fn.value).strip() if hasattr(vcard, "fn") else ""
        uid = str(vcard.uid.value).strip() if hasattr(vcard, "uid") else ""
        label = fn or uid or "(unnamed contact)"
        contact_key = uid or fn

        first_name, last_name = _vcard_name_parts(vcard, fn)

        for raw_value, detected_label in _extract_vcard_other_dates(vcard):
            # Keyed on the contact plus the specific date, not just the
            # contact - a single vCard legitimately contributes several rows
            # here (e.g. ANNIVERSARY and two X-ABDATE entries), which must
            # not be treated as duplicates of each other. A genuinely
            # repeated vCard block (same contact twice in the file) still
            # collapses, since it produces the same (contact, label) keys.
            dedup_key = f"{contact_key}:{detected_label}" if contact_key else None
            if dedup_key and dedup_key in seen:
                errors.append(f"{label} ({detected_label}): skipped duplicate entry")
                continue

            parsed = _parse_vcard_bday(raw_value)
            if parsed is None:
                errors.append(f"{label} ({detected_label}): unparseable date ({raw_value!r})")
                continue

            if not first_name and not last_name:
                errors.append(f"{label} ({detected_label}): skipped - no name")
                continue

            if dedup_key:
                seen.add(dedup_key)

            day, month, year = parsed
            rows.append(
                {
                    "uid": uid,
                    "summary": fn or f"{first_name} {last_name}".strip(),
                    "day": day,
                    "month": month,
                    "year": year,
                    "first_name": first_name,
                    "last_name": last_name,
                    "detected_label": detected_label,
                    "event_type": _default_type_for_label(detected_label),
                }
            )

    return rows, errors


def _parse_uploaded_vcard_other_dates(
    hass: HomeAssistant, uploaded_file_id: str
) -> tuple[list[dict], list[str]]:
    with process_uploaded_file(hass, uploaded_file_id) as file_path:
        data = file_path.read_bytes()
    return _parse_vcard_other_dates_bytes(data)


def _import_options_schema(
    defaults: dict | None = None,
    *,
    include_description_year: bool = False,
    include_event_type: bool = True,
) -> vol.Schema:
    defaults = defaults or {}
    schema_dict: dict = {
        vol.Optional(
            "swap_names", default=defaults.get("swap_names", False)
        ): selector({"boolean": {}}),
    }
    if include_description_year:
        # ICS-only - vCard rows never carry a "description_year" candidate,
        # so this field is omitted from the schema entirely for that source
        # rather than shown as a no-op.
        schema_dict[
            vol.Optional(
                "use_description_year",
                default=defaults.get("use_description_year", False),
            )
        ] = selector({"boolean": {}})
    if include_event_type:
        # Omitted when every row picks its own type in review instead (the
        # vCard "other dates" branch) - a single batch-wide type wouldn't
        # apply there.
        schema_dict[
            vol.Required(CONF_EVENT_TYPE, default=defaults.get(CONF_EVENT_TYPE, TYPE_BIRTHDAY))
        ] = _event_type_selector()
    return vol.Schema(schema_dict)


# How many entries the review step shows per page - reusing the same step_id
# repeatedly with an incrementing self._import_review_page instead of
# rendering every parsed entry (potentially a whole contacts list) in one
# unbounded form. Shared by both the ICS and vCard import wizards.
_IMPORT_REVIEW_PAGE_SIZE = 20


def _find_import_duplicate(
    hass: HomeAssistant, event_type: str, day: int, month: int, first_name: str, last_name: str
) -> ConfigEntry | None:
    """Look for an existing (non-hub) entry of the same type that's probably
    the same person as the proposed row - two tiers, first match wins:

    1. Same day/month, and the combined name overlaps (substring either
       direction, not equality - deliberately looser than _import_unique_id's
       exact match, so it also catches e.g. an existing "Anna" matching a new
       "Anna Miller" on the same day, a case the exact dedup would treat as
       unrelated and create as a genuine new entry).
    2. Regardless of day/month, an exact (case-insensitive) full-name match -
       catches the same person under a different date (a source calendar
       error, a corrected birth year changing nothing else, two imports
       disagreeing on the date), which tier 1 alone would silently miss and
       create as an unrelated duplicate entry.
    """
    new_full = f"{first_name} {last_name}".strip().casefold()
    if not new_full:
        return None
    exact_name_match: ConfigEntry | None = None
    for entry in hass.config_entries.async_entries(DOMAIN):
        data = entry.data
        if data.get(CONF_HUB) or data.get(CONF_EVENT_TYPE) != event_type:
            continue
        existing_full = full_name(data).casefold()
        if not existing_full:
            continue
        if data.get(CONF_DAY) == day and data.get(CONF_MONTH) == month:
            if existing_full in new_full or new_full in existing_full:
                return entry
        elif existing_full == new_full and exact_name_match is None:
            exact_name_match = entry
    return exact_name_match


def _ics_force_new_key(index: int, existing_full: str) -> str:
    return f'{index + 1}. Create as a new entry instead of updating "{existing_full}"'


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
    # Keyed on the first/only name alone, not full_name() - deliberately,
    # so that adding a last name to a row that was already being synced
    # without one (or correcting it) still matches and updates the same
    # entry, instead of the identity shifting and creating a duplicate.
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
    """One row per distinct holiday across the given category(ies), for the
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

    Many countries/subdivisions also define the *same* holiday under more
    than one category at once (e.g. several US states list their statutory
    holidays as both "government" and "public") - often under a slightly
    *different* name per category too (e.g. "Washington's Birthday" in
    "government" vs. "Washington and Lincoln Day" in "public", or "Birthday
    of Martin Luther King, Jr." vs. "Martin Luther King Jr. Day" - confirmed
    against the `holidays` library for US/UT), so the name-derived key above
    can't recognise them as the same holiday. Selecting more than one such
    category would otherwise queue a duplicate row for the same day, which
    the unique_id dedup in AnnualsConfigFlow.async_step_import can't catch
    either, since it includes the category. So holidays are first resolved
    per category (for the multi-day collapsing above), then merged across
    every selected category *by date* - each calendar date ends up with only
    one row - since the date, not the name, is what actually identifies "the
    same holiday" across categories. "public" always wins that merge over
    any other category, since it's the most broadly meaningful
    classification when a date qualifies as both; a tie between two
    non-public categories keeps whichever was selected first. (Two
    genuinely-different holidays from different categories coinciding on
    the same date - rather than being the same holiday listed twice - would
    also collapse to one row here, but that's a rare coincidence next to how
    common the same-holiday-two-categories case is.)

    Keyed for identity (CONF_HOLIDAY_KEY) using the *default*-language name
    of whichever category's entry won the merge above, with any
    "(observed)"/"(estimated)" suffix stripped (see
    dates.holiday_key_from_name) - kept separate from the *display* name,
    which uses whatever language was actually requested. Both come from the
    same underlying dates so they always describe the same holiday, even
    though matching happens by date, not by name.
    """
    year = date.today().year
    # occurrence date -> (category, holiday_key, display_name)
    chosen: dict[date, tuple[str, str, str]] = {}

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
            display_name = display_cal.get(occurrence, default_name)
            existing = chosen.get(occurrence)
            if existing is None or (category == "public" and existing[0] != "public"):
                chosen[occurrence] = (category, key, display_name)

    rows: list[dict] = []
    for category, key, display_name in chosen.values():
        rows.append(
            {
                CONF_EVENT_NAME: display_name,
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
    """Type-prefixed entry title, e.g. "Geburtstag: Anna Miller" (or just
    "Geburtstag: Anna" with no last name set) - the prefix makes the
    alphabetically-sorted entry list on the integration page group by type,
    and the search box match on any part of the name, first or last.
    """
    labels = await async_event_type_labels(hass)
    label = labels[data[CONF_EVENT_TYPE]]
    return f"{label}: {full_name(data)}"


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

        # _validate_and_normalise(_holiday) rebuilds `data` from a fixed set
        # of keys, dropping anything else in import_data - re-attach the
        # import-source marker (see AnnualsOptionsFlow.async_step_import_review)
        # here rather than there, so it survives.
        if CONF_IMPORT_SOURCE in import_data:
            data[CONF_IMPORT_SOURCE] = import_data[CONF_IMPORT_SOURCE]

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

    async def async_step_import_ics(self, user_input=None):
        """Step 1 of 3: upload an ICS calendar (e.g. a phone's exported
        Birthdays calendar) and parse it into candidate rows.

        No entries are created here - parsed rows are stashed on the flow
        instance and handed to the shared async_step_import_options next
        (also used by vCard import), so the user can review/correct the
        proposed name split before anything is actually imported (unlike CSV
        import, which imports directly).
        """
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                rows, row_errors = await self.hass.async_add_executor_job(
                    _parse_uploaded_ics, self.hass, user_input["ics_file"]
                )
            except (OSError, ValueError):
                errors["base"] = "invalid_ics"
            else:
                for message in row_errors:
                    _LOGGER.warning("Annuals ICS import: %s", message)

                if not rows:
                    errors["base"] = "no_valid_entries"
                else:
                    for row in rows:
                        row["include"] = True
                    self._import_rows = rows
                    self._import_skipped = len(row_errors)
                    self._import_review_page = 0
                    self._import_swap_applied = False
                    self._import_use_description_year = False
                    self._import_row_type_mode = False
                    self._import_fixed_event_type = None
                    self._import_source = "ics"
                    self._import_source_label = "ICS"
                    return await self.async_step_import_options()

        return self.async_show_form(
            step_id="import_ics",
            data_schema=_ics_schema(),
            errors=errors,
            last_step=False,
        )

    async def async_step_import_vcard_menu(self, user_input=None):
        """Entry point for vCard import - a contact's birthday and its other
        dates (anniversaries, custom dates) go through different branches of
        the wizard, since only birthdays share a single batch-wide event
        type (see async_step_import_vcard_other_dates).
        """
        return self.async_show_menu(
            step_id="import_vcard_menu",
            menu_options=["import_vcard", "import_vcard_other_dates"],
        )

    async def async_step_import_vcard(self, user_input=None):
        """Step 1 of 3: upload a vCard (.vcf) export (e.g. from a phone's
        Contacts app) and parse it into candidate rows.

        Unlike ICS, vCard has a structured N (name) property and a BDAY
        property with its own defined "year unknown" form - see
        _vcard_name_parts/_parse_vcard_bday - so no guessing is needed there.
        From here on it's the exact same shared wizard as ICS import.
        """
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                rows, row_errors = await self.hass.async_add_executor_job(
                    _parse_uploaded_vcard, self.hass, user_input["vcard_file"]
                )
            except (OSError, ValueError):
                errors["base"] = "invalid_vcard"
            else:
                for message in row_errors:
                    _LOGGER.warning("Annuals vCard import: %s", message)

                if not rows:
                    errors["base"] = "no_valid_vcard_entries"
                else:
                    for row in rows:
                        row["include"] = True
                    self._import_rows = rows
                    self._import_skipped = len(row_errors)
                    self._import_review_page = 0
                    self._import_swap_applied = False
                    self._import_use_description_year = False
                    self._import_row_type_mode = False
                    # Always birthdays here (that's the whole point of this
                    # branch vs. "other dates") - no batch-wide type choice
                    # needed, unlike ICS where the source calendar isn't
                    # necessarily birthdays specifically.
                    self._import_fixed_event_type = TYPE_BIRTHDAY
                    self._import_source = "vcard"
                    self._import_source_label = "vCard"
                    return await self.async_step_import_options()

        return self.async_show_form(
            step_id="import_vcard",
            data_schema=_vcard_schema(),
            errors=errors,
            last_step=False,
        )

    async def async_step_import_vcard_other_dates(self, user_input=None):
        """Step 1 of 3 (other-dates branch): upload a vCard (.vcf) export and
        parse it into candidate rows for every date *except* birthdays - the
        standard ANNIVERSARY property, plus Apple/Google's "custom date"
        item<N>.X-ABDATE/X-ABLABEL pairs (see _extract_vcard_other_dates).

        Unlike every other import branch, each row here can end up a
        different event type (an anniversary and an arbitrary custom date
        aren't the same thing) - self._import_row_type_mode gates the
        shared options/review steps into showing a per-row type selector
        instead of one type for the whole batch.
        """
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                rows, row_errors = await self.hass.async_add_executor_job(
                    _parse_uploaded_vcard_other_dates, self.hass, user_input["vcard_file"]
                )
            except (OSError, ValueError):
                errors["base"] = "invalid_vcard"
            else:
                for message in row_errors:
                    _LOGGER.warning("Annuals vCard import: %s", message)

                if not rows:
                    errors["base"] = "no_valid_vcard_dates"
                else:
                    for row in rows:
                        row["include"] = True
                    self._import_rows = rows
                    self._import_skipped = len(row_errors)
                    self._import_review_page = 0
                    self._import_swap_applied = False
                    self._import_use_description_year = False
                    self._import_row_type_mode = True
                    self._import_fixed_event_type = None
                    self._import_source = "vcard"
                    self._import_source_label = "vCard"
                    return await self.async_step_import_options()

        return self.async_show_form(
            step_id="import_vcard_other_dates",
            data_schema=_vcard_schema(),
            errors=errors,
            last_step=False,
        )

    async def async_step_import_options(self, user_input=None):
        """Step 2 of 3 (shared by ICS and vCard import): global settings
        applied to every parsed entry before the per-entry review step first
        renders - a swap here must be decided before those fields are first
        prefilled, since a flow step can't reactively re-render itself when a
        checkbox changes.

        Also the review step's back-button target from its first page, in
        which case the current choices are prefilled rather than reset.
        """
        if user_input is not None:
            swap_requested = bool(user_input.get("swap_names"))
            # Toggled *relative to* the currently-applied state, not a reset
            # to the original parse - correct whether this is the first time
            # through or a return visit via the back button, and never
            # double-swaps (or undoes a manual edit made in between) if the
            # user just confirms the same choice again.
            if swap_requested != self._import_swap_applied:
                for row in self._import_rows:
                    row["first_name"], row["last_name"] = row["last_name"], row["first_name"]
                self._import_swap_applied = swap_requested

            # Same toggle-relative-to-applied-state approach as swap above -
            # only touches "year" when the choice actually changes, so a
            # manual year edit made in a previous visit to review survives
            # re-confirming the same choice on a later back-navigation.
            use_description_year_requested = bool(user_input.get("use_description_year"))
            if use_description_year_requested != getattr(
                self, "_import_use_description_year", False
            ):
                for row in self._import_rows:
                    if use_description_year_requested:
                        if row.get("description_year") is not None:
                            row["year"] = row["description_year"]
                    elif "dtstart_year" in row:
                        row["year"] = row["dtstart_year"]
                self._import_use_description_year = use_description_year_requested

            if self._import_fixed_event_type:
                self._import_event_type = self._import_fixed_event_type
            elif not self._import_row_type_mode:
                self._import_event_type = user_input[CONF_EVENT_TYPE]
            return await self.async_step_import_review()

        return self.async_show_form(
            step_id="import_options",
            data_schema=_import_options_schema(
                {
                    "swap_names": self._import_swap_applied,
                    "use_description_year": getattr(
                        self, "_import_use_description_year", False
                    ),
                    CONF_EVENT_TYPE: getattr(self, "_import_event_type", TYPE_BIRTHDAY),
                },
                include_description_year=(self._import_source == "ics"),
                include_event_type=not (self._import_row_type_mode or self._import_fixed_event_type),
            ),
            description_placeholders={"source_label": self._import_source_label},
            last_step=False,
        )

    def _import_review_field_keys(self, index: int, row: dict) -> dict[str, str]:
        # Built as the literal, readable label text itself rather than a
        # translation-lookup key - strings.json has no way to express N
        # per-index labels for an arbitrarily long, dynamically parsed list,
        # and HA's flow forms show a field's raw schema key verbatim when no
        # translation string matches it (same trick as _HUB_TITLE_WORD in
        # helpers.py, used there for the same "can't route through
        # strings.json" reason). English-only by construction - see README.
        return {
            "include": f"{index + 1}. Import this entry",
            "first": f'{index + 1}. First name (was: "{row["summary"]}")',
            "last": f"{index + 1}. Last name",
            "day": f"{index + 1}. Day",
            "month": f"{index + 1}. Month",
            "year": f"{index + 1}. Year (leave empty if unknown)",
            "type": f'{index + 1}. Event type (detected label: "{row.get("detected_label")}")',
        }

    async def async_step_import_review(self, user_input=None):
        """Step 3 of 3 (shared by ICS and vCard import, repeated per page):
        review/edit a page of entries, or finish and import on the last page.

        Reuses this same step_id across pages instead of rendering every
        parsed entry in one unbounded form - large contact lists stay
        reviewable a page at a time. A "go back" field (top of the form)
        returns to the previous page, or to the options step from page one.
        """
        start = self._import_review_page * _IMPORT_REVIEW_PAGE_SIZE
        page = list(enumerate(self._import_rows))[start : start + _IMPORT_REVIEW_PAGE_SIZE]
        is_last_page = start + _IMPORT_REVIEW_PAGE_SIZE >= len(self._import_rows)

        if user_input is not None:
            for index, row in page:
                keys = self._import_review_field_keys(index, row)
                row["first_name"] = (user_input.get(keys["first"]) or "").strip()
                row["last_name"] = (user_input.get(keys["last"]) or "").strip()
                day_raw = user_input.get(keys["day"])
                row["day"] = int(day_raw) if day_raw is not None else row["day"]
                month_raw = user_input.get(keys["month"])
                row["month"] = int(month_raw) if month_raw is not None else row["month"]
                year_raw = user_input.get(keys["year"])
                row["year"] = int(year_raw) if year_raw not in (None, "") else None
                row["include"] = bool(user_input.get(keys["include"], True))
                if self._import_row_type_mode:
                    row["event_type"] = user_input.get(keys["type"], row["event_type"])
                if row.get("duplicate_of"):
                    force_new_key = _ics_force_new_key(index, row["duplicate_of_label"])
                    row["force_new"] = bool(user_input.get(force_new_key, False))

            if user_input.get("go_back"):
                if self._import_review_page > 0:
                    self._import_review_page -= 1
                    return await self.async_step_import_review()
                return await self.async_step_import_options()

            if not is_last_page:
                self._import_review_page += 1
                return await self.async_step_import_review()

            created = 0
            updated = 0
            for row in self._import_rows:
                if not row.get("include"):
                    continue
                candidate = {
                    CONF_EVENT_NAME: row["first_name"],
                    CONF_LAST_NAME: row["last_name"],
                    CONF_EVENT_TYPE: row.get("event_type") or self._import_event_type,
                    CONF_DAY: row["day"],
                    CONF_MONTH: row["month"],
                    CONF_YEAR: row["year"],
                    CONF_ICON: "",
                    CONF_VIP: False,
                }
                data, errors = _validate_and_normalise(candidate)
                if data is None:
                    _LOGGER.warning(
                        "Annuals %s import: skipped invalid row (%s)", self._import_source, errors
                    )
                    continue

                duplicate_entry_id = row.get("duplicate_of")
                if duplicate_entry_id and not row.get("force_new"):
                    entry = self.hass.config_entries.async_get_entry(duplicate_entry_id)
                    if entry is not None:
                        title = await _entry_title(self.hass, data)
                        self.hass.config_entries.async_update_entry(entry, title=title, data=data)
                        self.hass.config_entries.async_schedule_reload(entry.entry_id)
                        updated += 1
                        continue

                # Marks this as created by this import specifically (unlike
                # an update above, which leaves whatever the matched entry
                # already was untouched) - see "Remove ICS/vCard-imported
                # events".
                data[CONF_IMPORT_SOURCE] = self._import_source
                # Awaited sequentially, not fired off via async_create_task -
                # see the matching comment in async_step_import_csv on why:
                # each row's unique_id dedup check must see every earlier row
                # already committed, or two rows that should collapse into
                # one entry could each independently create a duplicate.
                await self.hass.config_entries.flow.async_init(
                    DOMAIN, context={"source": SOURCE_IMPORT}, data=data
                )
                created += 1

            skipped = len(self._import_rows) - created - updated + self._import_skipped
            return self.async_abort(
                reason="ics_import_started",
                description_placeholders={
                    "created": str(created),
                    "updated": str(updated),
                    "skipped": str(skipped),
                },
            )

        legend_lines = []
        schema_dict: dict = {vol.Optional("go_back", default=False): selector({"boolean": {}})}
        for index, row in page:
            keys = self._import_review_field_keys(index, row)
            year_str = str(row["year"]) if row["year"] else "?"
            # "•" prefix is deliberate - the description is rendered as
            # Markdown, and a line starting with "<number>. " is parsed as an
            # ordered-list item and renumbered from 1 regardless of the
            # literal digit typed here, which would show 1, 2, 3... instead
            # of the correct 21, 22, 23... on page 2+. Prefixing with a
            # non-list-marker character keeps the real index visible as-is.
            label_suffix = f' ({row["detected_label"]})' if self._import_row_type_mode else ""
            line = (
                f'• {index + 1}. "{row["summary"]}" → '
                f'{row["day"]:02d}.{row["month"]:02d}.{year_str}{label_suffix}'
            )

            duplicate = _find_import_duplicate(
                self.hass,
                row.get("event_type") or self._import_event_type,
                row["day"],
                row["month"],
                row["first_name"],
                row["last_name"],
            )
            include_label = keys["include"]
            if duplicate is not None:
                existing_full = full_name(duplicate.data)
                row["duplicate_of"] = duplicate.entry_id
                row["duplicate_of_label"] = existing_full
                warning = f' — ⚠ possible duplicate of existing "{existing_full}"'
                existing_day = duplicate.data.get(CONF_DAY)
                existing_month = duplicate.data.get(CONF_MONTH)
                if (existing_day, existing_month) != (row["day"], row["month"]):
                    # Same name, different date - matched via the exact
                    # name-only fallback in _find_import_duplicate, not the
                    # day/month-based match, so the date mismatch itself
                    # needs calling out or this warning looks like a bug.
                    warning += f" (existing entry is on {existing_day:02d}.{existing_month:02d})"
                line += warning
                include_label += warning
            else:
                row.pop("duplicate_of", None)
                row.pop("duplicate_of_label", None)
            legend_lines.append(line)

            schema_dict[
                vol.Optional(include_label, default=row.get("include", True))
            ] = selector({"boolean": {}})
            if duplicate is not None:
                force_new_key = _ics_force_new_key(index, existing_full)
                schema_dict[
                    vol.Optional(force_new_key, default=row.get("force_new", False))
                ] = selector({"boolean": {}})
            schema_dict[vol.Optional(keys["first"], default=row["first_name"])] = str
            # No default= here - same reason as the year field just below
            # (and the standalone event form's own last_name field): an
            # emptied optional field is omitted from the submitted payload,
            # so a schema default= would make voluptuous silently refill it
            # with the old last name, making it impossible to actually clear
            # one during review.
            schema_dict[
                vol.Optional(keys["last"], description={"suggested_value": row["last_name"]})
            ] = str
            schema_dict[vol.Optional(keys["day"], default=row["day"])] = selector(
                {"number": {"min": 1, "max": 31, "mode": "box"}}
            )
            schema_dict[vol.Optional(keys["month"], default=str(row["month"]))] = _month_selector()
            schema_dict[
                vol.Optional(keys["year"], description={"suggested_value": row["year"]})
            ] = selector({"number": {"min": 1, "max": 9999, "mode": "box"}})
            if self._import_row_type_mode:
                schema_dict[
                    vol.Optional(keys["type"], default=row["event_type"])
                ] = _event_type_selector()

        total_pages = (len(self._import_rows) + _IMPORT_REVIEW_PAGE_SIZE - 1) // _IMPORT_REVIEW_PAGE_SIZE
        return self.async_show_form(
            step_id="import_review",
            data_schema=vol.Schema(schema_dict),
            description_placeholders={
                "source_label": self._import_source_label,
                "page": str(self._import_review_page + 1),
                "total_pages": str(total_pages),
                "legend": "\n".join(legend_lines),
            },
            last_step=is_last_page,
        )

    async def async_step_remove_ics_imports(self, user_input=None):
        """Bulk-remove only the entries created by "Import events from ICS
        calendar" (CONF_IMPORT_SOURCE == "ics") - never entries an ICS import
        merely updated (see async_step_import_review's duplicate handling),
        manually added events, or CSV/vCard imports.
        """
        entries = [
            entry
            for entry in self.hass.config_entries.async_entries(DOMAIN)
            if entry.data.get(CONF_IMPORT_SOURCE) == "ics"
        ]
        if not entries:
            return self.async_abort(reason="no_ics_imports")

        if user_input is not None:
            for entry in entries:
                await self.hass.config_entries.async_remove(entry.entry_id)
            return self.async_abort(
                reason="ics_imports_removed",
                description_placeholders={"count": str(len(entries))},
            )

        return self.async_show_form(
            step_id="remove_ics_imports",
            data_schema=vol.Schema({}),
            description_placeholders={"count": str(len(entries))},
        )

    async def async_step_remove_vcard_imports(self, user_input=None):
        """Bulk-remove only the entries created by "Import events from vCard"
        (CONF_IMPORT_SOURCE == "vcard") - mirrors async_step_remove_ics_imports.
        """
        entries = [
            entry
            for entry in self.hass.config_entries.async_entries(DOMAIN)
            if entry.data.get(CONF_IMPORT_SOURCE) == "vcard"
        ]
        if not entries:
            return self.async_abort(reason="no_vcard_imports")

        if user_input is not None:
            for entry in entries:
                await self.hass.config_entries.async_remove(entry.entry_id)
            return self.async_abort(
                reason="vcard_imports_removed",
                description_placeholders={"count": str(len(entries))},
            )

        return self.async_show_form(
            step_id="remove_vcard_imports",
            data_schema=vol.Schema({}),
            description_placeholders={"count": str(len(entries))},
        )

    async def async_step_export_csv(self, user_input=None):
        """One-click export: no form, just a link to download the CSV as a
        real file. The link is a short-lived signed URL (AnnualsExportCsvView
        requires a session, which a flow's description text has no way to
        carry) pointing at the same export the file also gets embedded below
        as a copyable fallback, in case the link can't be opened for some
        reason. See services.py's export_csv action for the
        scriptable/host-file-writing equivalent.
        """
        csv_text, count = export_csv_text(self.hass)
        if count == 0:
            return self.async_abort(reason="no_events_to_export")
        download_url = async_sign_path(self.hass, EXPORT_CSV_URL, timedelta(minutes=5))
        return self.async_abort(
            reason="csv_exported",
            description_placeholders={"count": str(count), "csv": csv_text, "url": download_url},
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
            for (country, subdivision), entries in sorted(
                groups.items(), key=lambda item: (item[0][0], item[0][1] or "")
            )
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
        # Icons are supplied here rather than baked into each translation
        # string, so every language renders them identically and adding/
        # changing an icon never requires touching all 15 translation files.
        return self.async_show_menu(
            step_id="hub_menu",
            menu_options=[
                "annual_settings",
                "import_events",
                "export_csv",
                "remove_events",
                "delete_all",
            ],
            description_placeholders={
                "icon_annual_settings": "⚙️",
                "icon_import_events": "📥",
                "icon_export_csv": "📤",
                "icon_remove_events": "🗑️",
                "icon_delete_all": "❌",
            },
        )

    async def async_step_import_events(self, user_input=None):
        """Single hub menu entry for every import source - routes to the
        existing, unchanged wizards (CSV imports directly; ICS and vCard go
        through their own multi-step review wizard; vCard branches once more
        into birthdays vs. other dates - see async_step_import_vcard_menu).
        """
        return self.async_show_menu(
            step_id="import_events",
            menu_options=["import_csv", "import_ics", "import_vcard_menu", "import_holidays"],
        )

    async def async_step_remove_events(self, user_input=None):
        """Single hub menu entry for every "remove imported X" action."""
        return self.async_show_menu(
            step_id="remove_events",
            menu_options=["remove_ics_imports", "remove_vcard_imports", "remove_holidays"],
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
                    for event_type in MILESTONE_EVENT_TYPES
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
                for event_type in MILESTONE_EVENT_TYPES
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
