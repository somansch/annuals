"""Pure date math for yearly-recurring events - no HA or API dependencies.

Events are stored as day/month plus an optional year, not as a full date:
a yearly-recurring event is really just a month/day; the year is extra
information that enables the occurrence number (e.g. "30th birthday").

Holiday-type events (see CONF_HOLIDAY_KEY in const.py) are the one exception:
unlike every other type, they deliberately have no stored day/month at all,
since a holiday's date can move year to year (Easter, lunar-calendar, "nth
weekday of month" holidays, ...). Their date is instead resolved live, every
time it's needed, from the `holidays` PyPI library - so there is nothing to
go stale and nothing to migrate when a year turns over, unlike a naive
"cache the date we last computed" approach would require.
"""

from __future__ import annotations

from datetime import date
from functools import lru_cache

import holidays as holidays_lib


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


def one_time_date(year: int, month: int, day: int) -> date:
    """A one-time event's literal, fixed date (see TYPE_ONE_TIME in
    const.py) - unlike every other type, there's no "next occurrence" to
    compute, since it never recurs; this is simply the date itself, whichever
    year it falls in.
    """
    return date(year, month, day)


def occurrence_number(year: int | None, occurrence: date) -> int | None:
    """How many times this event will have occurred as of `occurrence`
    (e.g. the 30th birthday). None when the starting year isn't known.
    """
    if year is None:
        return None
    return occurrence.year - year


def parse_thresholds(text: str) -> set[int]:
    """Parse a comma-separated "18,21,30" milestone list into a set of ints.

    Blank/whitespace-only entries and non-numeric junk are silently dropped
    rather than raising - this feeds a free-text options-flow field, so a
    stray trailing comma or extra space shouldn't break the whole list.
    """
    result: set[int] = set()
    for part in text.split(","):
        part = part.strip()
        if part.isdigit():
            result.add(int(part))
    return result


def is_important(occurrence_num: int | None, thresholds: set[int]) -> bool:
    """Whether this occurrence number is one of the configured milestones."""
    return occurrence_num is not None and occurrence_num in thresholds


# --- Holiday-type events (see module docstring) ---------------------------

# Suffixes the `holidays` library appends to a name for a given year when a
# holiday's actual date is uncertain (lunar/Hijri-calendar holidays, shown
# "(estimated)") or has been shifted to a working day (falls on a weekend,
# shown "(observed)"). Stripping them is what makes a holiday's identity
# stable across years - the underlying holiday is the same one either way.
_NAME_SUFFIXES = (" (observed)", " (estimated)")


def holiday_key_from_name(name: str) -> str:
    """Normalise a holiday's default-language name into a stable identity
    that survives a suffix like "(observed)" appearing or disappearing in a
    future year - see `next_holiday_occurrence`/`holiday_occurrence_in_year`.
    """
    for suffix in _NAME_SUFFIXES:
        if name.endswith(suffix):
            return name[: -len(suffix)]
    return name


@lru_cache(maxsize=512)
def _holiday_calendar(
    country: str, subdivision: str | None, category: str, year: int, language: str | None
):
    """One year's holidays for a single category, cached - constructing this
    isn't free, and every holiday sensor sharing a country/subdivision/
    category/year would otherwise rebuild an identical calendar on every poll.
    """
    return holidays_lib.country_holidays(
        country,
        subdiv=subdivision or None,
        years=year,
        categories=(category,),
        language=language,
    )


