DOMAIN = "annuals"

# Marks the single auto-created "Annuals" hub entry that owns the shared,
# cross-event entities (the per-type calendars, and any future global
# entities) - as opposed to the per-event entries, which own one sensor each.
CONF_HUB = "hub"
HUB_UNIQUE_ID = "annuals_hub"

CONF_EVENT_NAME = "name"
# Optional, non-holiday types only - see _entry_title/full_name in
# config_flow.py and sensor.py for how it combines with CONF_EVENT_NAME.
CONF_LAST_NAME = "last_name"
CONF_EVENT_TYPE = "type"
CONF_DAY = "day"
CONF_MONTH = "month"
CONF_YEAR = "year"
CONF_ICON = "icon"
CONF_VIP = "vip"

# Marks an entry as created by a specific bulk-import mechanism, distinct from
# CONF_EVENT_TYPE (which holidays already overload for the same "find just
# these later" purpose - see async_step_remove_holidays). Only ever set to
# "ics" today, letting "Remove ICS-imported events" select just those entries
# without touching manually added or CSV-imported ones of the same type. Only
# set when an ICS row actually creates a *new* entry - never when it merely
# updates an existing one (see async_step_import_ics_review's duplicate
# handling), so updating a pre-existing event via ICS import doesn't
# retroactively make it bulk-removable as "an ICS import".
CONF_IMPORT_SOURCE = "import_source"

TYPE_BIRTHDAY = "birthday"
TYPE_ANNIVERSARY = "anniversary"
TYPE_NAME_DAY = "name_day"
TYPE_WEDDING_ANNIVERSARY = "wedding_anniversary"
TYPE_MEMORIAL = "memorial"
TYPE_PET_BIRTHDAY = "pet_birthday"
TYPE_WORK_ANNIVERSARY = "work_anniversary"
TYPE_CUSTOM = "custom"
TYPE_ONE_TIME = "one_time"
TYPE_HOLIDAY = "holiday"

# The manually-addable types - offered in the "Add event"/"Edit event" type
# selector, CSV import, and the per-type "Annual Settings" milestone fields.
# TYPE_HOLIDAY is deliberately excluded: it has no day/month/year fields at
# all (see dates.py), so it's only ever created via the dedicated "Import
# public holidays" step (config_flow.py), never through this generic form.
EVENT_TYPES = [
    TYPE_BIRTHDAY,
    TYPE_ANNIVERSARY,
    TYPE_NAME_DAY,
    TYPE_WEDDING_ANNIVERSARY,
    TYPE_MEMORIAL,
    TYPE_PET_BIRTHDAY,
    TYPE_WORK_ANNIVERSARY,
    TYPE_CUSTOM,
    TYPE_ONE_TIME,
]

# EVENT_TYPES minus TYPE_ONE_TIME, for the "Annual Settings" milestone-
# threshold form specifically - a one-time event never recurs, so there's no
# "which occurrence number counts as a milestone" question to ask for it (see
# async_step_annual_settings). Every other manually-addable type still gets a
# field there, same as before.
MILESTONE_EVENT_TYPES = [t for t in EVENT_TYPES if t != TYPE_ONE_TIME]

# Every type that gets its own aggregate per-type calendar (calendar.py) -
# EVENT_TYPES plus holiday, which still deserves a calendar.annuals_holiday
# even though it's not manually addable the same way.
ALL_EVENT_TYPES = EVENT_TYPES + [TYPE_HOLIDAY]

# Default MDI icon per type - overridable per event via the optional "icon" field.
# For TYPE_HOLIDAY this is only the fallback when a holiday's category has no
# entry in CATEGORY_ICONS below - holidays are normally icon'd by category.
TYPE_ICONS = {
    TYPE_BIRTHDAY: "mdi:cake-variant",
    TYPE_ANNIVERSARY: "mdi:calendar-star",
    TYPE_NAME_DAY: "mdi:calendar-account",
    TYPE_WEDDING_ANNIVERSARY: "mdi:ring",
    TYPE_MEMORIAL: "mdi:candle",
    TYPE_PET_BIRTHDAY: "mdi:paw",
    TYPE_WORK_ANNIVERSARY: "mdi:briefcase",
    TYPE_CUSTOM: "mdi:calendar-heart",
    TYPE_ONE_TIME: "mdi:timer-sand",
    TYPE_HOLIDAY: "mdi:flag-variant",
}

# Holiday config-entry keys (TYPE_HOLIDAY events only) - identify a holiday by
# where it comes from (country/subdivision/category, all from the `holidays`
# PyPI library) and a stable per-holiday key, rather than by day/month/year
# like every other type. See dates.py for how a holiday's actual date is
# resolved live from these, per year, instead of being stored.
CONF_COUNTRY = "country"
CONF_SUBDIVISION = "subdivision"
CONF_CATEGORY = "category"
CONF_LANGUAGE = "language"
CONF_HOLIDAY_KEY = "holiday_key"
# Whether this entry tracks a holiday's practically-observed (weekend-shifted)
# date rather than its literal one - see dates.holiday_occurrence_in_year.
# Absent (.get(..., False)) on every entry imported before this field
# existed, which is exactly the "literal date" behaviour they already had.
CONF_HOLIDAY_OBSERVED = "holiday_observed"

