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

A custom event can carry a rule of the same shape - "the first Sunday in
September", see CONF_WEEKDAY in const.py - for the observances that library
does not carry because they are not public holidays. It keeps its stored
day/month, which the rule simply supersedes while it is set, and it too is
resolved per year rather than stored. event_occurrence_in_year below is the
one place that tells the two apart.
"""

from __future__ import annotations

from datetime import date, time, timedelta
from functools import lru_cache
import re

import holidays as holidays_lib

from .const import (
    CONF_DAY,
    CONF_END_TIME,
    CONF_HOLIDAY_BLOCK,
    CONF_HOLIDAY_DAY,
    CONF_HOLIDAY_SPAN,
    CONF_INTERVAL,
    CONF_INTERVAL_UNIT,
    CONF_MONTH,
    CONF_NTH,
    CONF_TIME,
    CONF_WEEKDAY,
    CONF_YEAR,
    INTERVAL_MONTHS,
    INTERVAL_YEARS,
    NTH_LAST,
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


def weekday_rule(data: dict) -> tuple[int, int] | None:
    """The (weekday, nth) a custom event recurs by, or None if it has a date.

    One place decides what counts as "this event is a rule", so the sensor,
    the calendar and the config flow can never drift apart on it. Both halves
    have to be there - half a rule is not one - and without them the event's
    stored day/month is what it falls back to, exactly as before.
    """
    weekday = data.get(CONF_WEEKDAY)
    nth = data.get(CONF_NTH)
    if weekday is None or nth is None:
        return None
    return int(weekday), int(nth)


def nth_weekday_in_year(month: int, weekday: int, nth: int, year: int) -> date:
    """The nth <weekday> of <month> in the given year.

    weekday is Monday=0..Sunday=6, as date.weekday() has it; nth is 1..4 or
    NTH_LAST. No leap-year special case is needed the way occurrence_in_year
    has one: a rule always lands on a day the month actually has.
    """
    if nth == NTH_LAST:
        # Counted back from the first of the next month rather than forward
        # from the first of this one, so month lengths and February never
        # come into it.
        after = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
        last = after - timedelta(days=1)
        return last - timedelta(days=(last.weekday() - weekday) % 7)

    first = date(year, month, 1)
    first_match = first + timedelta(days=(weekday - first.weekday()) % 7)
    return first_match + timedelta(weeks=nth - 1)


def event_occurrence_in_year(data: dict, year: int) -> date:
    """Where a yearly-recurring event falls in the given year.

    The one entry point for both shapes an event can have: its rule if it
    carries one, its stored day/month otherwise.
    """
    rule = weekday_rule(data)
    if rule is None:
        return occurrence_in_year(data[CONF_MONTH], data[CONF_DAY], year)
    weekday, nth = rule
    return nth_weekday_in_year(data[CONF_MONTH], weekday, nth, year)


def next_event_occurrence(data: dict, today: date) -> date:
    """The same, for the next occurrence on or after today."""
    candidate = event_occurrence_in_year(data, today.year)
    if candidate < today:
        candidate = event_occurrence_in_year(data, today.year + 1)
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


def interval_rule(data: dict) -> tuple[int, str] | None:
    """The (count, unit) a custom event repeats by - every 6 months, every
    2 years - or None where it repeats once a year like everything else.

    One place decides what counts as "this event has an interval", the
    way weekday_rule does for a rule: a count, a known unit and the year
    the stored date starts in, all three, since an interval is counted
    from that date and a date without a year has nothing to count from.
    """
    count = data.get(CONF_INTERVAL)
    unit = data.get(CONF_INTERVAL_UNIT)
    if not count or unit not in (INTERVAL_MONTHS, INTERVAL_YEARS) or data.get(CONF_YEAR) is None:
        return None
    return int(count), unit


def add_interval(start: date, count: int, unit: str, steps: int) -> date:
    """`start` moved `steps` intervals along - a whole number of months or
    years, so the day of the month stays put. Where the month it lands in
    has no such day (the 31st, or Feb 29), the last day of that month is
    taken, the same way occurrence_in_year handles a leap day.
    """
    if unit == INTERVAL_YEARS:
        return occurrence_in_year(start.month, start.day, start.year + count * steps)
    total = start.month - 1 + count * steps
    year, month = start.year + total // 12, total % 12 + 1
    after = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    last_day = (after - timedelta(days=1)).day
    return date(year, month, min(start.day, last_day))


def interval_occurrence(data: dict, today: date) -> tuple[date, int]:
    """An interval event's next occurrence on or after `today`, and which
    step that is - 0 on the stored date itself, 1 one interval later.

    The step is what the occurrence number reports for these events
    (see sensor.py): "the 3rd inspection since the first". Today before
    the stored date is the stored date, step 0.
    """
    count, unit = interval_rule(data)
    start = date(int(data[CONF_YEAR]), int(data[CONF_MONTH]), int(data[CONF_DAY]))
    if today <= start:
        return start, 0
    # A near-enough estimate, then walked to the first step not behind us.
    if unit == INTERVAL_YEARS:
        steps = max(0, (today.year - start.year) // count)
    else:
        months = (today.year - start.year) * 12 + today.month - start.month
        steps = max(0, months // count)
    candidate = add_interval(start, count, unit, steps)
    while candidate < today:
        steps += 1
        candidate = add_interval(start, count, unit, steps)
    while steps > 0 and add_interval(start, count, unit, steps - 1) >= today:
        steps -= 1
        candidate = add_interval(start, count, unit, steps)
    return candidate, steps


def interval_occurrences_between(data: dict, first: date, last: date) -> list[tuple[date, int]]:
    """Every occurrence of an interval event from `first` to `last`
    inclusive, with its step - what the calendar entity lists for a range,
    where a six-monthly event can fall twice in one year and a five-yearly
    one not at all.
    """
    count, unit = interval_rule(data)
    start = date(int(data[CONF_YEAR]), int(data[CONF_MONTH]), int(data[CONF_DAY]))
    candidate, steps = interval_occurrence(data, first)
    found: list[tuple[date, int]] = []
    while candidate <= last:
        found.append((candidate, steps))
        steps += 1
        candidate = add_interval(start, count, unit, steps)
    return found


def parse_time(value: str | None) -> time | None:
    """A stored "HH:MM" (or the selector's "HH:MM:SS") as a time - None for
    anything empty or unparseable, which leaves the event all-day the way
    parse_iso_date leaves it single-day.
    """
    if not value:
        return None
    try:
        return time.fromisoformat(str(value).strip())
    except ValueError:
        return None


def time_text(value: str | None) -> str | None:
    """The stored form of a time, "HH:MM" - seconds dropped, since the
    selector hands them over and nobody sets a concert for 20:00:00.
    """
    parsed = parse_time(value)
    return None if parsed is None else parsed.strftime("%H:%M")


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


# The note a calendar appends while a holiday's date is still an estimate,
# by (country, language) - see _estimate_labels. Kept beside the cache so
# that code on the event loop can read what an executor has already looked
# up, without looking anything up itself (see known_confirmed_name).
_ESTIMATE_LABELS: dict[tuple[str, str | None], tuple[tuple[str, str, str, str], ...]] = {}


def _label_frame(label: str) -> tuple[str, str] | None:
    """What a label such as "%s (estimated)" puts before and after a name."""
    if label.count("%s") != 1:
        return None
    before, after = label.split("%s")
    return before, after


def _estimate_labels(country: str, language: str | None = None) -> tuple[tuple[str, str, str, str], ...]:
    """How this country's calendar marks an estimated date in `language`
    (its own when None), and what the same name reads as without the mark -
    as (before, after, plain before, plain after).

    _NAME_SUFFIXES knows the English wording, which is one of many: the
    library writes the note in the language the calendar is in, and a
    calendar read without one is in the country's own. Indonesia's Eid is
    "Hari Raya Idul Fitri" in a year its date is announced and "Hari Raya
    Idul Fitri (perkiraan)" in every year it is still calculated - 71
    countries have a wording of their own. Compared as two names, a holiday
    imported in a confirmed year found no date in any estimated one, which
    is every year after the current.

    Two labels, the more specific first: an estimated *shifted* date
    ("(observed, estimated)") reads as the shifted one, and an estimated
    date as the name itself. Blocking - the library reads its translation
    files - so this is only ever reached from an executor.
    """
    key = (country, language)
    known = _ESTIMATE_LABELS.get(key)
    if known is not None:
        return known
    found: list[tuple[str, str, str, str]] = []
    try:
        calendar = library_calendar(country, language=language) if language else library_calendar(country)
        translate = getattr(calendar, "tr", None) or (lambda text: text)
        observed = _label_frame(translate(getattr(calendar, "observed_label", "") or ""))
        both = _label_frame(translate(getattr(calendar, "observed_estimated_label", "") or ""))
        estimated = _label_frame(translate(getattr(calendar, "estimated_label", "") or ""))
        if both and observed and both != observed:
            found.append((*both, *observed))
        if estimated and any(estimated):
            found.append((*estimated, "", ""))
    except Exception:  # noqa: BLE001 - a country or language the library
        # refuses has no labels to learn; the English ones still apply.
        found = []
    _ESTIMATE_LABELS[key] = tuple(found)
    return _ESTIMATE_LABELS[key]


def _without_estimate(name: str, labels: tuple[tuple[str, str, str, str], ...]) -> str:
    for before, after, plain_before, plain_after in labels:
        if (
            len(name) > len(before) + len(after)
            and name.startswith(before)
            and name.endswith(after)
        ):
            return f"{plain_before}{name[len(before): len(name) - len(after)]}{plain_after}"
    return name


def confirmed_name(country: str, name: str, language: str | None = None) -> str:
    """A holiday's name without the note that its date is an estimate - in
    the country's own language, or the one given. Blocking the first time a
    country is asked about (see _estimate_labels)."""
    return _without_estimate(name, _estimate_labels(country, language))


def known_confirmed_name(country: str | None, name: str, language: str | None = None) -> str:
    """confirmed_name for the event loop: answers from what is already
    known and never reads a file. A country nobody has asked about yet is
    answered with the name as it is - see warm_estimate_labels, which is what
    makes sure the ones in use have been asked about."""
    if not country:
        return name
    return _without_estimate(name, _ESTIMATE_LABELS.get((country, language), ()))


def warm_estimate_labels(pairs) -> None:
    """Look the labels up for every (country, language) given - blocking,
    for an executor, once at start-up."""
    for country, language in pairs:
        if country:
            _estimate_labels(country, language)
            _estimate_labels(country, None)


def holiday_base(country: str, name: str) -> str:
    """A holiday's identity out of one of its names in the country's own
    language: without the note that the date is an estimate, and without the
    one that it was shifted. What CONF_HOLIDAY_KEY holds for anything
    imported from now on, and what every stored key is compared as."""
    return holiday_key_from_name(confirmed_name(country, name))


def known_holiday_base(country: str | None, name: str) -> str:
    """holiday_base for the event loop - see known_confirmed_name."""
    return holiday_key_from_name(known_confirmed_name(country, name))


def _is_holiday(country: str, name: str, holiday_key: str) -> bool:
    """Whether a calendar's name is the holiday this key stands for."""
    if holiday_key_from_name(name) == holiday_key:
        return True
    return holiday_base(country, name) == holiday_base(country, holiday_key)


def _is_plain(country: str, name: str) -> bool:
    """Whether a name stands for the holiday's literal date rather than a
    shifted one. An estimated literal date is still the literal date."""
    confirmed = confirmed_name(country, name)
    return confirmed == holiday_key_from_name(confirmed)


# What the `holidays` library puts between the names of two holidays that
# fall on the same date. A calendar holds one value per date, so in a year
# Norway's Whit Monday lands on Constitution Day, the 17th of May reads
# "Andre pinsedag; Grunnlovsdag" - sorted, in whatever language was asked for.
try:
    from holidays.constants import HOLIDAY_NAME_DELIMITER
except ImportError:  # pragma: no cover - older releases kept it elsewhere
    HOLIDAY_NAME_DELIMITER = "; "


def split_holiday_names(name: str) -> tuple[str, ...]:
    """The holidays behind one calendar value - see HOLIDAY_NAME_DELIMITER."""
    return tuple(part for part in name.split(HOLIDAY_NAME_DELIMITER) if part) or (name,)


def _named_days(calendar: dict, holiday_key: str | None = None):
    """A calendar as (date, name) pairs, one per holiday rather than one per
    date - what every lookup by name below reads instead of the calendar's
    own items.

    Comparing a whole value against one holiday's key is what used to lose
    both holidays in a year they shared a date: neither "Grunnlovsdag" nor
    "Andre pinsedag" equals "Andre pinsedag; Grunnlovsdag", so each skipped
    that year and counted down to the one after.

    A key that itself contains the delimiter is an entry imported while its
    names stood joined - holidays that always share their date, like the
    Czech Republic's two on the 1st of January, stay one entry (see
    holiday_days). It is matched against the names it is made of, and reads
    as that joined name wherever they are all there.
    """
    wanted = (
        set(split_holiday_names(holiday_key))
        if holiday_key and HOLIDAY_NAME_DELIMITER in holiday_key
        else None
    )
    for occurrence, name in calendar.items():
        if HOLIDAY_NAME_DELIMITER not in name:
            yield occurrence, name
            continue
        parts = split_holiday_names(name)
        if wanted is None:
            for part in parts:
                yield occurrence, part
            continue
        if holiday_key_from_name(name) == holiday_key:
            # Exactly as it was stored - whatever its parts look like.
            yield occurrence, name
            continue
        mine = [part for part in parts if holiday_key_from_name(part) in wanted]
        if len(mine) == len(wanted):
            yield occurrence, HOLIDAY_NAME_DELIMITER.join(mine)


# How far either side of a year holiday_days looks for a joined name's parts
# standing on their own. Two holidays that only sometimes coincide are apart
# again within a year or two; this is that with room to spare.
_APART_YEARS = 3


@lru_cache(maxsize=512)
def holiday_days(
    country: str, subdivision: str | None, category: str, year: int
) -> tuple[tuple[date, str], ...]:
    """One year's holidays for the import, as (date, default-language name)
    pairs - one per holiday.

    Names sharing a date are taken apart when any of them is also found on a
    date of its own in the years around: those are different holidays that
    happen to coincide this year, and importing them as one would create an
    entry that only exists in such years. Names that are never apart are one
    holiday for every purpose that matters here and stay one entry - which
    also keeps the identity of the entries such an import has always made.
    """
    apart: set[str] | None = None
    days: list[tuple[date, str]] = []
    for occurrence, name in _holiday_calendar(country, subdivision, category, year, None).items():
        if HOLIDAY_NAME_DELIMITER not in name:
            days.append((occurrence, name))
            continue
        if apart is None:
            apart = {
                holiday_key_from_name(other)
                for offset in range(-_APART_YEARS, _APART_YEARS + 1)
                for other in _holiday_calendar(
                    country, subdivision, category, year + offset, None
                ).values()
                if HOLIDAY_NAME_DELIMITER not in other
            }
        parts = split_holiday_names(name)
        if any(holiday_key_from_name(part) in apart for part in parts):
            days.extend((occurrence, part) for part in parts)
        else:
            days.append((occurrence, name))
    return tuple(days)


def holiday_name_on(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    occurrence: date,
    language: str | None,
) -> str | None:
    """What one holiday is called on a date, in `language` - None when that
    date is not in the calendar.

    The calendar's value for a date is every holiday on it joined together,
    each language sorting the names its own way, so on a shared date the
    position says nothing about which is which. The default-language value
    does name this holiday by its key; where the requested language is
    another, its name is read from a neighbouring year in which it stands
    alone - and failing that the default-language name is used, which is
    still this holiday rather than two.
    """
    name = _holiday_calendar(country, subdivision, category, year, language).get(occurrence)
    if name is None or HOLIDAY_NAME_DELIMITER not in name or HOLIDAY_NAME_DELIMITER in holiday_key:
        return name
    default_cal = _holiday_calendar(country, subdivision, category, year, None)
    wanted = next(
        (
            part
            for part in split_holiday_names(default_cal.get(occurrence, ""))
            if _is_holiday(country, part, holiday_key)
        ),
        None,
    )
    if wanted is None:
        return name
    if wanted in split_holiday_names(name):
        return wanted
    for offset in (1, -1, 2, -2, 3, -3):
        other_default = _holiday_calendar(country, subdivision, category, year + offset, None)
        other_local = _holiday_calendar(country, subdivision, category, year + offset, language)
        for day, default_name in other_default.items():
            if default_name != wanted:
                continue
            found = other_local.get(day)
            if found and HOLIDAY_NAME_DELIMITER not in found:
                return found
    return wanted


# The small words a market's name keeps lower-case (see market_names).
_NAME_PARTICLES = {"de", "del", "di", "do", "y", "e", "of", "and", "the"}


@lru_cache(maxsize=1)
def market_names() -> dict[str, str]:
    """Every stock exchange and market calendar the `holidays` library has,
    by its canonical code - "XNYS" -> "New York Stock Exchange".

    The library keeps these apart from countries (`financial_holidays`, not
    `country_holidays`), and a holiday entry stores either kind of code in
    the same CONF_COUNTRY field: market codes are four characters, country
    codes two or three, so the two can never be mistaken for each other. The
    name is spelled out of the library's own class name ("NewYorkStockExchange"),
    or of its CamelCase alias where that one is the better-cased spelling
    ("ICEFuturesEurope" rather than "IceFuturesEurope"). Only canonical codes,
    not aliases such as "NYSE" - one code per market keeps one market one
    identity (see config_flow._import_unique_id).
    """
    try:
        from holidays.registry import FINANCIAL  # noqa: PLC0415 - optional, newer library
    except ImportError:
        return {code: code for code in holidays_lib.list_supported_financial()}
    names: dict[str, str] = {}
    for class_name, code, *aliases in FINANCIAL.values():
        spelled = [name for name in (class_name, *aliases) if any(c.islower() for c in name)]
        raw = spelled[-1] if spelled else class_name
        words = re.sub(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ", raw).split()
        # A class name capitalises every word; a market's name does not -
        # "Bolsa Mexicana de Valores", "National Stock Exchange of India".
        names[code] = " ".join(
            word.lower() if index and word.lower() in _NAME_PARTICLES else word
            for index, word in enumerate(words)
        )
    return names


# A note the library appends to a market's day - "(markets close at 1:00pm)",
# "(observed)", "（半日交易日）" - in either kind of bracket.
_TRAILING_NOTE = re.compile(r"\s*[(（][^()（）]*[)）]\s*$")

# The time a market's half day ends, in the English names the library gives
# them: "(markets close at 1:00pm)", "(markets close at 12:00 p.m. SAST)",
# "(markets close at 13:30 NZDT)", "(markets pause at 12:00pm CT)". Sydney's
# say only "(markets close early)", which this leaves alone.
_CLOSE_TIME = re.compile(
    r"\b(?:close|pause)s?\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(?:([aApP])\.?\s?[mM]\.?)?\s*([A-Z]{2,5})?\s*\)"
)


def market_reason(name: str) -> str:
    """What a stock exchange's day is for, without the note the library
    appends to it - "Christmas Eve" out of "Christmas Eve (markets close at
    1:00pm)", "Independence Day" out of "Independence Day (observed)". The
    note is what the entry's name says instead (see market_status).
    """
    return _TRAILING_NOTE.sub("", name) or name


def market_status(
    code: str, category: str, holiday_key: str, year: int
) -> tuple[str, int | None, int | None, str | None]:
    """How a stock exchange's day differs from a trading day: "closed",
    "closes_at" with the hour, minute and time zone it closes at, "closes_early"
    where its data gives no time, or "no_settlement".

    The time is read from the day's English name - the only wording every
    market with half days has, and the one the pattern above knows. Hour and
    minute are on the 24-hour clock; the zone is the market's own where the
    name states one ("CET", "SAST"), None where it does not.
    """
    if category == "restricted_settlement":
        return "no_settlement", None, None, None
    if category != "half_day":
        return "closed", None, None, None
    cls = library_calendar(code).__class__
    english = "en_US" if "en_US" in cls.supported_languages else None
    default_cal = _holiday_calendar(code, None, category, year, None)
    english_cal = _holiday_calendar(code, None, category, year, english) if english else default_cal
    for day, name in _named_days(default_cal, holiday_key):
        if not _is_holiday(code, name, holiday_key):
            continue
        match = _CLOSE_TIME.search(english_cal.get(day, name))
        if match is None:
            break
        hour, minute = int(match.group(1)), int(match.group(2) or 0)
        meridiem = (match.group(3) or "").lower()
        if meridiem == "p" and hour < 12:
            hour += 12
        elif meridiem == "a" and hour == 12:
            hour = 0
        return "closes_at", hour, minute, match.group(4)
    return "closes_early", None, None, None


def is_market(code: str | None) -> bool:
    """Whether a holiday entry's CONF_COUNTRY is a market code (see market_names)."""
    return bool(code and code in market_names())


def holiday_source_label(code: str) -> str:
    """How a country or market reads in the import's titles and results -
    the code alone for a country ("US", as the country picker shows it), the
    name with its code for a market ("New York Stock Exchange (XNYS)"),
    since nobody knows those by their code.
    """
    if is_market(code):
        return f"{market_names()[code]} ({code})"
    return code


def library_calendar(code: str, **kwargs):
    """The `holidays` library's calendar for a country or a market code -
    the one place that tells the two apart, so everything else can treat a
    market as one more country."""
    if is_market(code):
        return holidays_lib.financial_holidays(code, **kwargs)
    return holidays_lib.country_holidays(code, **kwargs)


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
        library_calendar(
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
        return frozenset(library_calendar(country).weekend)
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
        categories = library_calendar(country).__class__.supported_categories
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
        calendar = _holiday_calendar(country, subdivision, category, neighbour_year, None)
        listed_any.update(calendar)
        for occurrence, name in _named_days(calendar, holiday_key):
            if _is_holiday(country, name, holiday_key):
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
        for _day, name in _named_days(_holiday_calendar(country, subdivision, category, y, None))
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
        display_names = [holiday_key_from_name(name) for _day, name in _named_days(display_cal)]
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
        categories = library_calendar(country).__class__.supported_categories
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
    for occurrence, name in sorted(_named_days(default_cal, holiday_key)):
        if _is_holiday(country, name, holiday_key):
            found = holiday_name_on(
                country, subdivision, category, holiday_key, year, occurrence, language
            )
            if found:
                return holiday_key_from_name(confirmed_name(country, found, language))
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

    found = _holiday_dates_in_year(country, subdivision, category, holiday_key, year, observed)
    return found[0] if found else None


# Matching days closer together than this are one occurrence - the days of a
# holiday that lasts several, or its shifted day beside the literal one. A
# week apart or more is the holiday coming round again.
_SAME_OCCURRENCE_DAYS = 6


def _occurrence_starts(days) -> list[date]:
    """The first day of each occurrence among these days (see above)."""
    starts: list[date] = []
    last: date | None = None
    for day in sorted(set(days)):
        if last is None or (day - last).days > _SAME_OCCURRENCE_DAYS:
            starts.append(day)
        last = day
    return starts


def _holiday_dates_in_year(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    observed: bool,
) -> list[date]:
    """Every date a single-day holiday falls on in the year, in order.

    Usually one. A holiday of the lunar calendar comes round every 354 days
    and so lands twice in some years - Indonesia's Isra Mikraj on the 5th of
    January and again on the 26th of December 2027 - and taking only the
    earliest lost the second: once January had passed, the countdown went
    straight to the year after.
    """
    # A key that itself names a shifted date - "Eid al-Adha (observed,
    # estimated)", imported as a holiday of its own before that note was
    # understood - goes on tracking the shifted date, which is what it did
    # in the years it found one at all.
    observed = observed or not _is_plain(country, holiday_key)
    mine = [
        (occurrence, name)
        for occurrence, name in _named_days(
            _holiday_calendar(country, subdivision, category, year, None), holiday_key
        )
        # Only this year: a cached calendar can hold more years than it was
        # built for, and a match would otherwise be taken from one of them.
        if occurrence.year == year and _is_holiday(country, name, holiday_key)
    ]
    plains = _occurrence_starts(
        occurrence for occurrence, name in mine if _is_plain(country, name)
    )
    if not plains:
        # No literal date at all this year - only ever a shifted one. There
        # is nothing to anchor a shift on, so each occurrence is its first day.
        return _occurrence_starts(occurrence for occurrence, _name in mine)

    # A shift for an occurrence always lands within a handful of days of its
    # own literal date (a weekend nudge, never a different year's holiday) -
    # searched in the neighbouring years too, since the shift can cross a
    # calendar-year boundary in either direction. New Year's Day is the case
    # that needs this: when the *following* Jan 1 falls on a Saturday, the
    # `holidays` library backs its observed shift up into December of the
    # *previous* year - so year=2027's own calendar holds both 2027's literal
    # Jan 1 and the unrelated observed shift of 2028's (Dec 31, 2027), while
    # year=2028's never holds that shift at all. Going by proximity to the
    # literal date instead of by which year's calendar an entry landed in
    # gets both right.
    shifted_days: list[date] = []
    for neighbour_year in (year - 1, year, year + 1):
        for occurrence, name in _named_days(
            _holiday_calendar(country, subdivision, category, neighbour_year, None),
            holiday_key,
        ):
            if _is_holiday(country, name, holiday_key) and not _is_plain(country, name):
                shifted_days.append(occurrence)

    found: list[date] = []
    for plain in plains:
        best: tuple[int, date] | None = None
        for occurrence in shifted_days:
            delta = abs((occurrence - plain).days)
            if delta <= _SAME_OCCURRENCE_DAYS and (best is None or delta < best[0]):
                best = (delta, occurrence)
        found.append(best[1] if observed and best is not None else plain)
    return found


def _holiday_dates(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    year: int,
    observed: bool,
    span: str | None,
    block: int,
    day: int,
) -> list[date]:
    """One year's dates for any holiday entry: the one a break's part has,
    or every occurrence of a single-day holiday."""
    if span:
        occurrence = holiday_occurrence_in_year(
            country, subdivision, category, holiday_key, year, observed,
            span=span, block=block, day=day,
        )
        return [occurrence] if occurrence is not None else []
    return _holiday_dates_in_year(country, subdivision, category, holiday_key, year, observed)


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
        for occurrence in _holiday_dates(
            country, subdivision, category, holiday_key, year, observed, span, block, day
        ):
            if occurrence >= today:
                return occurrence
    return None


def previous_holiday_occurrence(
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
    """The last occurrence of this holiday before today - what the card's
    "days in the past" window counts back from.

    A holiday entry stores no day or month to work that out from, and last
    year's date is not this year's: Thanksgiving a year ago was not on the day
    it is on now. None when the last three years hold none.
    """
    # One year ahead as well: a break's end is filed under the year the
    # break starts in, and an observed New Year's Day can sit in the December
    # before - either way a date before today found under a later year.
    found: date | None = None
    for year in range(today.year - 2, today.year + 2):
        for occurrence in _holiday_dates(
            country, subdivision, category, holiday_key, year, observed, span, block, day
        ):
            if occurrence < today and (found is None or occurrence > found):
                found = occurrence
    return found


def holiday_occurrences_in_years(
    country: str,
    subdivision: str | None,
    category: str,
    holiday_key: str,
    years: tuple[int, ...],
    observed: bool = False,
    *,
    span: str | None = None,
    block: int = 0,
    day: int = 0,
) -> list[date]:
    """Every date this holiday falls on within the given calendar years.

    By the calendar year the date is in, which is not always the year it is
    resolved under (see previous_holiday_occurrence) - so the years either
    side are resolved too and the dates sorted out afterwards.
    """
    wanted = set(years)
    found: set[date] = set()
    for year in sorted({y + offset for y in wanted for offset in (-1, 0, 1)}):
        for occurrence in _holiday_dates(
            country, subdivision, category, holiday_key, year, observed, span, block, day
        ):
            if occurrence.year in wanted:
                found.add(occurrence)
    return sorted(found)


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
    if holiday_key is None:
        return name
    if name is not None:
        # The one holiday asked for, where the date holds several (see
        # holiday_name_on) - not both names on each of the two entries.
        return holiday_name_on(
            country, subdivision, category, holiday_key, year, occurrence, language
        )
    default_cal = _holiday_calendar(country, subdivision, category, year, None)
    for listed, default_name in sorted(_named_days(default_cal, holiday_key)):
        if _is_holiday(country, default_name, holiday_key):
            return holiday_name_on(
                country, subdivision, category, holiday_key, year, listed, language
            )
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
        aliases = library_calendar(country).get_subdivision_aliases()
    except Exception:  # noqa: BLE001 - an unknown country must not break the
        # sensor; the short code alone is a perfectly usable fallback.
        return None
    names = aliases.get(subdivision) or []
    # The first alias is the canonical long form; later ones are alternative
    # spellings and abbreviations.
    return names[0] if names else None
