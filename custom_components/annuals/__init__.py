from __future__ import annotations

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
from homeassistant.helpers.typing import ConfigType

from .const import CONF_HUB, DATA_SENSORS, DOMAIN
from .helpers import hub_title
from .http import AnnualsExportCsvView
from .services import async_register_services

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


async def _async_refresh_all_sensors(hass: HomeAssistant, _now) -> None:
    """Force every AnnualEventSensor to recompute "days until" right after
    local midnight, instead of leaving yesterday's count showing until each
    sensor's next hourly poll happens to land (up to nearly an hour late).
    """
    sensors = list(hass.data.get(DOMAIN, {}).get(DATA_SENSORS, ()))
    _LOGGER.debug("Annuals: midnight refresh of %d sensor(s)", len(sensors))
    for sensor in sensors:
        sensor.async_schedule_update_ha_state(force_refresh=True)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the bundled Lovelace card once at startup."""
    hass.data.setdefault(DOMAIN, {})

    # A few seconds of slack after midnight, not exactly on it, so this
    # doesn't race the moment the date actually rolls over. functools.partial
    # (not a lambda) so HA's event helper still recognises this as a
    # coroutine function and awaits it, instead of firing-and-forgetting it.
    async_track_time_change(
        hass, functools.partial(_async_refresh_all_sensors, hass), hour=0, minute=0, second=5
    )

    frontend_path = Path(__file__).parent / "frontend" / "annuals-card.js"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_JS_URL, str(frontend_path), False)]
    )
    # cache_headers=False above only omits an explicit Cache-Control header -
    # browsers still apply heuristic caching from Last-Modified/ETag, so a
    # stale copy can survive a reload after the card is updated. Busting the
    # URL with the file's own mtime forces a fresh fetch whenever it changes
    # (i.e. on every restart after an update).
    version = int(frontend_path.stat().st_mtime)
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
    return True


async def async_setup_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Set up one Annuals entry (an event, or the shared hub)."""
    hass.data.setdefault(DOMAIN, {})

    if config_entry.data.get(CONF_HUB):
        # Migrates hub entries created before the "Annuals Settings" title
        # (they were titled plain "Annuals") to the current, translated title.
        new_title = hub_title(hass)
        if config_entry.title != new_title:
            hass.config_entries.async_update_entry(config_entry, title=new_title)

    await hass.config_entries.async_forward_entry_setups(
        config_entry, _platforms_for(config_entry)
    )

    if not config_entry.data.get(CONF_HUB):
        _async_ensure_hub(hass)

    return True


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
    return await hass.config_entries.async_unload_platforms(
        config_entry, _platforms_for(config_entry)
    )
