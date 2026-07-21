# Changelog

All notable changes to this integration are documented here.

## v2.1.0

### Added
- **Public holiday import**: pick a country (and optionally a state/province) to import its official/public holidays as events, using the [`holidays`](https://pypi.org/project/holidays/) Python library - already a dependency of this integration, not a separate download - which covers **250+ countries and territories and 150+ languages** for holiday names. Categories (public, bank, school breaks, religious observances, etc.) are selectable per import; which ones are offered depends on what that country's holiday data provides. Multi-day categories like school breaks are imported as a single event on their first day. Re-running the wizard for the same country/subdivision updates existing entries instead of creating duplicates.
- New **"Remove imported holidays"** step (Annuals Settings hub → Configure) to remove one previously-imported batch, or all imported holidays at once - manually added events of any type are never affected.
- Custom card: holiday rows show their category in the subtitle (e.g. "Holiday (School)") with a category-specific icon, and an optional **"Holiday suffix"** toggle (Layout → Display, under Title/Subtitle) appends the country/subdivision as text (e.g. "· US (UT)").
- Custom card editor: "Event types" and "Holiday categories" are now a two-column grid of toggle switches with "Show All"/"Hide All" shortcuts. Unchecking every category (or the "Holiday" type itself, from either side) automatically disables the other and hides the categories block until holidays are shown again.
- The Layout → Display → Show/Hide section was reorganized into the same two-column layout, in three groups: which events appear at all (past/today/soon, VIP/Important filters), the card's own title, then which fields are shown per row (icon/title/subtitle/occurrence/countdown).
- All 15 supported languages (English, German, French, Dutch, Polish, Spanish, Italian, Portuguese (Brazil), Russian, Swedish, Simplified Chinese, Czech, Norwegian Bokmål, Danish, Turkish) now have complete translations for the holiday-import feature, in both the integration's config/options flow and the card's own editor.

## v2.0.1

### Added
- **`annuals.import_csv` action** - import events from CSV via automation/script instead of only through the UI, useful for keeping events in sync with a centrally maintained CSV file on a schedule. Accepts either inline `content` or a `file_path` on the HA host.

### Fixed
- Re-importing a CSV (via the UI or the new action) no longer creates duplicate events. Rows are now matched against existing entries by type + day/month + name; a match updates that event in place instead of adding a second one.
- Sensor "days until" counts now refresh immediately after local midnight instead of potentially showing yesterday's count for up to an hour, waiting for the next scheduled poll.

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
