from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.config_entries import SOURCE_IMPORT
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .config_flow import _parse_csv_rows
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

SERVICE_IMPORT_CSV = "import_csv"

# "content" and "file_path" are mutually exclusive but one of them is
# required - the same CSV format/columns as the UI's "Import events from
# CSV" step (see config_flow._parse_csv_rows).
IMPORT_CSV_SCHEMA = vol.Schema(
    vol.All(
        {
            vol.Exclusive("content", "source"): str,
            vol.Exclusive("file_path", "source"): str,
        },
        cv.has_at_least_one_key("content", "file_path"),
    )
)


def _read_and_parse(hass: HomeAssistant, call: ServiceCall) -> tuple[list[dict], list[str]]:
    """Read the CSV (blocking file I/O for file_path) and parse it - run in an executor."""
    content = call.data.get("content")
    if content is not None:
        return _parse_csv_rows(content)

    file_path = call.data["file_path"]
    if not hass.config.is_allowed_path(file_path):
        raise HomeAssistantError(
            f"'{file_path}' is not in an allowed directory - add its parent "
            "under homeassistant: allowlist_external_dirs in configuration.yaml."
        )
    try:
        with open(file_path, encoding="utf-8-sig") as handle:
            text = handle.read()
    except OSError as err:
        raise HomeAssistantError(f"Could not read '{file_path}': {err}") from err
    return _parse_csv_rows(text)


async def _async_handle_import_csv(hass: HomeAssistant, call: ServiceCall) -> None:
    rows, row_errors = await hass.async_add_executor_job(_read_and_parse, hass, call)

    for message in row_errors:
        _LOGGER.warning("Annuals CSV import (service): %s", message)

    if not rows:
        raise HomeAssistantError(
            "No valid rows found in the given CSV - check the log for skipped-row details."
        )

    # Same path as the UI's CSV import (AnnualsOptionsFlow.async_step_import_csv):
    # each row goes through AnnualsConfigFlow.async_step_import, which
    # dedupes against already-imported events by unique_id instead of
    # creating a duplicate - see config_flow._import_unique_id. Awaited
    # sequentially, not fired off via async_create_task - otherwise that
    # dedup check could race a still-in-flight sibling row (or a second call
    # to this same action) and create a genuine duplicate instead.
    for row in rows:
        await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": SOURCE_IMPORT}, data=row
        )

    _LOGGER.info(
        "Annuals CSV import (service): %d event(s) queued, %d row(s) skipped",
        len(rows),
        len(row_errors),
    )


@callback
def async_register_services(hass: HomeAssistant) -> None:
    """Register Annuals' services once at integration startup."""
    if hass.services.has_service(DOMAIN, SERVICE_IMPORT_CSV):
        return

    async def _handle(call: ServiceCall) -> None:
        await _async_handle_import_csv(hass, call)

    hass.services.async_register(
        DOMAIN, SERVICE_IMPORT_CSV, _handle, schema=IMPORT_CSV_SCHEMA
    )
