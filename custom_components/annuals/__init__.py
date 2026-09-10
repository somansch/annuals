from __future__ import annotations

from datetime import date
import functools
import logging
from pathlib import Path

from homeassistant.components import frontend, persistent_notification
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.helpers.typing import ConfigType

from .const import (
    CONF_DAY,
    CONF_EVENT_NAME,
    CONF_END_DATE,
    CONF_EVENT_TYPE,
    CONF_CATEGORY,
    CONF_COUNTRY,
    CONF_HOLIDAY_KEY,
    CONF_HOLIDAY_OBSERVED,
    CONF_HOLIDAY_SPAN,
    CONF_SUBDIVISION,
    CONF_HUB,
    CONF_MONTH,
    CONF_NAME_TRANSLATIONS,
    CONF_YEAR,
    DATA_REMINDER_STRINGS,
    DATA_SENSORS,
    DATA_TODO_UNSUB,
    DATA_TYPE_LABELS,
    DOMAIN,
    TYPE_HOLIDAY,
    TYPE_ONE_TIME,
)
from .dates import _holiday_calendar, holiday_key_from_name, one_time_span
from .helpers import (
    CATEGORY_PUBLIC,
    async_event_type_labels,
    async_reminder_strings,
    full_name,
    holiday_date,
    hub_title,
    merge_group,
    mergeable,
    outranks,
)
from .http import AnnualsExportCsvView, AnnualsExportTranslationsView
from .services import async_register_services
from .todo_match import (
    async_refresh_todo_matches,
    async_request_todo_refresh,
    async_setup_todo_tracking,
)

_LOGGER = logging.getLogger(__name__)

# This integration is config-entry only - it has no YAML configuration
# options of its own, even though async_setup() below exists (to register
# the bundled Lovelace card at startup).
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# Per-event entries own one sensor each; the single auto-created hub entry
# owns the shared cross-event entities (the per-type calendars, plus any
# future global entities).
EVENT_PLATFORMS: list[Platform] = [Platform.SENSOR]
HUB_PLATFORMS: list[Platform] = [Platform.CALENDAR]

_HUB_FLOW_STARTED = "hub_flow_started"

# The bundled Lovelace card (custom_components/annuals/frontend/annuals-card.js)
# is served from this URL and auto-loaded on every dashboard via
# frontend.add_extra_js_url - no manual "Add resource" step required.
FRONTEND_JS_URL = "/annuals-frontend/annuals-card.js"

# What is actually handed to add_extra_js_url. Home Assistant imports it
# once per page, awaited by nothing and retried by nothing, so one fetch
# that does not arrive left the card missing until that page was reloaded.
# The loader is a few hundred bytes and fetches the card itself, for as
# many attempts as it takes - see annuals-card-loader.js.
FRONTEND_LOADER_URL = "/annuals-frontend/annuals-card-loader.js"

# Remembers the frontend JS's own mtime (see FRONTEND_JS_URL's cache-busting
# "?v=" below) across restarts, purely so a persistent notification can be
# shown exactly when it actually changed - not on every restart regardless.
FRONTEND_VERSION_STORE_KEY = f"{DOMAIN}_frontend_version"
FRONTEND_VERSION_STORE_VERSION = 1


def _platforms_for(config_entry: ConfigEntry) -> list[Platform]:
    return HUB_PLATFORMS if config_entry.data.get(CONF_HUB) else EVENT_PLATFORMS


async def _async_purge_expired_one_time_events(hass: HomeAssistant) -> None:
    """Remove one-time event entries (see TYPE_ONE_TIME in const.py) once
    their date is in the past. Unlike every other type, a one-time event
    never recurs - once it's over there's nothing left for it to count down
    to, so (unlike everything else in this integration) it's cleaned up
    automatically instead of sticking around until manually removed.
    """
    # HA's configured time zone, not the OS's - see _update_state in
    # sensor.py. This decides whether a one-time event is over, so an
    # hour's disagreement is a whole event removed a day early.
    today = dt_util.now().date()
    for entry in list(hass.config_entries.async_entries(DOMAIN)):
        data = entry.data
        if data.get(CONF_EVENT_TYPE) != TYPE_ONE_TIME:
            continue
        # The *last* day, which for a multi-day event (a holiday trip, see
        # CONF_END_DATE) is not the day it started on - removing it the
        # morning after departure is exactly what this must not do.
        _, occurrence = one_time_span(
            data[CONF_YEAR], data[CONF_MONTH], data[CONF_DAY], data.get(CONF_END_DATE)
        )
        if occurrence < today:
            _LOGGER.info(
                "Annuals: removing expired one-time event '%s' (%s)", entry.title, occurrence
            )
            await hass.config_entries.async_remove(entry.entry_id)


