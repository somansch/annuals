# Changelog

All notable changes to this integration are documented here.

## v2.6.1

### Added
- **Timeline header options** (Layout → Timeline → Header): **Max events per day** caps how many header lines a single day of tied events contributes - anything beyond the cap still gets its own dot on the axis, just without a header line. **Always show N upcoming** always shows at least that many header lines in total, pulling in further days beyond the very next one if needed. Both optional; leave either empty for the original, uncapped single-day behavior.
- **Quick start** section added near the top of the README, summarizing the fastest path from install to first dashboard card.

### Fixed
- **README images not rendering in HACS**: every `<img>` used a repo-relative path (e.g. `docs/...png`), which GitHub's own viewer resolves but HACS's own README renderer does not. Switched to absolute `raw.githubusercontent.com` URLs.

## v2.6.0

### Added
- **One-time event type**: a new event type for something that happens once on a known date and never recurs, e.g. a booked family vacation, with a countdown shown the same way as every other event. Unlike every other type, its Year is required (not optional), and it has no occurrence number or Annual Settings milestone. Once its date has passed, it's automatically removed the following midnight - no manual cleanup needed.
- **Embed external calendars**: pick any number of existing Home Assistant `calendar.*` entities (Settings → Events → External calendars) to show their own events alongside Annuals' own, landing on their real date rather than any "next occurrence" math, and sorted by time of day within a day they share with other events (an Annuals event, having no time of day, always sorts as if it were all-day). Entirely independent of the Event types/Categories/VIP/Important filters, which don't apply to a calendar event. New **Time**, **Location**, and **Description** row columns (List layout) and **Show time**/**Show location**/**Show description** toggles (Timeline layout, same trailing-parenthetical mechanism as the existing Show date) surface those fields only for a calendar event that has them - empty/hidden for every Annuals event. A calendar event's icon comes from its source calendar (or a default calendar icon), and its "type" text is the source calendar's own name unless turned off (see **Calendar name** below).
  - Row columns that support the Holiday-suffix toggle (Name/Full name/Type, and the combined Name + Type/Full name + Type) now group their toggles under two headings, **Holidays only** and **External calendars only**, each toggle with its own "i" tooltip. The Type field's group gets a new **Calendar name** toggle (on by default) alongside Time/Location/Description, for hiding the source calendar's own name once those three already say enough on their own.
  - A calendar event's Timeline dot/icon color follows that specific calendar's own **Calendar color** (set in its entity settings).

### Fixed
- **"Remove events → Holidays" crashed** once more than one country/subdivision combination had been imported and at least one of them had no subdivision (e.g. both "United States" and "United States (Utah)") - grouping them for the removal picker sorted on a mix of text and "no subdivision", which Python can't compare. Fixed.

## v2.5.0

