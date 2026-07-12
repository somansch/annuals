"""Pure date math for yearly-recurring events - no HA or API dependencies.

Events are stored as day/month plus an optional year, not as a full date:
a yearly-recurring event is really just a month/day; the year is extra
information that enables the occurrence number (e.g. "30th birthday").
"""

from __future__ import annotations

from datetime import date


def occurrence_in_year(month: int, day: int, year: int) -> date:
    """The event's occurrence in the given year.

    Feb 29 falls back to Feb 28 in non-leap years, so leap-day events still
    get a yearly occurrence instead of only appearing every four years.
    """
    try:
        return date(year, month, day)
    except ValueError:
        return date(year, 2, 28)


def next_occurrence(month: int, day: int, today: date) -> date:
    """The next occurrence of the event's month/day on or after today."""
    candidate = occurrence_in_year(month, day, today.year)
    if candidate < today:
        candidate = occurrence_in_year(month, day, today.year + 1)
    return candidate


def days_until(target: date, today: date) -> int:
    """Whole days from today to target (0 if target is today)."""
    return (target - today).days


def occurrence_number(year: int | None, occurrence: date) -> int | None:
    """How many times this event will have occurred as of `occurrence`
    (e.g. the 30th birthday). None when the starting year isn't known.
    """
    if year is None:
        return None
    return occurrence.year - year