async def _async_midnight_tasks(hass: HomeAssistant, _now) -> None:
    """Runs once a day, a few seconds after local midnight (see async_setup
    below): first removes any one-time events whose date just passed, then
    forces every remaining AnnualEventSensor to recompute "days until" -
    instead of leaving yesterday's count showing until each sensor's next
    hourly poll happens to land (up to nearly an hour late).
    """
    await _async_purge_expired_one_time_events(hass)
    sensors = list(hass.data.get(DOMAIN, {}).get(DATA_SENSORS, ()))
    _LOGGER.debug("Annuals: midnight refresh of %d sensor(s)", len(sensors))
    for sensor in sensors:
        sensor.async_schedule_update_ha_state(force_refresh=True)
    # After the sensors, not before: the to-do match gates on each event's
    # next_date (see todo_match.py), which is exactly what just rolled over.
    await async_refresh_todo_matches(hass)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the bundled Lovelace card once at startup."""
    hass.data.setdefault(DOMAIN, {})

    # Before any entry is set up, so nothing is loaded that is about to be
    # removed, and so the entries the platforms then see are the ones that
    # survive.
    await _async_migrate_holiday_keys(hass)
    await _async_merge_holiday_categories(hass)

    # A few seconds of slack after midnight, not exactly on it, so this
    # doesn't race the moment the date actually rolls over. functools.partial
    # (not a lambda) so HA's event helper still recognises this as a
    # coroutine function and awaits it, instead of firing-and-forgetting it.
    async_track_time_change(
        hass, functools.partial(_async_midnight_tasks, hass), hour=0, minute=0, second=5
    )

    await _async_register_frontend(hass)

    async_register_services(hass)
    hass.http.register_view(AnnualsExportCsvView())
    hass.http.register_view(AnnualsExportTranslationsView())
    return True


def _capitals(text: str) -> int:
    """How many capital letters a name carries."""
    return sum(1 for char in text if char.isupper())


async def _async_migrate_holiday_keys(hass: HomeAssistant) -> None:
    """Fold the case out of every imported holiday's identity, once.

    A holiday is identified by its name in the `holidays` library's own
    default language (see CONF_HOLIDAY_KEY), and that library rewrites its
    names from time to time - sometimes changing nothing but a capital
    letter. Measured on the Netherlands across two releases: five of the
    ten public holidays changed that way, "Eerste kerstdag" to "Eerste
    Kerstdag" among them. The unique id those entries were stored under
    compared the name exactly, so after such a release "Import public
    holidays" no longer recognised them and added a second entry beside
    each - the same holiday twice, one capital letter apart.

    The id ignores case now (see config_flow._import_unique_id). This
    brings the entries already on disk onto it. Where two of them turn out
    to be one holiday, the one whose name carries the capitals is kept -
    that is the spelling the library has settled on, and the one a fresh
    import produces - and the other is removed after handing over any
    holiday-name translations that were typed into it, which are the one
    thing on such an entry that is laborious to re-enter.

    Idempotent: on every later start the ids already agree and nothing
    happens.
    """
    # Imported here rather than at module level: config_flow pulls in the
    # calendar and vCard parsers, which nothing else at startup needs.
    from .config_flow import _import_unique_id

    by_id: dict[str, list] = {}
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.data.get(CONF_EVENT_TYPE) != TYPE_HOLIDAY:
            continue
        by_id.setdefault(_import_unique_id(entry.data), []).append(entry)

    for unique_id, group in by_id.items():
        # Stable sort, so entries that tie keep the order they were
        # created in and the oldest wins.
        group.sort(key=lambda entry: -_capitals(entry.data.get(CONF_HOLIDAY_KEY) or ""))
        keep, duplicates = group[0], group[1:]

        await _async_absorb(
            hass,
            keep,
            duplicates,
            "the same holiday, which the holidays library used to spell differently",
        )
        if keep.unique_id != unique_id:
            hass.config_entries.async_update_entry(keep, unique_id=unique_id)


async def _async_absorb(hass: HomeAssistant, keep, losers: list, why: str) -> None:
    """Remove `losers`, moving what was typed into them onto `keep` first.

    The holiday names someone wrote themselves are the one thing on an
    imported holiday that is laborious to re-enter, so they are carried
    across rather than deleted with the entry. The kept entry's own wording
    always wins; this only fills its gaps.
    """
    if not losers:
        return
    translations = dict(keep.data.get(CONF_NAME_TRANSLATIONS) or {})
    for entry in losers:
        for language, name in (entry.data.get(CONF_NAME_TRANSLATIONS) or {}).items():
            translations.setdefault(language, name)
        # With the category, because the two can be told apart by nothing
        # else: merged categories often carry the very same name.
        _LOGGER.warning(
            "Annuals: removing %s (%s) - %s as %s (%s). See the changelog for v3.2.0",
            entry.title,
            entry.data.get(CONF_CATEGORY),
            why,
            keep.title,
            keep.data.get(CONF_CATEGORY),
        )
        await hass.config_entries.async_remove(entry.entry_id)
    if translations != (keep.data.get(CONF_NAME_TRANSLATIONS) or {}):
        hass.config_entries.async_update_entry(
            keep, data={**keep.data, CONF_NAME_TRANSLATIONS: translations}
        )


async def _async_merge_holiday_categories(hass: HomeAssistant) -> None:
    """One entry per holiday, whatever categories it was imported under.

    The `holidays` library files the same date under several categories at
    once - a US statutory holiday is typically both public and government -
    and often under a different name in each, so only the date says they are
    the same day. Importing those categories together has always collapsed
    them (see config_flow._build_holiday_rows); importing them one after the
    other did not, and left the same holiday standing twice.

    **Public wins.** Where two entries share a date, a public one replaces
    the rest; between two non-public ones the older stays. New imports are
    folded against what is stored by the same rule, in
    config_flow._resolve_category_clashes - this is the one-time pass for
    what is already on disk.

    Costs nothing where there is nothing to do: a country/region whose
    holidays all came from one category is skipped before a single date is
    resolved, which is every instance that imported once.
    """
    groups: dict[tuple, list] = {}
    for entry in hass.config_entries.async_entries(DOMAIN):
        if mergeable(entry.data):
            groups.setdefault(merge_group(entry.data), []).append(entry)

    candidates = {
        group: entries
        for group, entries in groups.items()
        if len({entry.data.get(CONF_CATEGORY) for entry in entries}) > 1
    }
    if not candidates:
        return

    year = date.today().year
    by_date = await hass.async_add_executor_job(_holiday_dates, candidates, year)

    for entries in by_date.values():
        if len(entries) < 2:
            continue
        # Stable: among entries no one outranks, the one that was there
        # first stays - the same tie-break the in-import merge uses.
        entries.sort(key=lambda entry: entry.data.get(CONF_CATEGORY) != CATEGORY_PUBLIC)
        # Whoever leads now speaks for the date: a public entry if there is
        # one, otherwise the oldest of two categories that neither outrank.
        keep, losers = entries[0], entries[1:]
        await _async_absorb(hass, keep, losers, "the same date, already imported")


def _holiday_dates(groups: dict, year: int) -> dict:
    """Every entry bucketed by the date it lands on - blocking, so it runs
    in an executor (each bucket builds a holiday calendar).
    """
    buckets: dict[tuple, list] = {}
    for group, entries in groups.items():
        for entry in entries:
            occurrence = holiday_date(entry.data, year)
            if occurrence is not None:
                buckets.setdefault((group, occurrence), []).append(entry)
    return buckets


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the bundled card and have every dashboard load it.

    Kept out of async_setup and unable to raise into it. Reading the file's
    own mtime used to be the first thing that happened here, so a card that
    was not on disk - an incomplete download is the realistic way to get
    there - took the whole integration down with it: no events, no
    calendars, no services, over a dashboard card.
    """
    frontend_dir = Path(__file__).parent / "frontend"
    card_path = frontend_dir / "annuals-card.js"
    loader_path = frontend_dir / "annuals-card-loader.js"

    try:
        version = int(card_path.stat().st_mtime)
    except OSError as err:
        _LOGGER.warning(
            "The bundled dashboard card is missing (%s): %s. Everything else is "
            "set up as usual - reinstall the integration to get the card back.",
            card_path,
            err,
        )
        return

    paths = [StaticPathConfig(FRONTEND_JS_URL, str(card_path), False)]
    if loader_path.is_file():
        paths.append(StaticPathConfig(FRONTEND_LOADER_URL, str(loader_path), False))
    await hass.http.async_register_static_paths(paths)

    # cache_headers=False omits an explicit Cache-Control header - browsers
    # still apply heuristic caching from Last-Modified/ETag, so a stale copy
    # can survive a reload after the card is updated. Busting the URL with
    # the file's own mtime forces a fresh fetch whenever it changes (i.e. on
    # every restart after an update).
    #
    # A tempting-looking "improvement" was tried here once: cache_headers=True
    # for a long, aggressive max-age, reasoning that the "?v=" cache-buster
    # below makes any URL content-immutable so aggressive caching is safe.
    # That reasoning has a hole: `version` is only ever recomputed at HA
    # startup (this function only runs on integration setup), not whenever
    # the file on disk actually changes. If the file changes without an
    # intervening restart - exactly what happens while iterating on this
    # card, but also possible in the wild depending on how an update is
    # applied - the URL does NOT change, and a long max-age then means the
    # browser keeps serving the OLD cached content under that same URL for
    # the entire max-age window, never even asking the server again on a
    # normal reload. That is strictly worse than the plain heuristic-caching
    # behavior this reverts to (which still revalidates against
    # Last-Modified/ETag on a normal reload) - confirmed live: after that
    # change, only a hard refresh (cache-bypassing) picked up a new version;
    # a normal F5 kept re-showing stale content instead of even the usual
    # "custom element doesn't exist" race, which is a worse failure mode
    # than what this was trying to fix in the first place.
    #
    # What is handed over is the loader, not the card. Home Assistant imports
    # what it is given exactly once per page and never retries, so a single
    # fetch that did not arrive left the card missing until that page was
    # reloaded. The loader fetches the card itself, for as many attempts as
    # it takes - see annuals-card-loader.js. The "?v=" travels with it and
    # the loader carries it over to the card's own URL, so the cache-busting
    # described above is unchanged.
    #
    # Without the loader on disk the card is handed over directly: a card
    # that cannot retry still beats no card at all.
    url = FRONTEND_LOADER_URL if loader_path.is_file() else FRONTEND_JS_URL
    frontend.add_extra_js_url(hass, f"{url}?v={version}")

    # The cache-busting "?v=" above only takes effect on a browser tab's next
    # *full* page load - restarting HA (e.g. after a HACS update) doesn't by
    # itself make an already-open tab re-fetch the new file, since it's an ES
    # module the browser already has cached under the old URL for that page's
    # lifetime. There's no way to force that from here without an unprompted
    # reload of someone's browser, which could interrupt whatever else they're
    # doing - so instead, just reliably tell them a refresh is actually needed
    # this time, rather than leaving them to guess (or reflexively refresh)
    # after every restart regardless of whether this card even changed.
    store = Store(hass, FRONTEND_VERSION_STORE_VERSION, FRONTEND_VERSION_STORE_KEY)
    previous = await store.async_load()
    if previous is not None and previous.get("version") != version:
        persistent_notification.async_create(
            hass,
            "The bundled Annuals dashboard card was updated. Refresh any open "
            "browser tab (F5) to load the new version - already-open tabs keep "
            "running the previous one until then.",
            title="Annuals card updated",
            notification_id=f"{DOMAIN}_frontend_updated",
        )
    await store.async_save({"version": version})


