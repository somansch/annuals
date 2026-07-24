# Changelog

All notable changes to this integration are documented here.

## v2.2.0

### Added
- **Row columns**: the custom card's row layout is now fully configurable. Add, remove, and reorder columns (Icon, Name, Type, Name + Type, Occurrence, Countdown, or free-form Custom text), and build rows that read like a sentence, e.g. "🎉 Anna turns 30 today! 🎉". Custom text columns support `{name}`, `{type}`, `{occurrence}`, `{when}`, and `{country}` placeholders, and get their own color and font-size controls.
- **Compact mode** (`columns_compact`): removes the spacing between columns, centers the row, and equalizes weight/opacity across fields - useful when the columns form one continuous sentence rather than a table row.
- **Icon animations**: each of the three icon colors (Default, Today, Soon) can now have a looping animation (Pulse, Bounce, Shake, Spin, Flash) applied, configured in a new **Icons** tab in Layout (between Colors and Card background).
- **"Today only"** and **"Only next event day"** filters, for building small at-a-glance cards (e.g. duplicate the card, filter to today only, and give it a single custom-text column).
- **Configurable tap/hold actions**: clicking or tapping a row used to always open its more-info dialog - this is now just the default. Settings → General has new **Tap** and **Hold** action fields using Home Assistant's own action picker (More info, Navigate, URL, Perform action, Toggle, Assist, or Nothing), each configurable independently.

### Changed
- The Layout → Display editor's Show/Hide section was reorganized: the card-title Hide toggle and the Today-only/Next-event-day-only filters moved out of Colors/Fonts to sit alongside the new Row columns editor; per-column styling for custom text columns now lives in the Fonts and Colors tabs next to the other field styles.
- Renamed the "Title"/"Subtitle" color and font labels to "Name"/"Type" for clarity.

### Fixed
- **Public holiday import**: importing more than one category that both define the same holiday (e.g. many US states list their statutory holidays under both "government" and "public", sometimes under slightly different names such as "Washington's Birthday" vs. "Washington and Lincoln Day") no longer creates a duplicate event for the same day. Holidays are now deduplicated by date across every selected category, with "public" always taking precedence when a date qualifies under more than one.
- On rare occasions - most likely right after a restart - the bundled custom card could fail to load ("Custom element doesn't exist: annuals-card") because this integration's own setup could run before the frontend integration had finished initializing, in which case it crashed and aborted for that session. `frontend` is now declared as an explicit dependency in the manifest, so Home Assistant always sets it up first.

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
