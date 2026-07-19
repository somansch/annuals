from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import CONF_HUB, DOMAIN
from .helpers import hub_title

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


def _platforms_for(config_entry: ConfigEntry) -> list[Platform]:
    return HUB_PLATFORMS if config_entry.data.get(CONF_HUB) else EVENT_PLATFORMS


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the bundled Lovelace card once at startup."""
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