async def async_setup_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Set up one Annuals entry (an event, or the shared hub)."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    # Both cached once per HA run, whichever entry happens to set up first
    # (hub or event) - see DATA_TYPE_LABELS/DATA_REMINDER_STRINGS in const.py
    # for why this must happen before the platform forward below, which is
    # what actually constructs AnnualEventSensor (sync, can't await these
    # itself).
    if DATA_TYPE_LABELS not in domain_data:
        domain_data[DATA_TYPE_LABELS] = await async_event_type_labels(hass)
    if DATA_REMINDER_STRINGS not in domain_data:
        domain_data[DATA_REMINDER_STRINGS] = await async_reminder_strings(hass)

    if config_entry.data.get(CONF_HUB):
        # Migrates hub entries created before the "Annuals Settings" title
        # (they were titled plain "Annuals") to the current, translated title.
        new_title = hub_title(hass)
        if config_entry.title != new_title:
            hass.config_entries.async_update_entry(config_entry, title=new_title)
    elif config_entry.data.get(CONF_EVENT_TYPE) == TYPE_HOLIDAY:
        await _async_migrate_holiday_name(hass, config_entry)

    await hass.config_entries.async_forward_entry_setups(
        config_entry, _platforms_for(config_entry)
    )

    if config_entry.data.get(CONF_HUB):
        async_setup_todo_tracking(hass)
        # Deferred rather than awaited here: it removes other config entries,
        # which must not happen while this one is still setting up.
        hass.async_create_task(_async_migrate_holiday_regions(hass))
    else:
        _async_ensure_hub(hass)
        # A newly set-up event may already have an open to-do waiting for it
        # (a restart, an import, a single added entry) - debounced, so a
        # bulk import asks once rather than once per entry.
        async_request_todo_refresh(hass)

    return True


