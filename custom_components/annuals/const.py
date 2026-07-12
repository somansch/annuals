DOMAIN = "annuals"

# Marks the single auto-created "Annuals" hub entry that owns the shared,
# cross-event entities (the per-type calendars, and any future global
# entities) - as opposed to the per-event entries, which own one sensor each.
CONF_HUB = "hub"
HUB_UNIQUE_ID = "annuals_hub"

CONF_EVENT_NAME = "name"
CONF_EVENT_TYPE = "type"
CONF_DAY = "day"
CONF_MONTH = "month"
CONF_YEAR = "year"
CONF_ICON = "icon"

TYPE_BIRTHDAY = "birthday"
TYPE_ANNIVERSARY = "anniversary"
TYPE_NAME_DAY = "name_day"
TYPE_WEDDING_ANNIVERSARY = "wedding_anniversary"
TYPE_MEMORIAL = "memorial"
TYPE_PET_BIRTHDAY = "pet_birthday"
TYPE_WORK_ANNIVERSARY = "work_anniversary"
TYPE_CUSTOM = "custom"

EVENT_TYPES = [
    TYPE_BIRTHDAY,
    TYPE_ANNIVERSARY,
    TYPE_NAME_DAY,
    TYPE_WEDDING_ANNIVERSARY,
    TYPE_MEMORIAL,
    TYPE_PET_BIRTHDAY,
    TYPE_WORK_ANNIVERSARY,
    TYPE_CUSTOM,
]

# Default MDI icon per type - overridable per event via the optional "icon" field.
TYPE_ICONS = {
    TYPE_BIRTHDAY: "mdi:cake-variant",
    TYPE_ANNIVERSARY: "mdi:calendar-star",
    TYPE_NAME_DAY: "mdi:calendar-account",
    TYPE_WEDDING_ANNIVERSARY: "mdi:ring",
    TYPE_MEMORIAL: "mdi:candle",
    TYPE_PET_BIRTHDAY: "mdi:paw",
    TYPE_WORK_ANNIVERSARY: "mdi:briefcase",
    TYPE_CUSTOM: "mdi:calendar-heart",
}

# Recomputed hourly so the "days until" countdown rolls over at local midnight
# without needing an external trigger - these are pure local date calculations,
# no API involved.
SCAN_INTERVAL_HOURS = 1