# Icon per `holidays` library category - every category value the library
# defines across its entire country set, confirmed exhaustively (not
# guessed) by scanning `holidays.countries`' supported_categories at
# 2026-08-08: mostly public/bank/government/school-type categories, plus a
# handful of religious ones (some countries), and - only for North Macedonia
# (albanian/bosnian/roma/serbian/turkish/vlach), Iraq (sabian/yazidi),
# Switzerland/Sweden (de_facto), Austria (protestant), Argentina (armenian) -
# ethnic/minority-specific ones. Falls back to TYPE_ICONS[TYPE_HOLIDAY] for
# any category not listed here (defensive only - the list above should
# already be exhaustive; re-run the same scan if the `holidays` dependency
# is ever upgraded and a country's categories change), and the frontend
# additionally falls back to a humanized version of the raw value instead of
# ever showing a blank or untranslated label (see annuals-card.js).
CATEGORY_ICONS = {
    "public": "mdi:flag-variant",
    "bank": "mdi:bank",
    "government": "mdi:bank-outline",
    "school": "mdi:school",
    "optional": "mdi:calendar-question",
    "unofficial": "mdi:calendar-remove",
    "de_facto": "mdi:calendar-check-outline",
    "half_day": "mdi:clock-time-four",
    "armed_forces": "mdi:shield-star",
    "workday": "mdi:briefcase-clock",
    "catholic": "mdi:cross",
    "christian": "mdi:cross",
    "protestant": "mdi:book-cross",
    "orthodox": "mdi:cross-outline",
    "hebrew": "mdi:star-david",
    "islamic": "mdi:mosque",
    "hindu": "mdi:om",
    "sabian": "mdi:water-outline",
    "yazidi": "mdi:star-four-points-outline",
    "albanian": "mdi:account-group",
    "armenian": "mdi:account-group",
    "bosnian": "mdi:account-group",
    "roma": "mdi:account-group",
    "serbian": "mdi:account-group",
    "turkish": "mdi:account-group",
    "vlach": "mdi:account-group",
}

# Recomputed hourly regardless, but a poll landing e.g. 23:50 would otherwise
# leave a stale "days until" count showing for up to an hour past local
# midnight - see the dedicated midnight refresh in __init__.py instead.
SCAN_INTERVAL_HOURS = 1

# hass.data[DOMAIN][DATA_SENSORS] - the set of currently-added AnnualEventSensor
# instances, so the midnight refresh (__init__.py) can force them all to
# recompute "days until" right after local midnight instead of waiting for
# their next hourly poll.
DATA_SENSORS = "sensors"

# hass.data[DOMAIN][DATA_TYPE_LABELS] / [DATA_REMINDER_STRINGS] - cached once
# per HA run (see __init__.py's async_setup_entry, populated before any
# sensor is constructed) since the translation lookup itself is async and
# AnnualEventSensor._update_state/_update_holiday_state below are sync -
# reused for the "type_label"/"reminder_message" sensor attributes.
DATA_TYPE_LABELS = "type_labels"
DATA_REMINDER_STRINGS = "reminder_strings"

# Hub-entry options key prefix for the per-type "important" occurrence-number
# thresholds ("Annual Settings"), e.g. "important_thresholds_birthday". Kept
# per-type since a milestone like "25" means something different for a
# birthday than for a work anniversary.
CONF_IMPORTANT_THRESHOLDS = "important_thresholds"

# Sensible starting milestones per event type, shown pre-filled in the
# "Annual Settings" options step and fully user-editable from there. Round
# numbers plus the traditional "special" birthdays (65/75/85/95); work
# anniversaries in 5-year steps; wedding/memorial anniversaries at the
# customary milestone years. Types with no cultural convention for a
# milestone (name day, custom) default to empty. TYPE_ONE_TIME isn't in
# MILESTONE_EVENT_TYPES at all (see above) - the "" here is only ever read as
# a fallback default value, never actually shown as its own field.
DEFAULT_IMPORTANT_THRESHOLDS = {
    TYPE_BIRTHDAY: "18,21,30,40,50,60,65,70,75,80,85,90,95,100",
    TYPE_ANNIVERSARY: "10,20,25,30,40,50,60,70,75,80,90,100",
    TYPE_NAME_DAY: "",
    TYPE_WEDDING_ANNIVERSARY: "1,5,10,15,20,25,30,40,50,60,65,70",
    TYPE_MEMORIAL: "1,5,10,15,20,25,30,40,50",
    TYPE_PET_BIRTHDAY: "1,5,10,15,20",
    TYPE_WORK_ANNIVERSARY: "5,10,15,20,25,30,35,40,45,50",
    TYPE_CUSTOM: "",
    TYPE_ONE_TIME: "",
    TYPE_HOLIDAY: "",
}
