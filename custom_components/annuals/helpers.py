"""Shared helpers for translated event-type labels.

The event-type labels live once in translations/<lang>.json (as the
selector's option labels) and are read back at runtime for everything
shown outside the config form itself - config entry titles and calendar
event summaries - so adding a language never means maintaining a second,
code-side label table. Both render in the server's configured language:
they are stored/global strings, not per-viewing-user UI.
"""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import translation

from .const import DOMAIN, EVENT_TYPES


async def async_event_type_labels(hass: HomeAssistant) -> dict[str, str]:
    """Map each event type to its label in the server's language."""
    translations = await translation.async_get_translations(
        hass, hass.config.language, "selector", {DOMAIN}
    )
    return {
        event_type: translations.get(
            f"component.{DOMAIN}.selector.event_type.options.{event_type}",
            event_type.replace("_", " ").title(),
        )
        for event_type in EVENT_TYPES
    }


# The hub entry's title ("Annuals Settings") deliberately keeps "Annuals"
# untranslated (it's the product name) with only the second word localized.
# That single word isn't a config-flow-rendered string, so it lives here as a
# small code-side table instead of in translations/<lang>.json - there's no
# HA translation category for a plain config-entry title.
_HUB_TITLE_WORD = {
    "de": "Einstellungen",
    "fr": "Paramètres",
    "nl": "Instellingen",
    "pl": "Ustawienia",
    "es": "Ajustes",
    "it": "Impostazioni",
    "pt-BR": "Configurações",
    "ru": "Настройки",
    "sv": "Inställningar",
    "zh-Hans": "设置",
    "cs": "Nastavení",
    "nb": "Innstillinger",
    "da": "Indstillinger",
    "tr": "Ayarları",
}


def hub_title(hass: HomeAssistant) -> str:
    """The Annuals hub entry's title, e.g. "Annuals Settings" / "Annuals Einstellungen"."""
    return f"Annuals {_HUB_TITLE_WORD.get(hass.config.language, 'Settings')}"
