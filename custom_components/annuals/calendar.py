from __future__ import annotations

from datetime import date, datetime, timedelta
import logging

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import (
    ALL_EVENT_TYPES,
    CONF_CATEGORY,
    CONF_COUNTRY,
    CONF_DAY,
    CONF_EVENT_TYPE,
    CONF_HOLIDAY_KEY,
    CONF_HOLIDAY_OBSERVED,
    CONF_MONTH,
    CONF_SUBDIVISION,
    CONF_YEAR,
    DOMAIN,
    TYPE_CUSTOM,
    TYPE_HOLIDAY,
    TYPE_ICONS,
    TYPE_ONE_TIME,
)
from .dates import (
    holiday_occurrence_in_year,
    next_holiday_occurrence,
    next_occurrence,
    occurrence_in_year,
    occurrence_number,
    one_time_date,
)
from .helpers import async_event_type_labels, full_name

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
        for event_type in ALL_EVENT_TYPES
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
        # Only populated (and only needed) for the holiday calendar - see
        # async_update/event below.
        self._cached_event: CalendarEvent | None = None

    def _summary(self, entry: ConfigEntry, occurrence: date) -> str:
        name = full_name(entry.data)
        # Holidays (like Custom) have no type label worth stating - "New
        # Year's Day - Holiday" would just repeat what the calendar itself
        # (its plural type name) already says, and they have no occurrence
        # number (see dates.py). Every other type still gets "name - type".
        if self._event_type in (TYPE_CUSTOM, TYPE_ONE_TIME, TYPE_HOLIDAY):
            return name
        number = occurrence_number(entry.data.get(CONF_YEAR), occurrence)
        suffix = f" ({number})" if number is not None else ""
        return f"{name} - {self._type_label}{suffix}"

    def _calendar_event(self, entry: ConfigEntry, occurrence: date) -> CalendarEvent:
        return CalendarEvent(
            start=occurrence,
            end=occurrence + timedelta(days=1),
            summary=self._summary(entry, occurrence),
            uid=f"{DOMAIN}-{entry.entry_id}-{occurrence.isoformat()}",
        )

    @staticmethod
    def _next_occurrence_for_entry(entry: ConfigEntry, today: date) -> date | None:
        data = entry.data
        if data[CONF_EVENT_TYPE] == TYPE_HOLIDAY:
            return next_holiday_occurrence(
                data[CONF_COUNTRY],
                data.get(CONF_SUBDIVISION),
                data[CONF_CATEGORY],
                data[CONF_HOLIDAY_KEY],
                today,
                data.get(CONF_HOLIDAY_OBSERVED, False),
            )
        if data[CONF_EVENT_TYPE] == TYPE_ONE_TIME:
            # Never wraps to "next year" like next_occurrence() does below -
            # a one-time event simply has no next year. None once it's in
            # the past, same as a holiday with no more occurrences; in
            # practice this entry is removed entirely by the midnight purge
            # (see __init__.py) before that ever shows up here.
            occurrence = one_time_date(data[CONF_YEAR], data[CONF_MONTH], data[CONF_DAY])
            return occurrence if occurrence >= today else None
        return next_occurrence(data[CONF_MONTH], data[CONF_DAY], today)

    @staticmethod
    def _occurrence_in_year_for_entry(entry: ConfigEntry, year: int) -> date | None:
        data = entry.data
        if data[CONF_EVENT_TYPE] == TYPE_HOLIDAY:
            return holiday_occurrence_in_year(
                data[CONF_COUNTRY],
                data.get(CONF_SUBDIVISION),
                data[CONF_CATEGORY],
                data[CONF_HOLIDAY_KEY],
                year,
                data.get(CONF_HOLIDAY_OBSERVED, False),
            )
        if data[CONF_EVENT_TYPE] == TYPE_ONE_TIME:
            # Only ever occurs in its own stored year, unlike every other
            # type which repeats in every year of a multi-year range query.
            return one_time_date(data[CONF_YEAR], data[CONF_MONTH], data[CONF_DAY]) if data[CONF_YEAR] == year else None
        return occurrence_in_year(data[CONF_MONTH], data[CONF_DAY], year)

    def _compute_event(self) -> CalendarEvent | None:
        """The soonest upcoming occurrence across all events of this type -
        the actual (potentially blocking, for holidays) computation, always
        called off the event loop - see async_update/event below.
        """
        today = dt_util.now().date()
        upcoming = [
            self._calendar_event(entry, occurrence)
            for entry in _entries_for_type(self.hass, self._event_type)
            for occurrence in [self._next_occurrence_for_entry(entry, today)]
            if occurrence is not None
        ]
        if not upcoming:
            return None
        return min(upcoming, key=lambda e: e.start)

    @property
    def event(self) -> CalendarEvent | None:
        # For every type except holiday this is pure date arithmetic (no I/O)
        # and cheap enough to just compute on read. Holidays go through
        # async_update instead (see there) - the `holidays` library can do
        # blocking file I/O the first time a language's translations load,
        # which must never happen synchronously here, on the event loop.
        if self._event_type == TYPE_HOLIDAY:
            return self._cached_event
        return self._compute_event()

    async def async_update(self) -> None:
        if self._event_type == TYPE_HOLIDAY:
            self._cached_event = await self.hass.async_add_executor_job(self._compute_event)

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        """Every occurrence of this type's events within the given range."""

        def _collect() -> list[CalendarEvent]:
            events: list[CalendarEvent] = []
            start = start_date.date()
            end = end_date.date()
            for entry in _entries_for_type(hass, self._event_type):
                for year in range(start.year, end.year + 1):
                    occurrence = self._occurrence_in_year_for_entry(entry, year)
                    if occurrence is not None and start <= occurrence <= end:
                        events.append(self._calendar_event(entry, occurrence))
            return sorted(events, key=lambda e: e.start)

        # Same blocking-I/O concern as event/async_update above for holidays;
        # negligible overhead either way for the other types.
        return await hass.async_add_executor_job(_collect)