def holiday_occurrence_in_year(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    observed: bool = False,
) -> date | None:
    """This holiday's date in the given year, or None if it doesn't occur
    that year (rare, but a real possibility - not every holiday is observed
    every single year in every source).

    A statutory holiday can have two distinct dates in the same year: its
    literal, unshifted date (e.g. Independence Day is always July 4th) and,
    when that date falls on a weekend, a nearby weekday it's practically
    observed on instead (the `holidays` library appends "(observed)"/
    "(estimated)" to the name for that second date - see _NAME_SUFFIXES).
    `observed=False` (the default) always resolves to the literal date;
    `observed=True` resolves to the shifted date in years it exists, falling
    back to the same literal date in years it doesn't (a holiday that always
    falls on a weekday has nothing to shift), so an "observed" entity never
    goes without a next occurrence. Lunar/Hijri-calendar holidays that are
    *always* shown "(estimated)" (no literal variant ever exists) resolve
    the same regardless of `observed`, since there's only the one date.
    """
    plain: date | None = None
    for occurrence, name in _holiday_calendar(country, subdivision, category, year, None).items():
        if holiday_key_from_name(name) == holiday_key and name == holiday_key_from_name(name):
            if plain is None or occurrence < plain:
                plain = occurrence

    shifted: date | None = None
    if plain is not None:
        # A shift for *this* occurrence always lands within a handful of
        # days of its own literal date (a weekend nudge, never a different
        # year's holiday) - search the neighbouring years too, not just
        # `year`'s own calendar dict, since the shift can cross a
        # calendar-year boundary in either direction. New Year's Day is the
        # case that needs this: when the *following* Jan 1 falls on a
        # Saturday, the `holidays` library backs its observed shift up into
        # December of the *previous* year - so e.g. year=2027's own
        # calendar dict contains both 2027's literal Jan 1 (a Friday,
        # unshifted) *and* the unrelated observed shift of 2028's Jan 1
        # (Dec 31, 2027), while year=2028's dict never contains that shift
        # at all (Dec 31 numerically belongs to 2027). Naively treating
        # "the first suffixed entry found in this year's dict" as this
        # occurrence's shift - the previous approach - would then either
        # pair 2027's actual with a shift that isn't really its own, or
        # miss 2028's real shift entirely. Filtering by proximity to
        # `plain` instead of by which year's dict the entry happened to
        # land in fixes both.
        best: tuple[int, date] | None = None
        for neighbour_year in (year - 1, year, year + 1):
            for occurrence, name in _holiday_calendar(
                country, subdivision, category, neighbour_year, None
            ).items():
                if holiday_key_from_name(name) != holiday_key or name == holiday_key_from_name(name):
                    continue
                delta = abs((occurrence - plain).days)
                if delta <= 6 and (best is None or delta < best[0]):
                    best = (delta, occurrence)
        if best is not None:
            shifted = best[1]
    else:
        # Estimated-only holiday (lunar/Hijri) - the name is always
        # suffixed, so there's no unsuffixed "plain" entry to anchor a
        # proximity search on; just use whatever's in this year's dict.
        for occurrence, name in _holiday_calendar(country, subdivision, category, year, None).items():
            if holiday_key_from_name(name) == holiday_key:
                if shifted is None or occurrence < shifted:
                    shifted = occurrence

    if observed:
        return shifted if shifted is not None else plain
    return plain if plain is not None else shifted


def next_holiday_occurrence(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    today: date,
    observed: bool = False,
) -> date | None:
    """The next occurrence of this holiday on or after today - see
    holiday_occurrence_in_year for what `observed` selects between.

    None only if the holiday isn't found in any of the next few years -
    e.g. it was legislated away - since that can't be assumed impossible.
    """
    for year in (today.year, today.year + 1, today.year + 2):
        occurrence = holiday_occurrence_in_year(
            country, subdivision, category, holiday_key, year, observed
        )
        if occurrence is not None and occurrence >= today:
            return occurrence
    return None


def holiday_display_name(
    country: str,
    subdivision: str | None,
    category: str,
    language: str | None,
    year: int,
    occurrence: date,
) -> str | None:
    """This holiday's name for display, in the requested language (falls
    back to the country's own default language if not supported - see
    `holidays.country_holidays`) - None if that exact date isn't in the
    localized calendar (shouldn't normally happen; same dates either way).
    """
    calendar = _holiday_calendar(country, subdivision, category, year, language)
    return calendar.get(occurrence)