async def _async_migrate_holiday_name(hass: HomeAssistant, config_entry: ConfigEntry) -> None:
    """Correct a holiday entry's stored name/title if it was frozen wrong.

    Before CONF_HOLIDAY_OBSERVED existed, a holiday's CONF_EVENT_NAME could
    permanently bake in a "(observed)"/"(estimated)" suffix that only
    happened to be there in the year it was imported (see
    config_flow._build_holiday_rows) - sensor.py's own AnnualEventSensor
    already self-heals its *displayed* friendly_name from this every time
    it's constructed, but config_entry.data itself (and anything else that
    reads CONF_EVENT_NAME directly, like the calendar entity's event summary
    and this entry's own title - see calendar.py's full_name() use and
    config_flow._entry_title) needs the stored value corrected once, here,
    rather than on every read.
    """
    data = config_entry.data
    # Break entries are left alone: their name carries a translated
    # "(Beginn)"/"(Tag 3)" suffix fixed when they were imported (see
    # CONF_HOLIDAY_SUFFIX), which this has no business rewording.
    if data.get(CONF_HOLIDAY_SPAN):
        return
    base_name = holiday_key_from_name(data[CONF_EVENT_NAME])
    correct_name = f"{base_name} (observed)" if data.get(CONF_HOLIDAY_OBSERVED, False) else base_name
    if correct_name == data[CONF_EVENT_NAME]:
        return
    new_data = {**data, CONF_EVENT_NAME: correct_name}
    labels = await async_event_type_labels(hass)
    new_title = f"{labels[TYPE_HOLIDAY]}: {full_name(new_data)}"
    hass.config_entries.async_update_entry(config_entry, data=new_data, title=new_title)