### Added
- **Import events from an ICS calendar**: a new "Import events from ICS calendar" option in the Annuals Settings hub menu, for bringing in an exported "Birthdays" calendar. Only all-day entries are read; timed events, and recurrence-override instances, are skipped automatically. A three-step wizard: upload the file, optionally swap first/last name for every entry at once and pick the event type to import as, then review every entry (paginated for large contact lists) with its proposed first/last name split *and* the birthday itself pre-filled and editable, plus a checkbox to leave any entry out. A **"Go back"** field at the top of the review step returns to the previous page, or to the settings step from the first page, without losing edits already made. Field labels on the review page are English-only by construction.
- **"Use description year" ICS import setting**: a new toggle in the ICS import wizard's settings step. Many exported "Birthdays" calendars set every event to a fixed placeholder start-date year, while the real birth year - if known - is buried as free text in the event's description (e.g. "geb. 1985"). Enabling this searches each entry's description for a plausible year and uses it in place of the start date's year wherever one is found, leaving entries with no year in their description unchanged. ICS-only, since vCard's structured BDAY field never needs this.
- **Duplicate detection during ICS review**: an entry whose day/month and name overlap with an existing event of the same type is flagged right in the review step, naming the existing entry - leave "create as new entry" unchecked (the default) to update that existing entry with the imported data instead of adding a second one, or check it to bring both in side by side. Re-running an import later for exactly-matching entries (by type + day/month + name) still updates them in place either way, same as CSV import.
- **Remove ICS-imported events**: a new hub menu option that removes only the events an ICS import actually *created* (not ones it merely updated, nor manually added or CSV-imported events) - mirrors the existing "Remove imported holidays" mechanism.
- **Import events from a vCard (.vcf) file**: a new "Import events from vCard" option, for bringing in an exported contact card. Same three-step wizard, duplicate detection, and removal mechanism as ICS import. Only contacts with a birthday set are read.
- **Import other dates (anniversaries, ...) from vCard (.vcf) file**: "Import events from vCard" now opens a choice between importing birthdays (unchanged) or every *other* date on a contact - the standard vCard ANNIVERSARY field, plus contacts apps' custom-labelled dates (item.X-ABDATE/X-ABLABEL, e.g. "Anniversary", "Other", or a label typed in by hand). Since these entries aren't all the same kind of event, each one gets its own event type selector in the review step instead of one type for the whole batch - defaulting to Wedding anniversary for anything labelled "Anniversary" and Custom otherwise, with the detected label shown alongside each entry for context. Uses the same duplicate detection, "Go back", and removal mechanism as the birthday branch.
- **Remove vCard-imported events**: a new hub menu option that removes only the events a vCard import actually *created* (birthday or other-dates branch alike), leaving manually added, CSV-imported, or ICS-imported events untouched - mirrors "Remove ICS-imported events"/"Remove imported holidays".
- **"Date" row column**: a new selectable column (Layout → Display → Row columns) showing the next occurrence in short calendar form without a year, e.g. "3 Aug" (localized to your profile language) - or "Today" once it's actually today, same as the Countdown column. Also available as a `{date}` placeholder in Custom text columns.
- **Timeline "Show date" option**: a new toggle next to "Show holiday suffix" (Layout → Timeline → Options) that appends the short calendar date in parentheses at the end of the header/tooltip/expandable-list sentence, e.g. "...is in 3 days (6 Aug)" - left off on the event's own day, since the sentence there already ends "...is today".

### Changed
- **Consolidated hub menu**: the four separate "Import events from CSV/ICS calendar/vCard" and "Import holidays" entries are now a single **"Import events"** entry with a source picker (CSV / ICS calendar / vCard / Holidays) - vCard's own birthday-vs-other-dates choice still follows after picking "vCard". Likewise, "Remove ICS-imported events", "Remove vCard-imported events", and "Remove imported holidays" are now one **"Remove events"** entry with the same three choices. Keeps the hub menu from growing a new top-level entry every time an import source is added; every wizard behind these entries is unchanged.

### Fixed
- **Clearing an event's Last name didn't stick**: reopening "Edit event" right after emptying the Last name field and submitting showed the old last name again, as if nothing had happened - the field had a schema-level `default=` that silently refilled it with the previously stored value once the (now-empty) field was omitted from the submitted form, the same class of bug the Year field was already written to avoid. Removed the default in favor of a suggested-value hint, same fix applied to the equivalent per-row last-name field in the ICS/vCard import review step.

## v2.4.1

### Fixed
- The card re-rendered on **every** Home Assistant state update anywhere in the system - not just its own entities - since `hass` is handed to every card as a new object on every single change (a light turning on, an unrelated sensor tick, ...). On a busy production instance this could happen many times a second, and each render fully recreated the row/timeline DOM, which silently discarded whatever a person was mid-interaction with: a Timeline dot's tooltip closing itself shortly after opening, icon animations restarting from frame zero at random, and a List row's hover highlight flickering while the mouse sat still over it. The card now only re-renders when one of its own entities actually changed (or the language did) - config changes made through the editor still apply immediately as before.

