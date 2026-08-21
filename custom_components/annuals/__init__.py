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
from .helpers import async_event_type_labels, async_reminder_strings, full_name, hub_title
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

    # A few seconds of slack after midnight, not exactly on it, so this
    # doesn't race the moment the date actually rolls over. functools.partial
    # (not a lambda) so HA's event helper still recognises this as a
    # coroutine function and awaits it, instead of firing-and-forgetting it.
    async_track_time_change(
        hass, functools.partial(_async_midnight_tasks, hass), hour=0, minute=0, second=5
    )

    frontend_path = Path(__file__).parent / "frontend" / "annuals-card.js"
    version = int(frontend_path.stat().st_mtime)
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_JS_URL, str(frontend_path), False)]
    )
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
    frontend.add_extra_js_url(hass, f"{FRONTEND_JS_URL}?v={version}")

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

    async_register_services(hass)
    hass.http.register_view(AnnualsExportCsvView())
    hass.http.register_view(AnnualsExportTranslationsView())
    return True


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
