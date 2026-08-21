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

from datetime import date, timedelta
from functools import lru_cache

import holidays as holidays_lib

from .const import (
    CONF_HOLIDAY_BLOCK,
    CONF_HOLIDAY_DAY,
    CONF_HOLIDAY_SPAN,
    SPAN_DAY,
    SPAN_END,
    SPAN_START,
)


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


def parse_iso_date(value: str | None) -> date | None:
    """An ISO "YYYY-MM-DD" string as a date - None for anything unparseable.

    Tolerant on purpose: this reads a stored config value (see CONF_END_DATE)
    and a CSV column people edit in a spreadsheet, and a malformed one should
    leave the event single-day rather than break its sensor.
    """
    if not value:
        return None
    try:
        return date.fromisoformat(str(value).strip())
    except ValueError:
        return None


def one_time_span(year: int, month: int, day: int, end_date: str | None) -> tuple[date, date]:
    """A one-time event's first and last day (see CONF_END_DATE).

    The two are the same date for a single-day event, which is every event
    without an end date - so callers never need to special-case it. An end
    that parses but lies before the start is ignored the same way an
    unparseable one is; the form rejects it, but a hand-edited CSV can still
    carry one in and a backwards span would make every "is it running"
    check nonsense.
    """
    start = one_time_date(year, month, day)
    end = parse_iso_date(end_date)
    return start, end if end is not None and end > start else start


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

    Returned as a plain dict rather than the library's own object, because
    that object populates itself lazily: looking up a date outside the years
    it was built for silently loads that year into it too. Cached and shared
    as these are, one such lookup anywhere would leave every later reader
    holding more years than it asked for - and the readers below take the
    earliest match, so they would answer with the wrong year's date. A
    snapshot cannot grow, which ends the whole question rather than asking
    each reader to defend itself.
    """
    return dict(
        holidays_lib.country_holidays(
            country,
            subdiv=subdivision or None,
            years=year,
            categories=(category,),
            language=language,
        )
    )


@lru_cache(maxsize=64)
def _country_weekend(country: str) -> frozenset[int]:
    """Which weekdays (Mon=0) are the weekend in this country - not always
    Saturday/Sunday: Israel and Egypt rest on Friday/Saturday, and the
    `holidays` library knows this per country. What makes the break-edge
    extension below work anywhere rather than only in Europe.
    """
    try:
        return frozenset(holidays_lib.country_holidays(country).weekend)
    except Exception:  # noqa: BLE001 - an unknown country must not break a
        # sensor; Sat/Sun is the overwhelmingly common case to fall back to.
        return frozenset({5, 6})


@lru_cache(maxsize=512)
def _public_holiday_dates(country: str, subdivision: str | None, year: int) -> frozenset[date]:
    """The country/region's public holidays that year - the *other* reason a
    school break really starts earlier than its listed days (a break beginning
    the day after Ascension Day is free from Ascension Day onwards).
    """
    try:
        categories = holidays_lib.country_holidays(country).__class__.supported_categories
    except Exception:  # noqa: BLE001 - see _country_weekend.
        return frozenset()
    category = "public" if "public" in categories else (categories[0] if categories else None)
    if category is None:
        return frozenset()
    try:
        return frozenset(_holiday_calendar(country, subdivision, category, year, None))
    except Exception:  # noqa: BLE001 - see _country_weekend.
        return frozenset()


@lru_cache(maxsize=512)
def holiday_break_blocks(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
) -> tuple[tuple[date, date], ...]:
    """The multi-day breaks this holiday name covers in `year`, as
    (first day, last day) pairs - see CONF_HOLIDAY_SPAN in const.py.

    Two things this has to get right that a naive "min and max date of this
    name" would not:

    1. **One name, several breaks.** Bavaria files both its February break
       and its Easter break as "Oster-/Frühjahrsferien", and every German
       region files the tail of one Christmas break and the head of the next
       as "Weihnachtsferien". Blocks are therefore found as maximal runs of
       *consecutive* listed days, not by name - min/max would otherwise
       report Bavaria's Easter break as running from mid-February to April,
       and Christmas as running from January 1st to December 31st. The search
       deliberately spans the neighbouring years too, so a break running
       across New Year stays one block; it is then attributed to the year it
       *starts* in, which is what keeps the block index below stable.

    2. **Listed days are school days, not free days.** A one-week autumn
       break is listed Monday to Friday, but school actually stops on the
       Friday before and resumes on the Monday after - so the break really
       begins on the Saturday and ends on the Sunday. Each block's edges are
       therefore walked outwards over any adjacent weekend days (per this
       country's own weekend, see _country_weekend) and public holidays,
       stopping at the first ordinary working day, or at a day this category
       already lists under another name (that is a different break, and
       swallowing it would make both spans wrong).
    """
    years = (year - 1, year, year + 1)
    listed_any: set[date] = set()
    mine: list[date] = []
    for neighbour_year in years:
        for occurrence, name in _holiday_calendar(
            country, subdivision, category, neighbour_year, None
        ).items():
            listed_any.add(occurrence)
            if holiday_key_from_name(name) == holiday_key:
                mine.append(occurrence)
    if not mine:
        return ()

    weekend = _country_weekend(country)
    public: set[date] = set()
    for neighbour_year in years:
        public |= _public_holiday_dates(country, subdivision, neighbour_year)

    def _free(day: date) -> bool:
        return day not in listed_any and (day.weekday() in weekend or day in public)

    runs: list[list[date]] = []
    for occurrence in sorted(set(mine)):
        # A gap does not necessarily end the break. Only school days are
        # listed, so a public holiday *inside* a break interrupts the run
        # without interrupting the break: Baden-Württemberg's Easter break
        # has Good Friday, the weekend and Easter Monday in the middle of it,
        # none of them listed. Treating that as two breaks produced two
        # overlapping blocks, both wrong. The run therefore continues as long
        # as every day in the gap is free; a single ordinary working day in
        # between is what makes it two breaks.
        if runs and all(
            _free(runs[-1][-1] + timedelta(days=offset))
            for offset in range(1, (occurrence - runs[-1][-1]).days)
        ):
            runs[-1].append(occurrence)
        else:
            runs.append([occurrence])

    blocks: list[tuple[date, date]] = []
    for run in runs:
        start = run[0]
        while _free(start - timedelta(days=1)):
            start -= timedelta(days=1)
        end = run[-1]
        while _free(end + timedelta(days=1)):
            end += timedelta(days=1)
        # Only blocks starting in `year` - a block starting in December
        # belongs to that year even though it ends in the next one, and the
        # neighbouring years were only loaded to find its full extent.
        if start.year == year:
            blocks.append((start, end))
    return tuple(blocks)


def _shared_name_suffix(names: list[str]) -> str:
    """The tail every one of these holiday names ends in - "ferien" across
    Germany's school holidays, " Break" across their English versions.

    Used to take a composite name apart (see _break_name_parts). Derived from
    the data rather than hard-coded per language, and only from the names
    that aren't composites themselves, so one unsplittable name can't shorten
    the answer for the rest.
    """
    plain = [name for name in names if "/" not in name]
    if len(plain) < 2:
        return ""
    shared = plain[0]
    for name in plain[1:]:
        while shared and not name.endswith(shared):
            shared = shared[1:]
        if not shared:
            return ""
    return shared


def _break_name_parts(name: str, shared_suffix: str) -> tuple[str, ...]:
    """A composite holiday name split back into whole names.

    German school calendars file two different breaks under one slash-joined
    name, with the shared word written out only once: "Oster-/Frühjahrsferien"
    is "Osterferien" and "Frühjahrsferien", "Ascension/Whit Break" is
    "Ascension Break" and "Whit Break". Splitting means putting that shared
    tail back on each half - and dropping the hyphen German leaves behind to
    mark the elision.

    Empty when the name isn't a composite, or is built the other way round
    (Ukrainian and Thai put the shared word first and slash the tail instead,
    which this deliberately doesn't try to handle - the names are left whole
    there rather than guessed at wrongly).
    """
    if "/" not in name or not shared_suffix or not name.endswith(shared_suffix):
        return ()
    stem = name[: -len(shared_suffix)]
    parts = []
    for segment in stem.split("/"):
        segment = segment.strip().rstrip("-").strip()
        if not segment:
            return ()
        parts.append(f"{segment}{shared_suffix}")
    return tuple(parts) if len(parts) > 1 else ()


@lru_cache(maxsize=256)
def holiday_break_names(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    language: str | None,
) -> tuple[str, ...]:
    """One name per block (see holiday_break_blocks), telling apart the
    breaks a composite name lumps together - or empty when they can't be.

    Which half belongs to which block is decided by the public holidays the
    block actually contains, never by the order the halves are written in:
    "Oster-/Frühjahrsferien" lists Easter first, but in Bavaria the *later*
    block is the Easter one and the earlier is the February break. So a half
    claims a block when a public holiday whose name contains that half's stem
    falls inside it - Ostermontag for "Oster-", Christi Himmelfahrt for
    "Himmelfahrts-" (the linking -s is dropped before matching), Pfingstmontag
    for "Pfingst-".

    A block with no public holiday at all falls to whichever half has no
    holiday anchoring it anywhere that year - the secular half of the pair,
    "Frühjahrsferien", which is exactly what Bavaria's February break and
    Hamburg's March break are.

    All or nothing: unless every block ends up with a name of its own, the
    empty tuple is returned and all of them keep the composite name plus a
    numeric suffix. A half-split set of names would be worse than no split -
    "Osterferien" next to "Oster-/Frühjahrsferien" reads like an error.
    """
    blocks = holiday_break_blocks(country, subdivision, category, holiday_key, year)
    if not blocks:
        return ()

    years = tuple(sorted({year, *(d.year for block in blocks for d in block)}))
    default_names = [
        holiday_key_from_name(name)
        for y in years
        for name in _holiday_calendar(country, subdivision, category, y, None).values()
    ]
    shared_suffix = _shared_name_suffix(default_names)
    parts = _break_name_parts(holiday_key, shared_suffix)
    if len(parts) != len(set(parts)):
        return ()

    # Public holidays, by date, in every year the blocks touch.
    public: dict[date, list[str]] = {}
    for y in years:
        for occurrence, name in _public_holiday_names(country, subdivision, y):
            public.setdefault(occurrence, []).append(name)

    # A part's stem, minus the linking -s German compounds insert
    # ("Himmelfahrts-" anchors on "Christi Himmelfahrt").
    stems = []
    for part in parts:
        stem = part[: len(part) - len(shared_suffix)].strip()
        stems.append(stem[:-1] if stem.endswith("s") and len(stem) > 3 else stem)
    if not stems or len(stems) != len(set(stems)):
        return ()

    anchored_anywhere = {
        index
        for index, stem in enumerate(stems)
        if any(stem in name for names in public.values() for name in names)
    }

    claimed: list[int | None] = []
    for first, last in blocks:
        inside = [
            name
            for occurrence, names in public.items()
            if first <= occurrence <= last
            for name in names
        ]
        hits = [index for index, stem in enumerate(stems) if any(stem in name for name in inside)]
        if len(hits) == 1:
            claimed.append(hits[0])
        elif not hits and len(unanchored := [i for i in range(len(stems)) if i not in anchored_anywhere]) == 1:
            claimed.append(unanchored[0])
        else:
            claimed.append(None)

    if any(index is None for index in claimed) or len(set(claimed)) != len(claimed):
        return ()

    # The parts above are in the default language, which is what the public
    # holidays could be matched against. The names actually shown have to be
    # split the same way out of the requested language's own composite.
    display_parts = parts
    if language:
        display_cal = _holiday_calendar(country, subdivision, category, year, language)
        display_names = [holiday_key_from_name(name) for name in display_cal.values()]
        localized = _localized_name(country, subdivision, category, holiday_key, year, language)
        if localized:
            split = _break_name_parts(localized, _shared_name_suffix(display_names))
            if len(split) == len(parts):
                display_parts = split
            else:
                # No usable split in this language - better the whole
                # localized name on every block than a German name shown to
                # someone who asked for another language.
                return ()
    return tuple(display_parts[index] for index in claimed)


def _public_holiday_names(
    country: str, subdivision: str | None, year: int
) -> list[tuple[date, str]]:
    """That year's public holidays as (date, name) pairs - the anchors
    holiday_break_names attributes a block to.
    """
    try:
        categories = holidays_lib.country_holidays(country).__class__.supported_categories
    except Exception:  # noqa: BLE001 - see _country_weekend.
        return []
    category = "public" if "public" in categories else (categories[0] if categories else None)
    if category is None:
        return []
    try:
        return list(_holiday_calendar(country, subdivision, category, year, None).items())
    except Exception:  # noqa: BLE001 - see _country_weekend.
        return []


def _localized_name(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    language: str | None,
) -> str | None:
    """This holiday's own name in `language`, found via any date it falls on."""
    default_cal = _holiday_calendar(country, subdivision, category, year, None)
    localized_cal = _holiday_calendar(country, subdivision, category, year, language)
    for occurrence, name in sorted(default_cal.items()):
        if holiday_key_from_name(name) == holiday_key:
            found = localized_cal.get(occurrence)
            if found:
                return holiday_key_from_name(found)
    return None


def holiday_break_display_name(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    language: str | None,
    block: int,
) -> str | None:
    """The name for one block of a break, when the composite could be taken
    apart (see holiday_break_names) - None when it couldn't, or the block
    doesn't exist that year.
    """
    names = holiday_break_names(country, subdivision, category, holiday_key, year, language)
    return names[block] if block < len(names) else None


def holiday_span_kwargs(data: dict) -> dict:
    """The break-related keyword arguments for one config entry's data - so
    every caller of the resolvers below spells this out the same way.
    """
    return {
        "span": data.get(CONF_HOLIDAY_SPAN) or None,
        "block": int(data.get(CONF_HOLIDAY_BLOCK) or 0),
        "day": int(data.get(CONF_HOLIDAY_DAY) or 0),
    }


def holiday_label(holiday_key: str, *, observed: bool = False, suffix: str = "") -> str:
    """The label for one holiday entry - its name plus whatever marks which
    variant of it this entry is.

    `suffix` is the break decoration, already rendered and already translated
    (see CONF_HOLIDAY_SUFFIX and helpers.async_span_labels): "(Beginn)",
    "(2) (Ende)", "(Tag 3)". It is passed in rather than built here because
    this module has no access to Home Assistant's translations - and because
    it is fixed when the entry is created, so that an entry does not rename
    itself if the server language changes later.
    """
    label = f"{holiday_key} {suffix}" if suffix else holiday_key
    return f"{label} (observed)" if observed else label


def holiday_occurrence_in_year(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    observed: bool = False,
    *,
    span: str | None = None,
    block: int = 0,
    day: int = 0,
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

    `span` (with `block`/`day`) instead resolves a multi-day break's first
    day, last day, or one individual day of it - see holiday_break_blocks and
    CONF_HOLIDAY_SPAN. It has nothing to do with `observed`, which is about
    single-day statutory holidays being shifted off a weekend, and the two
    are never combined on the same entry.
    """
    if span:
        blocks = holiday_break_blocks(country, subdivision, category, holiday_key, year)
        if block >= len(blocks):
            # This name covered more separate breaks in the import year than
            # it does in this one (see holiday_break_blocks) - no occurrence,
            # handled the same as a holiday that was legislated away.
            return None
        first, last = blocks[block]
        if span == SPAN_END:
            return last
        if span == SPAN_DAY:
            target = first + timedelta(days=day)
            # A shorter break this year simply has no such day.
            return target if target <= last else None
        return first

    plain: date | None = None
    for occurrence, name in _holiday_calendar(country, subdivision, category, year, None).items():
        # Only this year: a cached calendar can hold more years than it was
        # built for (see the estimated-only branch below for why), and the
        # earliest match would otherwise be taken from one of them.
        if occurrence.year != year:
            continue
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
        #
        # The year check is not redundant. A `holidays` calendar populates
        # itself lazily: looking a date up that lies outside the years it
        # was built for silently loads that year into it as well - and these
        # objects are cached and shared (see _holiday_calendar), so one such
        # lookup anywhere leaves every later reader looking at more years
        # than it asked for. Taking the earliest match without checking then
        # answers with the *previous* year's occurrence, which for a lunar
        # holiday is a fortnight-sized error rather than a rounding one.
        for occurrence, name in _holiday_calendar(country, subdivision, category, year, None).items():
            if occurrence.year != year:
                continue
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
    *,
    span: str | None = None,
    block: int = 0,
    day: int = 0,
) -> date | None:
    """The next occurrence of this holiday on or after today - see
    holiday_occurrence_in_year for what `observed` and `span` select between.

    None only if the holiday isn't found in any of the next few years -
    e.g. it was legislated away - since that can't be assumed impossible.
    """
    # Break entries also look one year back: a break is filed under the year
    # it *starts* in (see holiday_break_blocks), so on the 3rd of January the
    # Christmas break still running - and its end, still days away - belongs
    # to last year and would otherwise be skipped over entirely, jumping
    # straight to next Christmas.
    years = (today.year - 1,) if span else ()
    for year in (*years, today.year, today.year + 1, today.year + 2):
        occurrence = holiday_occurrence_in_year(
            country, subdivision, category, holiday_key, year, observed,
            span=span, block=block, day=day,
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
    holiday_key: str | None = None,
) -> str | None:
    """This holiday's name for display, in the requested language (falls
    back to the country's own default language if not supported - see
    `holidays.country_holidays`) - None if that exact date isn't in the
    localized calendar (shouldn't normally happen; same dates either way).

    Break entries are the one case where the date routinely *isn't* listed:
    the computed first and last day of a break are usually weekend days,
    which no calendar lists (see holiday_break_blocks). Passing
    `holiday_key` covers that - the name is then looked up from any date the
    key does appear on, since it's the same break either way.
    """
    calendar = _holiday_calendar(country, subdivision, category, year, language)
    name = calendar.get(occurrence)
    if name is not None or holiday_key is None:
        return name
    default_cal = _holiday_calendar(country, subdivision, category, year, None)
    for listed, default_name in sorted(default_cal.items()):
        if holiday_key_from_name(default_name) == holiday_key:
            return calendar.get(listed)
    return None


@lru_cache(maxsize=256)
def subdivision_name(country: str, subdivision: str | None) -> str | None:
    """A subdivision's spelled-out name ("CA" -> "California"), from the
    `holidays` library's own alias table - None when it has none, and for a
    country-wide entry with no subdivision at all.

    Cached because it builds a calendar instance to reach the table, which is
    the same cost as _holiday_calendar above and just as repetitive across
    the dozens of entries one country import creates.
    """
    if not subdivision:
        return None
    try:
        aliases = holidays_lib.country_holidays(country).get_subdivision_aliases()
    except Exception:  # noqa: BLE001 - an unknown country must not break the
        # sensor; the short code alone is a perfectly usable fallback.
        return None
    names = aliases.get(subdivision) or []
    # The first alias is the canonical long form; later ones are alternative
    # spellings and abbreviations.
    return names[0] if names else None
