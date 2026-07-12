from __future__ import annotations

from datetime import date, datetime, timedelta
import logging

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import (
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_EVENT_TYPE,
    CONF_MONTH,
    CONF_YEAR,
    DOMAIN,
    EVENT_TYPES,
    TYPE_CUSTOM,
    TYPE_ICONS,
)
from .dates import next_occurrence, occurrence_in_year, occurrence_number
from .helpers import async_event_type_labels

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the six shared per-type calendars.

    This platform is only ever forwarded for the single hub entry (see
    __init__.py), so these aren't tied to any one event's lifecycle - each
    aggregates every event of its type across all event entries.
    """
    labels = await async_event_type_labels(hass)
    async_add_entities(
        AnnualsTypeCalendar(hass, event_type, labels[event_type])
        for event_type in EVENT_TYPES
    )


def _entries_for_type(hass: HomeAssistant, event_type: str) -> list[ConfigEntry]:
    return [
        entry
        for entry in hass.config_entries.async_entries(DOMAIN)
        if entry.data.get(CONF_EVENT_TYPE) == event_type
    ]


class AnnualsTypeCalendar(CalendarEntity):
    """Aggregates every event of one type into a single calendar entity."""

    _attr_should_poll = True
    _attr_has_entity_name = True

    def __init__(self, hass: HomeAssistant, event_type: str, type_label: str) -> None:
        self.hass = hass
        self._event_type = event_type
        self._type_label = type_label
        self._attr_unique_id = f"{DOMAIN}-calendar-{event_type}"
        # Plural, translated calendar name ("Geburtstage"/"Birthdays") via the
        # per-type translation_key under entity.calendar.
        self._attr_translation_key = event_type
        self._attr_icon = TYPE_ICONS.get(event_type, "mdi:calendar-star")
        # Language-independent entity_id, e.g. calendar.annuals_birthday.
        # Setting entity_id directly - unlike a "suggested_object_id"
        # attribute, this is actually honoured by the entity platform when
        # the entity is first registered.
        self.entity_id = f"calendar.annuals_{event_type}"

    def _summary(self, entry: ConfigEntry, occurrence: date) -> str:
        number = occurrence_number(entry.data.get(CONF_YEAR), occurrence)
        name = entry.data[CONF_EVENT_NAME]
        suffix = f" ({number})" if number is not None else ""
        # Custom events have no type label worth stating - "name - Custom"
        # would just repeat what the calendar itself (its plural type name)
        # already says. Every other type still gets the "name - type" form.
        if self._event_type == TYPE_CUSTOM:
            return f"{name}{suffix}"
        return f"{name} - {self._type_label}{suffix}"

    def _calendar_event(self, entry: ConfigEntry, occurrence: date) -> CalendarEvent:
        return CalendarEvent(
            start=occurrence,
            end=occurrence + timedelta(days=1),
            summary=self._summary(entry, occurrence),
            uid=f"{DOMAIN}-{entry.entry_id}-{occurrence.isoformat()}",
        )

    @property
    def event(self) -> CalendarEvent | None:
        """The soonest upcoming occurrence across all events of this type."""
        today = dt_util.now().date()
        upcoming = [
            self._calendar_event(
                entry, next_occurrence(entry.data[CONF_MONTH], entry.data[CONF_DAY], today)
            )
            for entry in _entries_for_type(self.hass, self._event_type)
        ]
        if not upcoming:
            return None
        return min(upcoming, key=lambda e: e.start)

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        """Every occurrence of this type's events within the given range."""
        events: list[CalendarEvent] = []
        start = start_date.date()
        end = end_date.date()
        for entry in _entries_for_type(hass, self._event_type):
            for year in range(start.year, end.year + 1):
                occurrence = occurrence_in_year(entry.data[CONF_MONTH], entry.data[CONF_DAY], year)
                if start <= occurrence <= end:
                    events.append(self._calendar_event(entry, occurrence))
        return sorted(events, key=lambda e: e.start)