def _nationwide_holiday_keys(country: str, category: str) -> set[str]:
    """Which of a country's holidays every region observes - the country-level
    calendar with no subdivision. Blocking (the holidays library reads its
    own data files), so only ever called from an executor.
    """
    calendar = _holiday_calendar(country, None, category, date.today().year, None)
    return {holiday_key_from_name(name) for name in calendar.values()}


async def _async_migrate_holiday_regions(hass: HomeAssistant) -> None:
    """Collapse per-region copies of a nationwide holiday into one entry.

    Holidays used to be stored under the region they were imported from, so
    importing two regions of one country produced two "Christmas Day"
    entries - one per region - for a holiday the whole country observes.
    Imports now store those without a region at all (see
    _build_holiday_rows); this brings entries created before that in line.

    The first copy of each is kept and stripped of its region, the rest are
    removed. Idempotent by construction: once the survivor has no region,
    nothing here matches it again.
    """
    # Imported here rather than at module level purely to keep __init__ free
    # of a config_flow import; the identity has to be built by that exact
    # function, since a hand-rolled copy drifting from it would leave
    # entries that no later import can match.
    from .config_flow import _import_unique_id

    holidays_entries = [
        entry
        for entry in hass.config_entries.async_entries(DOMAIN)
        if not entry.data.get(CONF_HUB) and entry.data.get(CONF_EVENT_TYPE) == TYPE_HOLIDAY
    ]
    if not holidays_entries:
        return

    # One lookup per country/category rather than per entry - a country's
    # import creates dozens of entries that all ask the same question.
    nationwide: dict[tuple[str, str], set[str]] = {}

    async def _target_subdivision(data: dict) -> str | None:
        subdivision = data.get(CONF_SUBDIVISION)
        if not subdivision:
            return None
        cache_key = (data.get(CONF_COUNTRY), data.get(CONF_CATEGORY))
        if cache_key not in nationwide:
            nationwide[cache_key] = await hass.async_add_executor_job(
                _nationwide_holiday_keys, *cache_key
            )
        return None if data.get(CONF_HOLIDAY_KEY) in nationwide[cache_key] else subdivision

    # Grouped by where each entry *belongs*, not where it currently sits, so
    # one pass catches both jobs at once: several regions' copies of one
    # nationwide holiday collapse together, and entries that already share an
    # identity (including ones an earlier, incomplete run of this migration
    # left behind) collapse too.
    by_identity: dict[str, list[ConfigEntry]] = {}
    targets: dict[str, str | None] = {}
    for entry in holidays_entries:
        target = await _target_subdivision(entry.data)
        identity = _import_unique_id({**entry.data, CONF_SUBDIVISION: target})
        by_identity.setdefault(identity, []).append(entry)
        targets[identity] = target

    removed = 0
    rekeyed = 0
    for identity, entries in by_identity.items():
        survivor, *duplicates = entries
        # Duplicates go first: the survivor's new unique_id would otherwise
        # collide with a copy that still holds it.
        for duplicate in duplicates:
            await hass.config_entries.async_remove(duplicate.entry_id)
            removed += 1
        if survivor.unique_id == identity and survivor.data.get(CONF_SUBDIVISION) == targets[identity]:
            continue
        hass.config_entries.async_update_entry(
            survivor,
            data={**survivor.data, CONF_SUBDIVISION: targets[identity]},
            unique_id=identity,
        )
        # Changing entry data doesn't restart the entry by itself, so without
        # this the sensor keeps publishing the region it was set up with.
        await hass.config_entries.async_reload(survivor.entry_id)
        rekeyed += 1

    if removed or rekeyed:
        _LOGGER.info(
            "Annuals: re-keyed %d nationwide holiday entries and removed %d duplicate(s)",
            rekeyed,
            removed,
        )


def _async_ensure_hub(hass: HomeAssistant) -> None:
    """Auto-create the hub entry the first time any event is set up.

    The started-flag guards against several event entries setting up
    concurrently and each starting a hub flow before the first one's entry
    exists; the flow's unique_id is a second, persistent guard.
    """
    if any(
        entry.data.get(CONF_HUB)
        for entry in hass.config_entries.async_entries(DOMAIN)
    ):
        return
    if hass.data[DOMAIN].get(_HUB_FLOW_STARTED):
        return
    hass.data[DOMAIN][_HUB_FLOW_STARTED] = True
    hass.async_create_task(
        hass.config_entries.flow.async_init(DOMAIN, context={"source": CONF_HUB})
    )


async def async_unload_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Unload one Annuals entry."""
    if config_entry.data.get(CONF_HUB):
        unsub = hass.data.get(DOMAIN, {}).pop(DATA_TODO_UNSUB, None)
        if unsub is not None:
            unsub()
    return await hass.config_entries.async_unload_platforms(
        config_entry, _platforms_for(config_entry)
    )
