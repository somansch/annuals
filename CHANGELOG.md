# Changelog

All notable changes to this integration are documented here.

## v2.3.0

### Added
- **Last name** field for non-holiday events (Adding an event, and CSV import via a new `last_name` column): keep first and last name apart, e.g. to show just the first name on a compact card and the full name elsewhere. Exposed as new `last_name` and `full_name` sensor attributes, new `{last_name}`/`{full_name}` custom-card template placeholders, new **Last name**/**Full name** row-column types, and dedicated color/font-size rows in the Colors and Fonts tabs, right next to Name. Entry titles now show the full name. Fully backward compatible - existing events and configs are unaffected until a last name is actually set.
- **Full name + Type** row-column type: the same combined, single-column layout as the existing Name + Type, just built from the full name instead. Gets its own pair of **Holiday suffix** toggles (full name / type), matching Name + Type.
- **Export events to CSV**: a new "Export events to CSV" option in the Annuals Settings hub menu generates a CSV of every manually-added/CSV-imported event (same columns as import, so it can be re-imported unchanged), offering a real download link (Ctrl/Cmd+click - a plain click is intercepted by Home Assistant's own in-app navigation) plus the CSV inline to copy as a fallback. For automated/scheduled backups, the new **`annuals.export_csv`** action does the same and can optionally write straight to a file on the HA host, returning the CSV as response data either way.
- **Per-category "Show icon" toggle** in the Icons tab: Default/Today/Soon each get their own switch (on by default) to hide just that category's icon - and any VIP/Important badge attached to it - without affecting the other two.

### Fixed
- The card editor's "Row columns" list and several other fields (color swatches, background image/opacity, font size/style) could lose keyboard focus mid-keystroke on busy Home Assistant instances, because every state update re-ran the fields' sync logic and, in several places, compared focus against `document.activeElement` - which doesn't reflect focus correctly for elements inside the editor's shadow DOM and so never matched. Typing into a Custom text column's template field (or several other fields) on a sufficiently active instance could require re-clicking into the field after nearly every character. Focus detection now correctly checks the shadow root, and the columns list only fully rebuilds its DOM when the columns actually changed structurally, instead of on every Home Assistant state update.
- Row columns using a standalone Name, Last name, Full name, Type, or Custom text column (as opposed to the combined Name + Type/Full name + Type) never absorbed the row's leftover width the way the combined columns do, so the Badge/Countdown columns after them didn't line up between rows - each row's badge/countdown started right after that row's own name, shifting left or right depending on how long the name happened to be. These columns now match the combined columns' layout behavior, so custom row-column combinations align like a table again, same as the built-in layout always has.
- New Row columns added via the "+" button got a random id suffix (e.g. `last_name-q5b9zq`) even when only one of that type existed. Only actual duplicates now get a numbered suffix (`-2`, `-3`, ...); the first of each type keeps a clean, readable id (e.g. `last_name`).

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