### Added
- **Update notification**: since an already-open browser tab keeps the previously loaded card cached until it's reloaded, restarting Home Assistant after an update to the bundled card now shows a one-time persistent notification ("Annuals card updated") reminding you to refresh, instead of leaving you to guess whether a refresh is needed after every restart.
- **Holiday suffix toggle for the standalone "Full name" row column**: previously only available on the combined "Full name + Type" column - useful for Compact mode or a List layout without a Type row, where you still want the country/subdivision suffix appended.

## v2.4.0

### Added
- **Timeline layout style**: a new alternative to the classic row list, switchable per-card via **Layout style** (Layout → Display). Shows a compact horizontal axis with one dot per visible event - sized and positioned by how close it is to today - a header sentence for the soonest/most recent day, and a "Details" toggle that expands the full chronological list. Handy for a narrow Sections-view column where the full row list doesn't fit. Comes with its own **Timeline** tab in Layout:
  - **Timeline line** / **Divider line**: the axis's width, style (solid/dashed/dotted), and color, and the same for the vertical line marking the boundary between past and future events.
  - **Options**: **Show full name** (each event's full name everywhere the layout shows a name - header, dot tooltip, expandable list) and **Show holiday suffix** (appends the imported country/subdivision after a holiday's name, e.g. "Pioneer Day (US-UT)"), side by side.
  - A configurable **"More" button** next to "Details" (its own action-config field, hidden while left on "Nothing") - typically pointed at a dashboard using the full List layout.
  - Dedicated Colors/Fonts rows for Header, Tooltip, List (Details), and Details/More button text, plus its own independent VIP/Important badge colors (a star/exclamation glyph on the dot itself, rather than a corner badge).
- **Event type colors**: a new **Event types** section in the Colors tab (Timeline layout only) lists every event type - Birthdays, Anniversaries, Name days, Wedding anniversaries, Memorials, Pet birthdays, Work anniversaries, Custom, Holidays - each with its own color, driving that type's dot and icon color on the axis, header, and list in place of the built-in default palette.

### Changed
- **Renamed the card's `title`/`subtitle` row fields to `name`/`type`** so `title` refers exclusively to the card's own heading from now on, never the event's name. Every place this appeared - `colors`, `font_sizes`, `font_style`, the `show_subtitle`/`show_subtitle_country` toggles, the Row Columns `subtitle` column type, the corresponding CSS custom properties (`--annuals-title-color` → `--annuals-name-color`, `--annuals-subtitle-color` → `--annuals-type-color`, `--annuals-row-title-*` → `--annuals-row-name-*`, `--annuals-row-subtitle-*` → `--annuals-row-type-*`), and the Colors/Fonts tab labels ("Title"/"Subtitle" → "Name"/"Type") - is renamed accordingly. Existing dashboards keep working unchanged: the old key names are still read correctly, and are quietly rewritten to the new ones the next time the card's editor saves any change at all. No action needed unless you theme this card directly via CSS variables, in which case update to the new variable names above.
- **Row Columns default arrangement** changed from Icon/Name + Type/Occurrence/Countdown to **Icon/Full name + Type/Occurrence/Countdown** - only affects a card that has never touched the "Row columns" editor; existing customized arrangements are unaffected.
- **Compact mode** (the "Compact (no gaps, centered)" toggle in Row columns) now actively manages the column arrangement instead of just restyling whatever was already there: switching it on immediately swaps to **Icon, Full name, Occurrence, Type, Countdown**, with a plain space column automatically inserted before each of the last four so fields don't run together with the gap removed - still fully editable afterward. Switching it back off resets the columns to the standard default above.

### Fixed
- Full names weren't showing in the actual rendered List/Timeline cards for dashboards created after the new Row Columns default above, because that default only seeded the editor's displayed column list and never actually drove row rendering - rows silently fell back to a separate, hardcoded name-only template. Row rendering now always follows the same column list the editor shows, whether or not `columns` has been customized.

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
