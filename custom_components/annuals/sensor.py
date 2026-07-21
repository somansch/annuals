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
    CONF_HUB,
    CONF_ICON,
    CONF_IMPORTANT_THRESHOLDS,
    CONF_LANGUAGE,
    CONF_MONTH,
    CONF_SUBDIVISION,
    CONF_VIP,
    CONF_YEAR,
    DATA_SENSORS,
    DEFAULT_IMPORTANT_THRESHOLDS,
    DOMAIN,
    SCAN_INTERVAL_HOURS,
    TYPE_HOLIDAY,
    TYPE_ICONS,
)
from .dates import (
    days_until,
    holiday_display_name,
    is_important,
    next_holiday_occurrence,
    next_occurrence,
    occurrence_number,
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
        self._name = name

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

        occurrence = next_occurrence(month, day, today)
        occurrence_num = occurrence_number(year, occurrence)

        self._attr_native_value = days_until(occurrence, today)
        self._attr_extra_state_attributes: dict[str, Any] = {
            "type": event_type,
            "name": self._name,
            "next_date": occurrence.isoformat(),
            "occurrence_number": occurrence_num,
            "day": day,
            "month": month,
            "year": year,
            "vip": bool(data.get(CONF_VIP, False)),
            "important": is_important(occurrence_num, self._important_thresholds(event_type)),
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

        occurrence = next_holiday_occurrence(country, subdivision, category, holiday_key, today)
        name = self._name
        if occurrence is not None:
            name = (
                holiday_display_name(country, subdivision, category, language, occurrence.year, occurrence)
                or self._name
            )

        self._attr_native_value = days_until(occurrence, today) if occurrence is not None else None
        self._attr_extra_state_attributes: dict[str, Any] = {
            "type": TYPE_HOLIDAY,
            "name": name,
            "next_date": occurrence.isoformat() if occurrence is not None else None,
            "occurrence_number": None,
            "country": country,
            "subdivision": subdivision,
            "category": category,
            "vip": bool(data.get(CONF_VIP, False)),
            "important": False,
        }

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
