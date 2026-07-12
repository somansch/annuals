from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import CONF_HUB, DOMAIN
from .helpers import hub_title

_LOGGER = logging.getLogger(__name__)

# Per-event entries own one sensor each; the single auto-created hub entry
# owns the shared cross-event entities (the per-type calendars, plus any
# future global entities).
EVENT_PLATFORMS: list[Platform] = [Platform.SENSOR]
HUB_PLATFORMS: list[Platform] = [Platform.CALENDAR]

_HUB_FLOW_STARTED = "hub_flow_started"


def _platforms_for(config_entry: ConfigEntry) -> list[Platform]:
    return HUB_PLATFORMS if config_entry.data.get(CONF_HUB) else EVENT_PLATFORMS


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
