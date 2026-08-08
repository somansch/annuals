from __future__ import annotations

from datetime import date, timedelta
import logging
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import slugify

from .const import (
    CATEGORY_ICONS,
    CONF_CATEGORY,
    CONF_COUNTRY,
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_EVENT_TYPE,
    CONF_HOLIDAY_KEY,
    CONF_HOLIDAY_OBSERVED,
    CONF_HUB,
    CONF_ICON,
    CONF_IMPORTANT_THRESHOLDS,
    CONF_LANGUAGE,
    CONF_LAST_NAME,
    CONF_MONTH,
    CONF_SUBDIVISION,
    CONF_VIP,
    CONF_YEAR,
    DATA_REMINDER_STRINGS,
    DATA_SENSORS,
    DATA_TYPE_LABELS,
    DEFAULT_IMPORTANT_THRESHOLDS,
    DOMAIN,
    SCAN_INTERVAL_HOURS,
    TYPE_HOLIDAY,
    TYPE_ICONS,
    TYPE_ONE_TIME,
)
from .dates import (
    days_until,
    holiday_display_name,
    holiday_key_from_name,
    is_important,
    next_holiday_occurrence,
    next_occurrence,
    occurrence_number,
    one_time_date,
    parse_thresholds,
)

_LOGGER = logging.getLogger(__name__)

SCAN_INTERVAL = timedelta(hours=SCAN_INTERVAL_HOURS)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    async_add_entities([AnnualEventSensor(hass, config_entry)])


