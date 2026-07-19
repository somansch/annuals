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
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_EVENT_TYPE,
    CONF_HUB,
    CONF_ICON,
    CONF_IMPORTANT_THRESHOLDS,
    CONF_MONTH,
    CONF_VIP,
    CONF_YEAR,
    DATA_SENSORS,
    DEFAULT_IMPORTANT_THRESHOLDS,
    DOMAIN,
    SCAN_INTERVAL_HOURS,
    TYPE_ICONS,
)
from .dates import days_until, is_important, next_occurrence, occurrence_number, parse_thresholds

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
        self._attr_icon = data.get(CONF_ICON) or TYPE_ICONS.get(event_type, "mdi:calendar-star")
        self._update_state()

    def _update_state(self) -> None:
        data = self._config_entry.data
        day: int = data[CONF_DAY]
        month: int = data[CONF_MONTH]
        year: int | None = data.get(CONF_YEAR)
        event_type: str = data[CONF_EVENT_TYPE]
        today = date.today()

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
        self._update_state()

    async def async_added_to_hass(self) -> None:
        """Register with the domain-wide midnight refresh (see __init__.py)."""
        self._hass_ref.data.setdefault(DOMAIN, {}).setdefault(DATA_SENSORS, set()).add(self)

    async def async_will_remove_from_hass(self) -> None:
        sensors = self._hass_ref.data.get(DOMAIN, {}).get(DATA_SENSORS)
        if sensors is not None:
            sensors.discard(self)
