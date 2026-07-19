# Changelog

All notable changes to this integration are documented here.

## v2.0.0

### Added
- **Custom Lovelace card** (`custom:annuals-card`), bundled with the integration - no separate HACS frontend package needed. Configurable entirely through a visual editor (Config / Visibility / Layout tabs): event type filter, time window (days ahead/past, "soon" threshold), per-field show/hide, VIP/Important-only filters, per-field colors and fonts, past/today/soon row highlight tinting, VIP/Important badges with a choice of icon and color, and an optional card background color or image.
- **VIP annual**: an optional per-event flag (settable in the event form or via CSV import) to permanently mark one event as VIP, independent of type or occurrence number. Exposed as the `vip` sensor attribute and as a dedicated filter/badge in the custom card.
- **Important annual**: automatic milestone detection based on an event's upcoming occurrence number (e.g. an 18th, 30th, or 50th birthday). Configurable per event type under the new **Annual Settings** step (Annuals Settings hub entry → Configure), pre-filled with sensible cultural defaults. Exposed as the `important` sensor attribute and as a dedicated filter/badge in the custom card.
- Full theming support for the custom card via `--annuals-*` CSS custom properties, each falling back to Home Assistant's own theme variables - see the README for the full list.
- Card editor UI (not just entity/config-flow text) now available in all 15 previously-supported languages, following the viewing user's own profile language.

### Changed
- CSV import now accepts an optional `vip` column (`1`/`true`/`yes`/`y`/`x`, case-insensitive).

## v1.0.0

Initial release