class AnnualEventSensor(SensorEntity):
    """One yearly-recurring event. State is days until its next occurrence."""

    _attr_should_poll = True
    _attr_has_entity_name = True

    def __init__(self, hass: HomeAssistant, config_entry: ConfigEntry) -> None:
        self._hass_ref = hass
        self._config_entry = config_entry
        data = config_entry.data
        event_type: str = data[CONF_EVENT_TYPE]
        name: str = data[CONF_EVENT_NAME]
        if event_type == TYPE_HOLIDAY:
            # A holiday's static, never-changing identity label - always
            # holiday_key_from_name(name) (so any accidental "(observed)"/
            # "(estimated)" suffix baked into an older import self-heals),
            # with " (observed)" appended back on only for entries that
            # deliberately track the shifted date (see CONF_HOLIDAY_OBSERVED
            # and dates.holiday_occurrence_in_year) - never left to whatever
            # suffix happened to be present in the import year, which would
            # drift year to year for a plain-date entry and stay permanently
            # wrong either way once frozen into config_entry.data.
            base_name = holiday_key_from_name(name)
            name = f"{base_name} (observed)" if data.get(CONF_HOLIDAY_OBSERVED, False) else base_name
        self._name = name
        # Empty for TYPE_HOLIDAY (never offered on that form) and for any
        # event added before this field existed - never touches
        # self._name/entity_id/translation placeholders below, which must
        # stay exactly as before for existing entries; only the "last_name"/
        # "full_name" attributes (see _update_state) are new.
        self._last_name: str = data.get(CONF_LAST_NAME) or ""

        self._attr_unique_id = f"{DOMAIN}-{config_entry.entry_id}"
        # translation_key per type gives the entity a type-prefixed, translated
        # name ("Geburtstag {name}") and a translated unit ("Tage"/"days"),
        # both in the server's language.
        self._attr_translation_key = event_type
        self._attr_translation_placeholders = {"name": name}
        # Explicit, language-independent entity_id (the translated name would
        # otherwise drive it and change with the server language, and two
        # events sharing a name would collide without the type prefix).
        # Setting entity_id directly - unlike a "suggested_object_id"
        # attribute, this is actually honoured by the entity platform when
        # the entity is first registered.
        self.entity_id = f"sensor.annuals_{event_type}_{slugify(name)}"
        self._attr_icon = data.get(CONF_ICON) or (
            CATEGORY_ICONS.get(data.get(CONF_CATEGORY), TYPE_ICONS.get(event_type, "mdi:calendar-star"))
            if event_type == TYPE_HOLIDAY
            else TYPE_ICONS.get(event_type, "mdi:calendar-star")
        )
        # Holiday state is computed in async_added_to_hass/async_update instead
        # (see there) - the `holidays` library does blocking file I/O the
        # first time a given language's translations are loaded, which must
        # never happen synchronously here in __init__, on the event loop.
        if event_type != TYPE_HOLIDAY:
            self._update_state()

    def _update_state(self) -> None:
        data = self._config_entry.data
        event_type: str = data[CONF_EVENT_TYPE]
        today = date.today()

        if event_type == TYPE_HOLIDAY:
            self._update_holiday_state(data, today)
            return

        day: int = data[CONF_DAY]
        month: int = data[CONF_MONTH]
        year: int | None = data.get(CONF_YEAR)

        # A one-time event (see TYPE_ONE_TIME in const.py) never recurs - its
        # "occurrence" is just the literal stored date, not the next yearly
        # repeat next_occurrence() would compute, and occurrence_number/
        # "important" (which both describe *which* repeat this is) simply
        # don't apply. year is always set for this type (enforced in
        # config_flow._validate_and_normalise), so the plain int() is safe.
        if event_type == TYPE_ONE_TIME:
            occurrence = one_time_date(int(year), month, day)
            occurrence_num = None
            important = False
        else:
            occurrence = next_occurrence(month, day, today)
            occurrence_num = occurrence_number(year, occurrence)
            important = is_important(occurrence_num, self._important_thresholds(event_type))

        days = days_until(occurrence, today)
        self._attr_native_value = days
        self._attr_extra_state_attributes: dict[str, Any] = {
            "type": event_type,
            "type_label": self._type_label(event_type),
            "name": self._name,
            "last_name": self._last_name,
            "full_name": f"{self._name} {self._last_name}".strip() if self._last_name else self._name,
            "next_date": occurrence.isoformat(),
            "occurrence_number": occurrence_num,
            "day": day,
            "month": month,
            "year": year,
            "vip": bool(data.get(CONF_VIP, False)),
            "important": important,
            "reminder_message": self._reminder_message(days),
        }

    def _update_holiday_state(self, data: dict, today: date) -> None:
        """Holiday events have no stored day/month/year (see dates.py) - the
        occurrence, and even the display name (some names carry a year-
        specific "(observed)"/"(estimated)" suffix), are resolved live here
        instead, every update, so there's nothing that can go stale.
        """
        country: str = data[CONF_COUNTRY]
        subdivision: str | None = data.get(CONF_SUBDIVISION)
        category: str = data[CONF_CATEGORY]
        holiday_key: str = data[CONF_HOLIDAY_KEY]
        language: str | None = data.get(CONF_LANGUAGE)
        observed: bool = data.get(CONF_HOLIDAY_OBSERVED, False)

        occurrence = next_holiday_occurrence(
            country, subdivision, category, holiday_key, today, observed
        )
        name = self._name
        if occurrence is not None:
            name = (
                holiday_display_name(country, subdivision, category, language, occurrence.year, occurrence)
                or self._name
            )

        days = days_until(occurrence, today) if occurrence is not None else None
        self._attr_native_value = days
        self._attr_extra_state_attributes: dict[str, Any] = {
            "type": TYPE_HOLIDAY,
            "type_label": self._type_label(TYPE_HOLIDAY),
            "name": name,
            "next_date": occurrence.isoformat() if occurrence is not None else None,
            "occurrence_number": None,
            "country": country,
            "subdivision": subdivision,
            "category": category,
            "holiday_key": holiday_key,
            "vip": bool(data.get(CONF_VIP, False)),
            "important": False,
            "observed": observed,
            "reminder_message": self._reminder_message(days),
        }

    def _type_label(self, event_type: str) -> str:
        """This event type's translated label - see DATA_TYPE_LABELS/
        helpers.async_event_type_labels, cached at integration setup since
        the lookup itself is async and this method isn't.
        """
        labels: dict[str, str] = self._hass_ref.data.get(DOMAIN, {}).get(DATA_TYPE_LABELS, {})
        return labels.get(event_type, event_type.replace("_", " ").title())

    def _reminder_message(self, days: int | None) -> str | None:
        """A translated "days until" countdown phrase (see DATA_REMINDER_STRINGS/
        helpers.async_reminder_strings) - None only when there's no
        occurrence to count down to at all (a holiday that didn't resolve
        this update, see _update_holiday_state).
        """
        if days is None:
            return None
        strings: dict[str, str] = self._hass_ref.data.get(DOMAIN, {}).get(DATA_REMINDER_STRINGS, {})
        if days == 0:
            return strings.get("today", "Today")
        if days == 1:
            return strings.get("tomorrow", "Tomorrow")
        return strings.get("in_days", "in {days} days").format(days=days)

    def _important_thresholds(self, event_type: str) -> set[int]:
        """The "Annual Settings" milestone list for this event's type, read
        from the shared hub entry's options (falling back to the built-in
        defaults if the hub hasn't been configured yet).
        """
        for entry in self._hass_ref.config_entries.async_entries(DOMAIN):
            if entry.data.get(CONF_HUB):
                text = entry.options.get(
                    f"{CONF_IMPORTANT_THRESHOLDS}_{event_type}",
                    DEFAULT_IMPORTANT_THRESHOLDS.get(event_type, ""),
                )
                return parse_thresholds(text)
        return parse_thresholds(DEFAULT_IMPORTANT_THRESHOLDS.get(event_type, ""))

    async def async_update(self) -> None:
        if self._config_entry.data[CONF_EVENT_TYPE] == TYPE_HOLIDAY:
            # Off the event loop - see the comment in __init__ on why.
            await self._hass_ref.async_add_executor_job(self._update_state)
        else:
            self._update_state()

    async def async_added_to_hass(self) -> None:
        """Register with the domain-wide midnight refresh (see __init__.py),
        and compute the initial state for holiday events (skipped in
        __init__ - see the comment there).
        """
        self._hass_ref.data.setdefault(DOMAIN, {}).setdefault(DATA_SENSORS, set()).add(self)
        if self._config_entry.data[CONF_EVENT_TYPE] == TYPE_HOLIDAY:
            await self._hass_ref.async_add_executor_job(self._update_state)

    async def async_will_remove_from_hass(self) -> None:
        sensors = self._hass_ref.data.get(DOMAIN, {}).get(DATA_SENSORS)
        if sensors is not None:
            sensors.discard(self)
