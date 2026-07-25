from __future__ import annotations

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .helpers import export_csv_text

# The browser-download counterpart to the "Export events to CSV" options-flow
# step and the annuals.export_csv service - both of those only hand back the
# CSV as text/response data, with no way to trigger an actual "Save As" from
# a flow's form-based UI. The options flow instead links here via a
# short-lived signed URL (see async_step_export_csv in config_flow.py),
# since a flow's description text carries no session of its own for
# requires_auth to check against.
EXPORT_CSV_URL = "/api/annuals/export_csv"


class AnnualsExportCsvView(HomeAssistantView):
    url = EXPORT_CSV_URL
    name = "api:annuals:export_csv"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        csv_text, _count = export_csv_text(hass)
        return web.Response(
            body=csv_text.encode("utf-8"),
            content_type="text/csv",
            charset="utf-8",
            headers={"Content-Disposition": 'attachment; filename="annuals_export.csv"'},
        )
