"""The card in the dashboards' own resource list.

A second way in, and not an alternative to the first one.

The extra module URL (see _async_register_frontend in __init__.py) reaches every
page Home Assistant serves *after* this integration was set up. A dashboard
opened in the seconds while Home Assistant is still starting is served without
it - and that page then shows "Configuration error" where the card belongs until
it is reloaded. It is the one failure the card loader cannot heal, because the
loader is what never arrived.

A Lovelace resource is read by the frontend after it has connected, out of the
dashboards' own store, so it does not depend on this integration having finished
setting up by the time the page was served.

The URL registered here is character for character the one handed to
add_extra_js_url. A browser keys its module map on the resolved URL, so the two
ways in are one request and one execution - not a second copy of the card. The
card guards its own customElements.define regardless, because the two can
resolve differently: the resource URL is resolved against the address the
browser's token was issued for, which is not always the one the page came from.

Only the storage-mode list is written to. In YAML mode the resources are a block
in the user's own configuration.yaml, which is theirs to keep, and such an
installation is left with the extra module URL exactly as before.
"""

from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

# The dashboards' own domain - which is both the name to wait for being set up
# and the key it keeps its data under. A plain string rather than an import:
# lovelace's const module is not something a custom integration should reach
# into.
LOVELACE_DOMAIN = "lovelace"

RESOURCE_TYPE_MODULE = "module"


def _collection(hass: HomeAssistant):
    """The resource collection, if there is one that can be written to."""
    data = hass.data.get(LOVELACE_DOMAIN)
    # 2024.8 and later keep a LovelaceData dataclass here; before that it was
    # a plain dict under the same key.
    resources = getattr(data, "resources", None)
    if resources is None and isinstance(data, dict):
        resources = data.get("resources")
    # A YAML-mode collection has no create/update at all, which is also how
    # this tells the two apart without reading anybody's configuration.
    if resources is None or not hasattr(resources, "async_create_item"):
        return None
    return resources


def _ours(resources, paths) -> list[dict]:
    """Every entry in the list that points at one of the files we serve.

    The files by name rather than everything under the mount: what else somebody
    keeps there is theirs, and deleting it on every start because it shares a
    path would be a trap for a later release that serves a second module.
    """
    return [
        item
        for item in resources.async_items() or []
        if str(item.get("url", "")).split("?", 1)[0] in paths
    ]


async def async_register(hass: HomeAssistant, url: str, paths) -> None:
    """Leave the list with exactly one entry of ours, pointing at `url`."""
    resources = _collection(hass)
    if resources is None:
        return

    try:
        # Reading the store hangs off async_get_info, not off async_items - ask
        # for the items first and an installation nobody has looked at yet reads
        # as empty. Not a cosmetic ordering: before Home Assistant 2026.5 a
        # create on an unloaded collection wrote our one entry over everything
        # else in the user's list. Every version since 2024.7 loads the store
        # from this call, so it is also what keeps this safe on an older one.
        await resources.async_get_info()

        ours = _ours(resources, paths)
        if not ours:
            await resources.async_create_item(
                {"res_type": RESOURCE_TYPE_MODULE, "url": url}
            )
            _LOGGER.debug("Added the dashboard card to the resources: %s", url)
            return

        # One entry survives, and it points at what is actually served: a new
        # version changes the "?v=" in the URL, and an entry somebody added by
        # hand years ago points at a file that may not even be there.
        keep, *spares = ours
        # The type matters as much as the URL: an entry added by hand as a
        # plain script ("js") loads an ES module as one, which fails on its
        # first import and defines nothing - so both are sent whenever either
        # is not what we serve.
        if keep.get("url") != url or keep.get("type") != RESOURCE_TYPE_MODULE:
            await resources.async_update_item(
                keep["id"], {"res_type": RESOURCE_TYPE_MODULE, "url": url}
            )
            _LOGGER.debug("Pointed the card's resource entry at %s", url)
        for spare in spares:
            await resources.async_delete_item(spare["id"])
    except Exception:  # noqa: BLE001
        # This is the belt to the extra module URL's braces. The card loads
        # without it, so nothing here is worth a failed setup.
        _LOGGER.warning(
            "Could not list the dashboard card under the dashboard resources. "
            "The card is still loaded the usual way",
            exc_info=True,
        )


async def async_unregister(hass: HomeAssistant, paths) -> None:
    """Take our entries back out, for when nothing is left to load."""
    resources = _collection(hass)
    if resources is None:
        return

    try:
        await resources.async_get_info()
        for item in _ours(resources, paths):
            try:
                await resources.async_delete_item(item["id"])
            except Exception:  # noqa: BLE001
                # Two entries going at once both end up here, and the second
                # one finds the work already done. Not worth a word.
                _LOGGER.debug("The card's resource entry was already gone")
            else:
                _LOGGER.debug("Removed the card's resource entry: %s", item.get("url"))
    except Exception:  # noqa: BLE001
        _LOGGER.warning(
            "Could not remove the dashboard card from the dashboard resources. "
            "The entry now points at a file that is no longer served, which every "
            "dashboard will report in the browser console until it is deleted "
            "under Settings > Dashboards > Resources",
            exc_info=True,
        )
