# <img src="https://raw.githubusercontent.com/somansch/annuals/main/custom_components/annuals/brand/icon.png" width="40" height="40" align="top"> Annuals Integration for Home Assistant - more than birthdays/holidays only

[![GitHub release](https://img.shields.io/github/v/release/somansch/annuals)](https://github.com/somansch/annuals/releases/latest)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/default)
[![License](https://img.shields.io/github/license/somansch/annuals)](https://github.com/somansch/annuals/blob/main/LICENSE)

**Available languages:** English, Deutsch, Français, Nederlands, Polski, Español, Italiano, Português (Brasil), Русский, Svenska, 简体中文, Čeština, Norsk bokmål, Dansk, Türkçe

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-summary.png" alt="List view, Timeline, Compact, to-dos and an Agenda-style list, side by side" width="45%">

## Overview

Keeping track of birthdays, holidays, anniversaries, and other yearly dates usually means either a separate app you have to remember to check, or a calendar entry that just says "Anna's birthday" without telling you it's her 30th this year. Annuals brings that into Home Assistant instead, so it can show up on your dashboard, feed your existing notification automations, and answer "how many days until X, and which one is it" without any manual bookkeeping each year.

Typical reasons to use it:
- **Never miss a birthday or anniversary again** - get a notification the morning of, or a heads-up a week before a milestone, using your existing notification setup (mobile app, Alexa, TTS, whatever you already have) or the bundled [reminder blueprint](#blueprint-upcoming-event-reminders), which sets that up for you with no YAML.
- **Know at a glance which occurrence it is** - "Anna turns 30" instead of just "Anna's birthday", computed automatically from the year you entered once.
- **Track more than birthdays** - holidays, name days, wedding anniversaries, memorials, pet birthdays, work anniversaries, or anything custom, each with its own icon and aggregate calendar.
- **Import a whole country's public holidays** in a few clicks, categorized (public, bank, school breaks, religious, ...).
- **Highlight the ones that matter most** - flag close family as **VIP** so they always stand out, and let round-number milestones (18th, 30th, 50th, ...) mark themselves as **Important** automatically, both on the bundled dashboard card and in your own automations.
- **Bring in a whole contact list at once** via CSV, ICS calendar, or vCard import, instead of adding entries one by one.
- **Count down to a single dated thing that won't recur** - a booked vacation, an appointment, a delivery date - with a **one-time event**, which cleans itself up automatically the day after it passes.
- **See what's still left to do** - point the card at your to-do lists and any event with an open item gets a pin badge on its icon, which you can click to tick the item off ([To-dos](#to-dos)).
- **See everything in one place** - embed your existing Home Assistant calendars (Google, CalDAV, Local Calendar, ...) alongside Annuals' own events in the same dashboard card, as a row list, a compact one-line sentence, or a horizontal timeline.

Annuals tracks yearly-recurring events - birthdays, holidays, anniversaries, name days, wedding anniversaries, memorials, or anything custom - and reports, for each one, how many days until its next occurrence and which occurrence number that will be (e.g. someone's 30th birthday).

**Architecture note:** each event is its own config entry, the same pattern Home Assistant uses for "helper"-style integrations (Generic Thermostat, Threshold, Derivative, ...). This means finding and editing a specific event later doesn't need a custom picker inside this integration - **Settings → Devices & Services** already has a search box, and clicking an entry's **Configure** opens that one event's form pre-filled, ready to edit.

**Questions, feedback, or just want to see what others are doing with it?** Join the discussion on the [Home Assistant Community thread](https://community.home-assistant.io/t/annuals-more-than-just-a-birthday-tracker/1017120).

## Quick start

1. **Install** via [HACS](#hacs-recommended) (or [manually](#manual)), then restart Home Assistant.
2. **Settings → Devices & Services → Add Integration → "Annuals"** - this only sets up the shared "Annuals Settings" hub, no event form yet ([First-time setup](#first-time-setup)).
3. Open the new **"Annuals"** tile and click **Add entry** to create your first event - a name, a type (e.g. Birthday), and a day/month (year optional) ([Adding an event](#adding-an-event)). Repeat for each event, bring in a whole list at once via [CSV](#importing-events-from-a-csv-file), [ICS](#importing-events-from-an-ics-calendar), or [vCard](#importing-events-from-a-vcard-vcf-file) import, or add a country's public [holidays](#importing-public-holidays).
4. Add the events to a dashboard, either way:
   - Drop the created `calendar.annuals_*` entities into the [native Calendar card](#native-calendar-card) or any other existing card that supports calendar entities.
   - Or use the [custom dashboard card](#custom-dashboard-card) for a purpose-built list/compact/timeline view, and optionally add your already-existing calendars there too ([External calendars](#external-calendars)).
5. Want to be reminded ahead of time instead of just looking it up? Import the bundled [reminder blueprint](#blueprint-upcoming-event-reminders) and create an automation from it - no YAML required.

That's the whole setup - everything below covers the individual features and options in more depth.

## Quick links

**Setting up and adding events**

- [First-time setup](#first-time-setup)
- [Adding an event](#adding-an-event)
- [Annuals Settings](#annuals-settings) (milestones, to-do lists, import, export, remove, delete all)

**Getting events in and out**

- [Importing events from a CSV file](#importing-events-from-a-csv-file)
- [Importing events from an ICS calendar](#importing-events-from-an-ics-calendar)
- [Importing events from a vCard (.vcf) file](#importing-events-from-a-vcard-vcf-file)
- [Importing public holidays](#importing-public-holidays)
  - [School holidays and other multi-day breaks](#school-holidays-and-other-multi-day-breaks)
  - [Holiday names in your language](#holiday-names-in-your-language)
- [Exporting events to CSV](#exporting-events-to-csv)

**How events behave**

- [Leap years](#leap-years)
- [Created entities](#created-entities) - every sensor attribute, for your own templates

**Automations**

- [Automation examples](#automation-examples)
  - [Blueprint: Upcoming Event Reminders](#blueprint-upcoming-event-reminders)
  - [Use in your own automations](#use-in-your-own-automations)

**Showing events on a dashboard**

- [Countdown for one-time events](#countdown-for-one-time-events) - with Home Assistant's own badges and cards
  - [Events that span several days](#events-that-span-several-days)
- [Native Calendar card](#native-calendar-card)
- [Custom dashboard card](#custom-dashboard-card)
  - [The visual editor](#the-visual-editor) - and why it only shows part of itself
  - [Date format](#date-format)
  - [Holidays from several places](#holidays-from-several-places)
  - [To-dos](#to-dos)
  - [External calendars](#external-calendars)
  - [Row columns](#row-columns) - List view
  - [Day, week and month separators](#day-week-and-month-separators) - List view
  - [Row click/tap behavior](#row-clicktap-behavior) - List view
  - [Timeline layout](#timeline-layout)
  - [Row colors](#row-colors) - Design and Highlight
  - [Icon animations](#icon-animations) - Design and Highlight
  - [Example configurations](#example-configurations)
  - [Theming with CSS variables](#theming-with-css-variables)

**Installing**

- [Installation](#installation)
- [Help and Contribution](#help-and-contribution)

## First-time setup

The first time you go to **Settings → Devices & Services → Add Integration → "Annuals"**, it sets up just the **"Annuals Settings" hub entry** and its shared calendars - no event form, nothing to fill in yet. Add your events afterwards, either one at a time or all at once ([Annuals Settings](#annuals-settings) below).

## Adding an event

**Settings → Devices & Services**, click the **"Annuals"** integration tile to open the list of existing entries, then **Add entry** - once per event. (You only go through **Add Integration** once, during first-time setup above; every event after that is added from within the "Annuals" tile.)

| Field | Description |
|---|---|
| **Name** | Whose event this is (e.g. "Anna"). Becomes the entry's title and the entity name (together with Last name, if set). |
| **Last name** | Optional, not offered for holidays. Lets you keep first and last name separate - e.g. use just the first name for a compact card, or the full name elsewhere. Exposed as the `last_name` and `full_name` (first + last, or just first if no last name is set) sensor attributes, and as `{last_name}`/`{full_name}` placeholders and dedicated column types in the [custom dashboard card](#custom-dashboard-card). |
| **Event type** | One of the nine types below - each gets a matching icon and its own aggregate calendar. |
| **Day** / **Month** | The recurring date. Deliberately separate fields instead of a date picker - a picker would make you click back month by month to reach a birth year like 1970. |
| **Year** | Optional for every type except **One-time event**, where it's required (see below). Type it directly (one keystroke instead of a picker). Leave empty when unknown - the `occurrence_number` attribute is then hidden, since it can't be computed without a starting year. |
| **Icon override** | Optional. Home Assistant's native icon picker. Leave empty to use the type's default icon. |
| **VIP annual** | Optional, off by default. Marks this one event as VIP - independent of type or occurrence number, e.g. a close family member's birthday you always want to stand out. Purely a display flag: the [custom dashboard card](#custom-dashboard-card) below can filter to VIP-only and show a distinct badge. |

| Type | Default icon |
|---|---|
| Birthday | `mdi:cake-variant` |
| Anniversary | `mdi:calendar-star` |
| Name day | `mdi:calendar-account` |
| Wedding anniversary | `mdi:ring` |
| Memorial | `mdi:candle` |
| Pet birthday | `mdi:paw` |
| Work anniversary | `mdi:briefcase` |
| Custom | `mdi:calendar-heart` |
| One-time event | `mdi:timer-sand` |

**One-time event** is different from every other type: it never recurs, so its Year is required (not optional), and there's no occurrence number or Annual Settings milestone for it. Once its date has passed, it's automatically deleted the following midnight - no manual cleanup needed. It's meant for a single dated thing you want a countdown to, e.g. a booked family vacation, that has no reason to stick around once it's over.

There's a 10th type, **Holiday**, but it isn't offered in this form - it has no single day/month/year of its own (a public holiday's date shifts by country and year), so it's only ever created via [Importing public holidays](#importing-public-holidays) below.

To edit or remove an event afterwards, find its entry under **Settings → Devices & Services → Annuals**, and use **Configure** (edit) or the "⋮" menu (delete).

To add many events at once instead of one at a time see [Annuals Settings](#annuals-settings) below.

## Annuals Settings

A handful of cross-event tools - milestone thresholds, to-do list matching, bulk import/export, and bulk removal - live in one place, separate from any single event: the **"Annuals Settings" hub entry**, created during [first-time setup](#first-time-setup). Find it under **Settings → Devices & Services → Annuals** and click **Configure**:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-settings-summary.png" alt="Annuals Settings hub menu" width="45%">

### Annual Settings (automatic milestones)

Beyond the manual **VIP annual** flag ([Adding an event](#adding-an-event) above), Annuals can automatically mark an event as **Important** based on its upcoming occurrence number - e.g. an 18th, 30th, or 50th birthday, or a 25th wedding anniversary. This is computed per event type from a list of milestone occurrence numbers, editable under **Annuals Settings → Configure → Annual Settings**.

Each event type gets its own comma-separated list of occurrence numbers (e.g. `18,21,30,40,50,60,65,70,75,80,85,90,95,100` for birthdays) that come pre-filled with sensible cultural defaults - round numbers plus the traditional "special" birthdays, 5-year steps for work anniversaries, and so on. Edit a field to change its milestones, or clear it entirely to disable "Important" detection for that type. Name day and Custom events have no cultural convention, so they default to empty (never automatically "Important") unless you set your own list.

Both `vip` and `important` are exposed as sensor attributes (see [Created entities](#created-entities) below) and both feed into the [custom dashboard card](#custom-dashboard-card)'s filters and badges - VIP is a manual, permanent flag on one event; Important is automatic and only true in the specific year a milestone is reached.

The same form ends with a **To-do lists** field, which picks the `todo.*` lists whose still-open items should mark an event. Every event sensor then carries a `todo` attribute (see [Created entities](#created-entities)) - `true` while at least one open item is matched to it, `false` otherwise - so a template, automation, or any other card can react to "this event still has something to do" without going through the Annuals card. An item is matched the same way the [dashboard card](#to-dos) matches it: by its due date first, then by whether its own text names the event (full name, name, type, occurrence number), with an item that fits two events equally well left unmatched. The attribute updates whenever one of the picked lists changes, and again after midnight when each event's next date rolls over; leave the field empty to switch it off, and `todo` is simply `false` everywhere.

This field is deliberately separate from the dashboard card's own **To-dos** option: this one is server-side and shared by everything that reads the sensor, while the card's is per-card and also hands it the items themselves, which it needs to offer ticking them off. They're usually set to the same lists, but neither requires the other.

### Import events

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-settings-import.png" alt="Import events source picker" width="45%">

Pick a source to import from - useful for bringing in a whole contact list, calendar, or country's holidays at once instead of adding events one by one:

- **[CSV](#importing-events-from-a-csv-file)** - a plain spreadsheet file, one row per event.
- **[ICS calendar](#importing-events-from-an-ics-calendar)** - an exported "Birthdays" calendar.
- **[vCard](#importing-events-from-a-vcard-vcf-file)** - an exported contact card, either birthdays or every other date on the contact (anniversaries, ...).
- **[Holidays](#importing-public-holidays)** - a whole country's (and optionally state/province's) public holidays.

### Export events to CSV

Generates a CSV of every manually-added/CSV-imported event, ready to re-import unchanged or keep as a backup - see [Exporting events to CSV](#exporting-events-to-csv) below.

### Remove events

Removes only the events a particular source actually created - **ICS-imported**, **vCard-imported**, or **Holidays** - without touching manually added events, CSV-imported events, or events from any other source. Each import section below explains its own removal option in context. Holidays can be removed by country/region in batches, several at once, or all of them at one go.

### Delete all Annuals data

Permanently removes every event entry, the shared calendars, and the hub itself - the entire integration and everything it created. Requires confirming a warning screen before anything is deleted; this cannot be undone.

## Importing events from a CSV file

Find the **"Annuals Settings" hub entry** under **Settings → Devices & Services → Annuals**, click **Configure**, and pick **"Import events" → "CSV"**. Import is useful for bringing in a whole contact list at once instead of adding events one by one.

The file needs a header row with these columns:

| Column | Required | Description |
|---|---|---|
| `name` | Yes | Whose event this is. |
| `type` | Yes | One of the internal English keys, not case-sensitive: `birthday`, `anniversary`, `name_day`, `wedding_anniversary`, `memorial`, `pet_birthday`, `work_anniversary`, `custom`, `one_time`. Always English, regardless of your language setting - translated labels aren't accepted here. |
| `day`, `month` | Yes | The recurring date. |
| `year` | No, except required for `one_time` | Leave empty if unknown - not allowed for `one_time` rows, see [Adding an event](#adding-an-event) above. |
| `icon` | No | An MDI icon name (e.g. `mdi:cake-variant`) to override the type's default. |
| `vip` | No | Accepts `1`/`true`/`yes`/`y`/`x` (case-insensitive) to mark the event VIP. Leave empty or omit the column otherwise. |
| `last_name` | No | Kept separate from `name` - see [Adding an event](#adding-an-event) above. |

Keep every column even when a value is empty - a row with a missing trailing comma shifts the following values left.

```csv
name,type,day,month,year,icon,vip,last_name
Anna,birthday,12,4,1988,,,Miller
Max,pet_birthday,3,9,2020,mdi:dog,,
Acme Corp,work_anniversary,1,7,2015,,,
Test Custom,custom,1,1,,mdi:test-tube,1,
Family Vacation,one_time,15,7,2026,mdi:airplane,,
```

Re-importing the same CSV later - e.g. a centrally maintained file synced on a schedule - does not create duplicate events. Each row is matched against existing entries by type + day/month + name (not year or last_name, so correcting a wrong birth year or filling in a previously-missing last name still matches the same person); a match updates that event's data in place instead of adding a second one. This only applies to CSV-imported events - manually added events are never touched or matched by a later import.

For scheduled or automated imports (instead of clicking through the UI each time), call the **`annuals.import_csv`** action from an automation, script, or Developer Tools → Actions. Same columns, same file-based dedup behavior as above. Provide the CSV either as inline text or as a path on the HA host:

<details>
<summary>YAML: import from a file path</summary>

```yaml
action: annuals.import_csv
data:
  file_path: /config/annuals/contacts.csv
```

</details>

<details>
<summary>YAML: import from inline content</summary>

```yaml
action: annuals.import_csv
data:
  content: |
    name,type,day,month,year,icon,vip,last_name
    Anna,birthday,12,4,1988,,,Miller
```

</details>

`file_path` must be inside a directory listed under `homeassistant: allowlist_external_dirs` in `configuration.yaml`. Combine this with a **time trigger** to keep a centrally maintained CSV in sync on a schedule, without any manual re-upload.

## Importing events from an ICS calendar

1. **Upload** the `.ics` file. Only all-day entries are read; timed (non-birthday-style) entries are skipped automatically.
2. **Settings** - three, all optional:
   - **Swap first/last name for every entry at once**, for a source calendar that lists the last name first.
   - **Use the year found in each entry's description instead of its start date.** Many exported "Birthdays" calendars set every event to a fixed placeholder year and bury the real birth year in the description as text, e.g. "born 1985". This searches there for a plausible year and uses it whenever one is found, falling back to the start date's year otherwise.
   - **Event type** to import as - Birthday by default.
3. **Review** - every entry, one page at a time for large contact lists, with its proposed first/last name split (split on the last space, e.g. "Anna Maria Miller" → first name "Anna Maria", last name "Miller") and the birthday itself, all pre-filled and editable, plus a checkbox to leave out any entry you don't want. A **"Go back"** field at the top returns to the previous page, or to the Settings step from the first page, without losing anything already entered. Field labels on this page are shown in English only regardless of your language setting.

If an entry's day/month and name overlap with an event you already have (of the same type), it's flagged as a possible duplicate right there in the review step, naming the existing entry - leave the "create as new entry" box unchecked to update that existing entry instead of adding a second one, or check it to bring both in side by side.

Like CSV import, re-running this later for the same calendar updates exactly-matching entries in place (by type + day/month + name) instead of creating duplicates - and anything the review step didn't catch can always be corrected afterward via that entry's own **Configure** button, same as any manually added event.

## Importing events from a vCard (.vcf) file

Find the **"Annuals Settings" hub entry**, click **Configure**, and pick **"Import events" → "vCard"** - this first opens a choice between two branches:

- **Import birthdays** - the wizard is identical to ICS import - upload, then settings (swap first/last name, pick the event type), then the paginated review with editable name/date, duplicate detection, the "create as new vs. update existing" choice, and the "Go back" field. Only contacts with a birthday set are read - everything else is skipped.
- **Import other dates (anniversaries, ...)** - reads every date on a contact *except* the birthday: the standard "Anniversary" field, plus any custom-labelled date your contacts app lets you add per contact (e.g. "Anniversary", "Other", or a label typed in by hand). Since these aren't all the same kind of event, there's no single event type to pick up front - the settings step only offers the name-swap toggle, and each entry in review gets its own event type selector, defaulting to Wedding anniversary for anything labelled "Anniversary" and Custom otherwise (the detected label is shown alongside each entry so a wrong guess is easy to spot and correct).

Re-running either branch later for the same contacts/dates updates exactly-matching entries in place, same as ICS/CSV import.

## Importing public holidays

Find the **"Annuals Settings" hub entry** under **Settings → Devices & Services → Annuals**, click **Configure**, and pick **"Import events" → "Holidays"**. Annuals uses the [`holidays`](https://pypi.org/project/holidays/) Python library - already a dependency of this integration, not a separate download - which covers **250+ countries and territories and 150+ languages** for holiday names, so most countries' holidays are available out of the box. The picker offers the 249 of them that Home Assistant's own country selector recognises - the United Kingdom appears as `GB` (its ISO code) rather than the library's `UK` alias, and Kosovo is unavailable because it has no official two-letter code at all.

The wizard is two steps:

1. **Country** - pick from the full list the `holidays` library supports.
2. **What to import for that country** - five choices:
   - **Which date**: each holiday's **actual date**, its practically-**observed date**, or both as separate events. Actual only, by default. Many countries shift a holiday that falls on a weekend to a nearby weekday - a Saturday US federal holiday is observed the preceding Friday.
   - **Which parts of a multi-day break**, for countries that have them - see [School holidays](#school-holidays-and-other-multi-day-breaks) below.
   - **States/provinces**: leave empty for national holidays only; picking some adds those regions' own holidays on top.
   - **Categories** such as `public`, `bank`, `school` or `catholic`. Which ones are offered depends entirely on what that country's holiday data provides - see the table below.
   - **Language** for the holiday names, also country-dependent.

A holiday the whole country observes is stored **once**, without a region, no matter how many of that country's regions you import; only holidays a region has to itself are kept per region. So importing California and Utah gives you one Thanksgiving, plus Cesar Chavez Day for California and Pioneer Day for Utah.

| Category | Meaning |
|---|---|
| Public | Statutory/legal national holidays |
| Bank | Bank holidays specifically |
| Government | Government/administrative offices closed |
| School | School holidays/breaks (multi-day, e.g. summer break - see [School holidays](#school-holidays-and-other-multi-day-breaks)) |
| Optional | Optional/discretionary holidays |
| Unofficial | Observed but not legally mandated |
| De facto | Practically observed nationwide, without formal legal status (e.g. Switzerland, Sweden) |
| Half day | Half-day holiday |
| Armed forces | Military-specific observances |
| Workday | A working day despite falling near a holiday (make-up day) |
| Catholic / Christian / Protestant / Orthodox / Hebrew / Islamic / Hindu / Sabian / Yazidi | Religious observances |
| Albanian / Armenian / Bosnian / Roma / Serbian / Turkish / Vlach | Ethnic/minority community observances (mostly North Macedonia's multi-ethnic calendar) |

Which categories are offered for a given country depends entirely on what that country's `holidays` library data provides - most only ever expose Public (and maybe Bank/School); the ethnic and minority-specific ones above are rare, country-specific exceptions.

Re-running the wizard later for the same country (and subdivision) updates the existing imported events instead of creating duplicates - safe to repeat if a country adds or removes a holiday. The result says which is which, e.g. `16 holiday event(s) queued for US (7 new, 9 updated)`.

### School holidays and other multi-day breaks

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-holiday-school-and-vacation.png" alt="A card listing the start and end of two German states' school holidays, plus the start and end of a multi-day holiday trip" width="55%">

Most holidays are a single day. School holidays are not, and the import treats them as the breaks they are. Three checkboxes decide what you get, in any combination:

| Option | Creates | Default |
|---|---|---|
| **Import the first day of a break** | `Summer Break (start)` | On |
| **Import the last day of a break** | `Summer Break (end)` | Off |
| **Import every day of a break** | `Summer Break (day 1)` … `(day 45)`, one event each | Off |

Those suffixes are translated into Home Assistant's own language - a German server writes `(Beginn)`, `(Ende)`, `(Tag 3)`. The wording is fixed when the entry is created, so switching the server language later doesn't rename events you already have.

The options only appear for countries whose holiday data actually contains such breaks - in practice the handful with a **School** category. Everything else imports exactly as before.

**The first and last day are computed, not taken from the data.** A school calendar lists school days only: Bavaria's 2026 autumn break is listed as Mon Nov 2 to Fri Nov 6. But school breaks up on the Friday before and resumes on the Monday after, so the break really runs Sat Oct 31 to Sun Nov 8 - and that is what gets imported. The first day is found by counting backwards over the weekend and any adjacent public holidays, the last day by counting forwards the same way. The weekend comes from the country itself rather than being assumed to be Saturday and Sunday, so Israel's Friday/Saturday weekend produces the right dates too. A public holiday next to a break is pulled in as well: a Berlin break listed as the single Friday after Ascension Day is imported as Thu to Sun, because the Thursday is Ascension Day.

**One name can cover several breaks.** Bavaria files both its February break and its Easter break as `Oster-/Frühjahrsferien`; every German state files the end of one Christmas break and the start of the next as `Weihnachtsferien`. Breaks are therefore found as runs of consecutive days rather than by name, and a break running across New Year stays a single break rather than being split at January 1st. A public holiday *inside* a break doesn't split it either, even though it isn't a school day and so isn't listed - Baden-Württemberg's Easter break has Good Friday, a weekend and Easter Monday in the middle of it. Only an ordinary working day in between makes it two breaks.

**Joined names are taken apart.** Where two breaks share one composite name, each break gets its own: `Oster-/Frühjahrsferien` becomes `Osterferien` and `Frühjahrsferien`, and in English `Easter/Spring Break` becomes `Easter Break` and `Spring Break`. Which half goes with which break is decided by the public holidays the break actually contains, never by the order the halves are written in - Bavaria writes Easter first, but its *later* break is the Easter one and its February break is the spring one. A break containing no public holiday at all gets the half that has no holiday anchoring it anywhere; that is how Bavaria's February break and Hamburg's March break both come out as `Frühjahrsferien`. Where a language builds the composite the other way round - Ukrainian and Thai put the shared word first and slash the tail - the name is left whole rather than split wrongly. Breaks that can't be told apart this way keep the joined name, numbered `(2)`, `(3)`.

The screenshot above is one card showing all of this at once - Bavaria's and Baden-Württemberg's school holidays imported with **first day** and **last day** ticked, plus a multi-day holiday trip ([Events that span several days](#events-that-span-several-days)) and, at *Vacation*, an ordinary single-day one-time event that carries no suffix because there is nothing to distinguish. Two details are worth pointing out:

- **The two states differ where they actually differ.** Their autumn breaks start a week apart (Oct 24 vs Oct 31) and their Christmas breaks start a day apart (Dec 23 vs Dec 24), so those stay separate rows. But both Christmas breaks *end* on the same Sunday, and with *Merge holidays shared by several countries* on, that one row lists both places: `DE (Baden-Württemberg) · DE (Bayern)`. Merging happens per part of a break, not per break.
- **Every date is computed, none of it is listed.** Sat Oct 24, Sat Oct 31, Sun Nov 1, Sun Nov 8 - all weekend days, none of them a school day, none of them in the holiday database. They're the days school actually breaks up and resumes.

> [!NOTE]
> If you imported school holidays with an earlier version, re-import the same country and region: those entries are updated in place and move from the first listed school day to the day school actually breaks up. Nothing is duplicated, and nothing needs removing first.

### Holiday names in your language

Each imported holiday keeps the name it was imported under. Where the `holidays` library has no translation for your language - or where you simply want different wording - **Configure** that holiday and pick **Holiday names**: choose a language, type the name, done. The imported name is editable too, so `Assumption Day` can become `Assumption of Mary`.

These names round-trip through their own CSV, separate from the event export: **Configure → Holiday translations**. Only holidays you actually gave a name to appear in it.

Giving several countries' versions of one holiday the same name also lets the card collapse them into a single row - see [Holidays from several places](#holidays-from-several-places).

## Exporting events to CSV

Find the **"Annuals Settings" hub entry** under **Settings → Devices & Services → Annuals**, click **Configure**, and pick **"Export events to CSV"** - it immediately generates the file, offers a **download link** (real file, using the exact same columns as CSV import - `name,type,day,month,year,icon,vip,last_name` - so a freshly exported file can be re-imported unchanged), and also shows it inline as a copyable code block as a fallback. Only manually added and CSV/ICS/vCard-imported events are included; imported holidays aren't, re-import them via [Importing public holidays](#importing-public-holidays) instead.

**Use Ctrl/Cmd+click (or right-click → "Save link as") on the download link, not a plain click** - Home Assistant's own UI intercepts a plain click on any link inside this kind of dialog for its own in-app navigation, which never lets the download happen. This is spelled out in the dialog itself as a reminder.

For scheduled/automated exports (e.g. a nightly backup), call the **`annuals.export_csv`** action instead. It always returns the CSV as response data, and optionally writes it to a file on the HA host at the same time:

<details>
<summary>YAML: export and read the response</summary>

```yaml
action: annuals.export_csv
response_variable: export
```

</details>

<details>
<summary>YAML: export straight to a file</summary>

```yaml
action: annuals.export_csv
data:
  file_path: /config/annuals/backup.csv
```

</details>

`file_path` must be inside a directory listed under `homeassistant: allowlist_external_dirs` in `configuration.yaml`, same as CSV import.

## Leap years

The integration accounts for leap years (February 29) when calculating the number of days until the next anniversary.

If your birthday is on February 29th it is calculated correctly, and it does not fall back to March 1st — instead, in non-leap years it falls back to February 28th.

Concretely:
- Leap year (e.g. 2028): the event falls exactly on February 29th.
- Non-leap year (2025, 2026, 2027, 2029, …): the event falls on February 28th.

This is a deliberate design choice: it guarantees an occurrence every year (not just once every four years), and `occurrence_number` (e.g. "turning 30") still counts correctly, since it's simply computed as target year - birth year, independent of the exact day.

## Created entities

Each event you add is its own config entry, titled `<Type>: <Name>` (e.g. "Birthday: Anna") so the integration page groups and searches by type. The single **"Annuals Settings" hub entry**, created during first-time setup, owns the shared per-type calendars (and any future cross-event entities). It has no event fields of its own beyond the tools listed under [Annuals Settings](#annuals-settings) above; don't delete it manually unless you're removing the whole integration.

| Entity | Description |
|---|---|
| `sensor.annuals_<type>_<name>` | One per event. State is the number of days until its next occurrence; the display name is the translated, type-prefixed event name (e.g. "Birthday Anna"). The `<type>` in the entity_id keeps two events sharing a name (e.g. a birthday and a wedding anniversary) from colliding, and applies to every type including "Custom". |
| `calendar.annuals_<type>` | One per event *type* (ten total, including Holiday), named in the plural (e.g. "Birthdays"), aggregating every event of that type across all your entries - open it from the built-in Calendar dashboard. |

Attributes on each event's sensor:

| Attribute | Description |
|---|---|
| `state` | Days until the next occurrence. |
| `type` | One of `birthday`, `anniversary`, `name_day`, `wedding_anniversary`, `memorial`, `pet_birthday`, `work_anniversary`, `custom`, `one_time`, `holiday`. |
| `type_label` | The type above, translated into Home Assistant's configured server language (e.g. "Birthday"/"Geburtstag") - handy for building sentences without hardcoding your own per-type labels. |
| `name` | The plain name as entered (e.g. "Anna"), without the type prefix baked into the entity's display name - handy for building sentences on a dashboard. |
| `last_name` | The **Last name** field as entered, or an empty string if not set. Always an empty string for `holiday` events. |
| `full_name` | `name` + `last_name` (e.g. "Anna Miller"), or just `name` if no last name was set. Always equal to `name` for `holiday` events. |
| `next_date` | Date (ISO format) of the next occurrence - for `one_time` events, its fixed, non-recurring date, handy for building a countdown display. |
| `occurrence_number` | Which occurrence the next date will be (e.g. `30` for a 30th birthday) - `null` when no year was entered. Always `null` for `holiday` and `one_time` events, since neither recurs in a way "occurrence number" applies to. |
| `reminder_message` | A ready-made, translated countdown phrase for `state`, e.g. "in 7 days", "Tomorrow", or "Today" - same language as `type_label`. |
| `day`, `month`, `year` | The event's date as entered (`year` is `null` when unknown - always set for `one_time` events, see [Adding an event](#adding-an-event) above). Not applicable to `holiday` events - see `next_date` instead, since a public holiday's date shifts by year. |
| `todo` | `true` if a still-open item on one of the to-do lists picked under [Annual Settings](#annual-settings-automatic-milestones) is currently matched to this event, `false` otherwise (and always `false` while no list is picked). |
| `vip` | `true` if the **VIP annual** flag is set on this event, `false` otherwise. |
| `important` | `true` if the upcoming occurrence number matches one of that type's milestones in [Annual Settings](#annual-settings-automatic-milestones), `false` otherwise (always `false` when no year was entered, since there's no occurrence number to check - always `false` for `one_time` events for the same reason). |
| `category`, `country`, `subdivision`, `holiday_key` | `holiday` events only - the imported holiday's category (see [Importing public holidays](#importing-public-holidays)), country code, subdivision code (empty if none was chosen), and its stable identity key (e.g. "New Year's Day") used to match its actual/observed counterpart. `null`/absent on every other type. |
| `observed` | `holiday` events only - `true` if this entity tracks the holiday's practically-observed (weekend-shifted) date rather than its literal one, see [Importing public holidays](#importing-public-holidays). `false`/absent on every other type. |
| `end_date`, `days_until_end`, `duration_days`, `in_progress`, `reminder_message_end` | Multi-day one-time events only (see [Events that span several days](#events-that-span-several-days)) - the last day as an ISO date, the countdown to it, how many days the event covers, whether it's running right now, and the translated countdown phrase for the end. All absent on single-day events and on every other type. |
| `break_part` | `holiday` events only - which part of a multi-day break this entity is: `start`, `end`, or `day` (see [School holidays](#school-holidays-and-other-multi-day-breaks)). `null` on single-day holidays and on every other type, which is what lets a filter for it leave them alone. |

Attributes on each per-type calendar (standard Home Assistant calendar entity attributes, reflecting whichever event is current or comes up next for that type):

| Attribute | Description |
|---|---|
| `state` | `on` when today falls within one of this type's events (an all-day event, so this is `on` for the whole day), `off` otherwise. |
| `message` | The event summary shown in the calendar, e.g. "Anna - Birthday (26)" (just the name for Custom and One-time events, since restating the type or an always-`null` occurrence number would be redundant). |
| `all_day` | Always `true` - events are stored as whole days, not specific times. |
| `start_time`, `end_time` | The event's date, formatted as `YYYY-MM-DD HH:MM:SS` (start at midnight, end the next midnight). |
| `location`, `description` | Always empty - not currently populated. |

## Automation examples

### Blueprint: Upcoming Event Reminders

A ready-to-use automation [blueprint](blueprints/automation/annuals/annual_reminders.yaml) covers the common "remind me ahead of time" case without writing any YAML yourself:

[![Open your Home Assistant instance and show the blueprint import dialog with a specific blueprint pre-filled.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fraw.githubusercontent.com%2Fsomansch%2Fannuals%2Fmain%2Fblueprints%2Fautomation%2Fannuals%2Fannual_reminders.yaml)

- **Target** either a hand-picked list of events, or every event of one or more chosen types (e.g. all birthdays and wedding anniversaries) - no need to list entities one by one or update the automation when you add a new event.
- **Filter** by VIP and/or Important, each independently set to "must be" or "must NOT be" - and when both are active, choose whether they need to match together (AND) or either is enough (OR).
- **Multi-day events**: for a one-time event with an end date (a holiday trip, a conference), count down to the day it starts, the day it ends, or both - each using the same "days before" thresholds. The end reminder gets its own to-do item, so ticking off "pack the bags" doesn't swallow the reminder about coming home.
- **Filter holidays** by **category** (Public, School, Bank, …) and by which **part of a multi-day break** may remind - start, end, or the individual days. Anything the filter doesn't apply to passes it, so *Public + School* with *Start of the break* reminds about every public holiday, and about school holidays only on the day they begin rather than on all forty-five of them. Both are plain narrowing filters and stay out of the VIP/Important AND-OR logic.
- **Multiple lead times** in one go, e.g. `7,1,0` for a week before, the day before, and the day itself - each is a one-time ping, not a repeating nag.
- **Notify anywhere**, each its own collapsible section - mix and match freely:
  - **Mobile App Notify**: push to one or more devices via the Companion App, each with a tappable "Done" button.
  - **Notifications**: show up in Home Assistant's own notification bell, and/or keep a dashboard status helper (`input_text`) updated for a Markdown/Entity card.
  - **Text-to-Speech Announcement**: speak the reminder on one or more media players via any TTS engine - several due reminders the same day are announced one after another, never overlapping.
  - **Custom Actions**: anything else with the normal action editor - email/SMTP, WhatsApp/Telegram/Signal/ntfy, whatever.
- **Customizable text**: the notification title and message are templates you can edit, with variables for the event's name, type, occurrence number, days until, and more - the event type and countdown phrase (`{{ ev_type }}`, `{{ reminder_message }}`) come pre-translated into Home Assistant's configured language.
- **Optional to-do list tracking**: each due reminder becomes an item on a to-do list of your choice, using the rendered notification title as its text - due date/time and description are set automatically from the event's own date and the notification message, so there's nothing extra to fill in. Completing it (from the list, via the mobile notification's "Done" button, or straight from the [dashboard card](#to-dos)) resolves the reminder for good: once checked off, that event is skipped by every channel above too, not recreated by a later lead time or a manual re-run.

See the blueprint's own field descriptions (visible when creating an automation from it) for the full details on each option.

### Use in your own automations

Every event is a plain sensor with plain attributes - `vip`, `important`, `category`, `in_progress` and the rest (see [Created entities](#created-entities)) - so anything the card or the blueprint can do, your own automations can do too. The examples below never name a single event entity: they select over `sensor.annuals_*` by attribute, so they keep working as-is no matter how many events you add or remove later. Replace `notify.notify` with your own notify target (e.g. `notify.mobile_app_your_phone`).

**Notify me when a VIP has their day today:**

<details>
<summary>YAML</summary>

```yaml
automation:
  - alias: "Annuals - VIP event today"
    triggers:
      - trigger: time
        at: "08:00:00"
    actions:
      - repeat:
          for_each: >
            {{ states.sensor
               | selectattr('entity_id', 'match', '^sensor\.annuals_')
               | selectattr('attributes.vip', 'equalto', true)
               | selectattr('state', 'equalto', '0')
               | map(attribute='entity_id')
               | list }}
          sequence:
            - action: notify.notify
              data:
                message: >
                  {{ state_attr(repeat.item, 'name') }} has their event today!
```

</details>

**Remind me 7 days before an important milestone:**

<details>
<summary>YAML</summary>

```yaml
automation:
  - alias: "Annuals - important milestone in 7 days"
    triggers:
      - trigger: time
        at: "08:00:00"
    actions:
      - repeat:
          for_each: >
            {{ states.sensor
               | selectattr('entity_id', 'match', '^sensor\.annuals_')
               | selectattr('attributes.important', 'equalto', true)
               | selectattr('state', 'equalto', '7')
               | map(attribute='entity_id')
               | list }}
          sequence:
            - action: notify.notify
              data:
                message: >
                  {{ state_attr(repeat.item, 'name') }}'s {{ state_attr(repeat.item, 'occurrence_number') }}. event is in 7 days!
```

</details>

Adjust the `"7"` in the second example to match however far ahead you want the reminder, and add a second `repeat` block (or duplicate the automation) if you want more than one lead time.

**Open the shutters later on a day off** - weekend, public holiday, or school holidays:

> [!IMPORTANT]
> This one needs the school holidays imported with **every day** ticked (see [School holidays](#school-holidays-and-other-multi-day-breaks)). A break imported only as its first and last day is two events on two days, which can tell you a break *begins* today but not that you are in the middle of one. With every day imported, "is today a holiday" is simply "is any holiday event due today".

<details>
<summary>YAML</summary>

```yaml
automation:
  - alias: "Annuals - shutters up later on days off"
    triggers:
      - trigger: time
        at: "07:00:00"
        id: early
      - trigger: time
        at: "09:00:00"
        id: late
    variables:
      # Saturday/Sunday, or any public or school holiday falling today.
      day_off: >
        {{ now().weekday() >= 5
           or states.sensor
              | selectattr('entity_id', 'match', '^sensor\.annuals_')
              | selectattr('attributes.category', 'defined')
              | selectattr('attributes.category', 'in', ['public', 'school'])
              | selectattr('state', 'equalto', '0')
              | list | count > 0 }}
    conditions:
      # Exactly one of the two triggers survives this: the late one on a day
      # off, the early one otherwise.
      - condition: template
        value_template: "{{ (trigger.id == 'late') == (day_off | bool) }}"
    actions:
      - action: cover.open_cover
        target:
          entity_id: cover.bedroom
```

</details>

**Switch lights on and off at random while you're away** - for the whole length of a multi-day event, without touching the automation when the dates change:

<details>
<summary>YAML</summary>

```yaml
automation:
  - alias: "Annuals - presence simulation while away"
    # Runs at most one lamp cycle at a time; a trigger landing mid-cycle is
    # dropped rather than queued.
    mode: single
    max_exceeded: silent
    triggers:
      - trigger: time_pattern
        minutes: "/20"
    conditions:
      - condition: sun
        after: sunset
        after_offset: "-00:30:00"
      - condition: time
        before: "23:30:00"
      # True while any multi-day one-time event is running - "in_progress"
      # only exists on those, so nothing else can match (see Events that
      # span several days).
      - condition: template
        value_template: >
          {{ states.sensor
             | selectattr('entity_id', 'match', '^sensor\.annuals_')
             | selectattr('attributes.in_progress', 'defined')
             | selectattr('attributes.in_progress', 'equalto', true)
             | list | count > 0 }}
    variables:
      lamp: "{{ ['light.living_room', 'light.kitchen', 'light.bedroom'] | random }}"
    actions:
      - delay:
          minutes: "{{ range(0, 15) | random }}"
      - action: light.turn_on
        target:
          entity_id: "{{ lamp }}"
      - delay:
          minutes: "{{ range(10, 40) | random }}"
      - action: light.turn_off
        target:
          entity_id: "{{ lamp }}"
```

</details>

The second one fires for *any* multi-day event that's currently running, which is usually what you want - a conference away from home simulates presence just as well as a holiday. To tie it to one specific trip instead, replace the template condition with `{{ is_state_attr('sensor.annuals_one_time_vacation', 'in_progress', true) }}`.

## Countdown for one-time events

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/one-time-examples.png" alt="A badge, a Tile card, and a Markdown card all showing the same one-time event countdown" width="45%">

A one-time event's sensor (`state` = days left, plus `full_name` and `next_date` attributes) works with Home Assistant's own built-in cards - no custom card needed. Three ways to show it, from smallest to most flexible:

### Events that span several days

A one-time event can have an **End date** - that's what turns a single date into a holiday trip, a conference or a hospital stay. Leave it empty and nothing changes; fill it in and the event runs from its start date to that day inclusive. The [screenshot further up](#school-holidays-and-other-multi-day-breaks) shows one: *Urlaub auf Mallorca* listed as its start and its end, next to a plain single-day one-time event that keeps no suffix at all.

What changes once it has one:

- The countdown still counts down to the **start**, and then **stays at 0** for the whole time the event runs rather than going negative. `in_progress` tells the two apart.
- Extra attributes come along: `end_date`, `days_until_end`, `duration_days`, `in_progress` and `reminder_message_end` (the translated countdown phrase for the *end*, e.g. "in 3 days"). They're absent on single-day events, so anything reading them can use their presence as "this one spans several days".
- The event is **removed after its last day**, not after its first - a two-week holiday stays on the dashboard for the whole two weeks.
- On the **calendar entity** it's one all-day event covering the whole range, instead of a single day at the start.
- The **[dashboard card](#custom-dashboard-card)** can list it as its first day, its last day, both, or one row per day - Events → *Multi-day events*, shown only while **One-time event** is among the types the card displays. Each row says which part it is - `Vacation (start)`, `(end)`, `(day 3)`, in the language the card is read in - so it can't be mistaken for an ordinary single-day row. Every row counts from the day it is about, so each one is subject to the card's own past-event settings: on day five of a fortnight the per-day list starts at day five, and the *first day* row is gone unless the card shows past events. A card set to *Only the first day* therefore stops listing a trip once it has begun - *First and last day* keeps it through its end row, *Every day* through the day it is on.
- The **[reminder blueprint](#blueprint-upcoming-event-reminders)** can count down to the start, to the end, or both, each using the same "days before" thresholds - Multi-day events → *Remind about*. With to-do tracking on, departure and return become two separate items rather than one that either can tick off.

The **end_date** column also rides along in the [event CSV](#exporting-events-to-csv), as an ISO `YYYY-MM-DD` date in the last column. A CSV written before this existed imports unchanged.

- **Badge/chip** (top of a view or a Heading card) - **Settings** (pencil icon) → **Add badge** → pick the event's sensor. Shows its icon, name, and "X days" as a small pill.
- **Tile card** - add a card, pick the sensor; the suggested Tile card shows the same thing as a small stand-alone card.
- **Markdown card** - for a full sentence that adapts as the countdown reaches zero (e.g. "Still 3 days to go" → "Starts tomorrow!" → "Today's the day! 🎉"):

<details>
<summary>YAML</summary>

```yaml
type: markdown
content: >
  ## 🌴 {{ state_attr('sensor.annuals_one_time_vacation', 'full_name') }}

  {% set days = states('sensor.annuals_one_time_vacation') | int(0) %}
  {% if days == 0 %}
  **Today's the day!** 🎉
  {% elif days == 1 %}
  Starts **tomorrow**!
  {% else %}
  Still **{{ days }} days** to go
  {% endif %}

  📅 {{ state_attr('sensor.annuals_one_time_vacation', 'next_date') }}
```

</details>

Swap `sensor.annuals_one_time_vacation` for your own one-time event's entity ID to reuse any of these as-is.

## Native Calendar card

Add a **Calendar card** pointed at one or more of the `calendar.annuals_<type>` entities for a native calendar view:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/calendars.png" alt="The eight per-type calendars" width="75%">

**Annuals' own `calendar.annuals_*` entities work exactly like any other Home Assistant calendar** - drop them into the native Calendar card above, or into any other custom card that supports calendar entities. **Or flip it around:** use Annuals' own dashboard card below, and pull in your *existing* calendars (Google, CalDAV, Local Calendar, ...) alongside Annuals' events in the same card - see [External calendars](#external-calendars).

## Custom dashboard card

Annuals bundles its own Lovelace card (`custom:annuals-card`). There is no separate frontend package to install: it ships with the integration and registers itself automatically.

Add it to a dashboard the normal way - search for "Annuals Card" in the card picker - or add it **by entity**. Picking an Annuals event sensor, one of Annuals' own calendars or any other calendar there offers the card among the suggestions, already configured for what you picked.

Everything after that is set in the visual editor, no YAML required: which event types to show, the time window, the VIP and Important filters, the appearance of every element in a row, what past, today and soon rows look like, and an optional background image or color. If you imported a holiday's actual *and* observed date, **Prefer observed date** (Settings → Events) folds the pair into one entry - it drops the "(observed)" suffix and hides the duplicate.

The card's own UI text (not the integration's entities/config-flow, which follow your server's language setting) follows **your personal profile language** - Settings → People → your user → Language - and is available in the same 15 languages as the rest of the integration.

To override that per card, set **Language** (Settings → General) to one of those 15 language codes: the card then reads the same for everyone who sees it, no matter whose profile is looking at it - useful for a wall-mounted tablet, a shared household dashboard, or simply a card you want in a specific language. It covers the card's own text and its date/time formatting together, so the two never end up in different languages. Left on **Automatic**, each viewer keeps seeing their own language, exactly as before. The card *editor* always stays in your own profile language, so pinning a card to a language you don't read never leaves you stuck in a form you can't find your way back out of. Missing a language? The **"Missing your language?"** link right below opens a pre-filled feature request for it.

**No events text** (Settings → General) is what the card writes in place of the list when it has nothing to show. Left empty it stays the built-in phrase, translated into whichever language the card is read in - the same way an empty **Card title** keeps the default one. Its own appearance sits in Layout → **Design**, in a block directly under Card title: a color, a size and the four style toggles, like every other element. Both layouts fall back to the same line, so the block is always listed rather than following the row columns.

One integration, five ways to read the same events - the List view, the Timeline, a Compact one-line card, the to-dos it tracks, and an Agenda-style list:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-summary.png" alt="List view, Timeline, Compact, to-dos and an Agenda-style list, side by side" width="90%">

### The visual editor

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-editor.png" alt="Annuals card visual editor" width="45%">

The editor is split into two panels. **Settings** holds what the card shows - **General** (title, language, date format), **Events** (which types to include, holidays, to-dos, external calendars) and **Time period** (days ahead, days past, the "soon" threshold). **Layout** holds how it looks - **General** (list or timeline, and the event filters), **List view** (the row columns, separators, tap actions), **Timeline**, **Design** (one block per element: its color, its font, its style), **Highlight** (badges and the per-status colors) and **Card Background**.

That is a lot of settings, and a form listing all of them at once would be unusable. So the editor shows only what your card can actually use, and nothing else. A control appears when either of two things is true:

- **The data exists.** The Time, Location and Description settings wait until an [external calendar](#external-calendars) is embedded; the to-do filter and badge wait for a [to-do list](#to-dos); the holiday settings wait for holidays to be among the selected event types, and each event type gets a block of its own only while that type is selected.
- **The function is switched on.** A color field appears once its own switch is on; the Accent bar's block appears once that column is in the row; the Date block's three lines appear with the Date block column; every list-only setting disappears in the Timeline layout, and vice versa; and the whole Timeline panel collapses to a one-line note while the card is in list layout.

Two rules keep that from hiding something you still need. **Anything you have actually configured stays visible**, even after its source goes away - remove a to-do list and the to-do settings you had set are still there, ready for the next one. And a `{placeholder}` inside a [Custom text column](#row-columns) counts as using that field, so `{name} turns {occurrence}` keeps the Name and Occurrence entries listed in Design.

Every row carries an **"i"** with a sentence on what it does, so nothing depends on guessing from the label alone.

The sections below follow that same path, so reading on walks the editor rather than jumping between its tabs:

| Where in the editor | Covered in |
| --- | --- |
| Settings → **General** | [Date format](#date-format) - and Card title, Language and the ["no events" line](#custom-dashboard-card) above |
| Settings → **Events** | [Holidays from several places](#holidays-from-several-places), [To-dos](#to-dos), [External calendars](#external-calendars) |
| Settings → **Time period** | Days ahead, days past and the "soon" threshold - three plain number fields |
| Layout → **General** | The layout switch, and the VIP / Important / open-to-do filters |
| Layout → **List view** | [Row columns](#row-columns), [Day, week and month separators](#day-week-and-month-separators), [Row click/tap behavior](#row-clicktap-behavior) |
| Layout → **Timeline** | [Timeline layout](#timeline-layout) |
| Layout → **Design** and **Highlight** | [Row colors](#row-colors), [Icon animations](#icon-animations) - and, through them, every element's own color and font |
| Layout → **Card Background** | A color, an image, its sizing and its opacity, all behind one switch |


### Date format

**Date format** (Settings → General) decides how the [Date column](#row-columns) writes an event's date. Eight options, each listed in the dropdown as an actual date rather than a name, so you pick by looking at the result:

| Option | en-US | de |
|---|---|---|
| Short (default) | Aug 11 | 11. Aug. |
| Short, year when needed | Aug 11 / Aug 11, 2027 | 11. Aug. / 11. Aug. 2027 |
| Short with weekday | Wed, Aug 11 | Mi., 11. Aug. |
| Numeric | 8/11 | 11.8. |
| Numeric with year | 8/11/2027 | 11.8.2027 |
| Long | August 11, 2027 | 11. August 2027 |
| Weekday only | Wednesday | Mittwoch |
| Full | Wed, Aug 11, 2027 | Mi., 11. Aug. 2027 |

Day/month order, separators and month spelling come from the browser's own locale data, so every one of the 15 languages gets its own conventions without you configuring anything. The second option adds the year only for dates outside the current year - handy on a card of yearly-recurring events, where the year is noise right up until the one entry it isn't (a [one-time event](#countdown-for-one-time-events) two years out, or an event that just crossed the new year).

The same setting drives the `{date}` placeholder in [Custom text columns](#row-columns) and the [Timeline layout](#timeline-layout)'s **Show date**, so one card reads consistently. The full date revealed by tapping a countdown is deliberately left out of it: its job is to spell the day out unambiguously, whatever the columns are set to.

**Say "Today"** (right below) controls whether the Date column writes "Today" instead of the date on an event's own day. On by default; turn it off for a card meant to read as a plain date list.

### Holidays from several places

Once a card carries holidays from more than one country or region, three settings on the Settings → Events tab decide how that reads.

**Merge holidays shared by several countries** collapses one holiday observed in several places into a single row, listing the places after the name. **Region format** writes a region as `US (California)` rather than `US (CA)`; the country stays a code either way.

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-holiday-joined-2.png" alt="Holidays from five US states in one card, with shared holidays merged into a single row" width="60%">

Nationwide holidays show the bare country (`US`), because that is where they apply; a merged row lists each place it came from (`US (Hawaii) · US (Illinois)`).

**Countries and regions** limits the card to some of what you imported. All of them selected means no filter, so a country imported later shows up without revisiting the setting. Note that nationwide holidays carry no region, so selecting only `US (California)` shows California's own holidays without the federal ones - add `US` to bring those back.

#### When merging doesn't happen

Merging matches on the **name**, so two places that call the same day different things stay separate - `Day After Thanksgiving` and `Friday After Thanksgiving` in the screenshot above are the same Friday. That is what [Holiday names](#holiday-names-in-your-language) is for: rename one to match the other and the next render merges them.

Across countries this is the normal case rather than the exception, because the `holidays` library carries each country's names in that country's own languages - and there is no reason for a Spanish or French calendar to also be translated into German. Import August 15 from Bavaria, Saarland, Spain, France and Italy and you get `Mariä Himmelfahrt`, `Asunción de la Virgen`, `Assomption` and `Ferragosto`: one holiday, five entries, no two names alike, so nothing merges.

Give the four non-German ones the German name once, and the whole set collapses into one row:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-holiday-joined.png" alt="One holiday observed in five places across four countries, merged into a single row" width="60%">

The same trick handles a country whose language the library doesn't cover at all: whatever it imported under, you can give it a name in each of the 15 languages and the card will use the one matching its own Language setting.

### To-dos

Settings → Events → **To-dos** points the card at one or more of your existing `todo.*` lists. Every event that still has an open item on one of them gets a small pin badge on its icon - a reminder that there's something left to do about it, right where you're already looking:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-todo-tasks.png" alt="To-do pin badges in the List and Timeline layouts" width="90%">

Nothing has to be linked up by hand. The card works out which item belongs to which event itself:

- **Due date first**, always. An item with no due date, or one due on a different day than the event, is never matched - no matter what its text says.
- **Then the item's own text**, scoring the event's **full name**, **name**, **type**, and **occurrence number** in that order. So "Buy Anna Miller a gift" beats a plain "Buy a gift" that only happens to share the date.
- **A tie is left alone.** If an item fits two events on that day equally well, it's matched to neither rather than guessed at - the badge only ever appears where the card is actually sure.

This pairs naturally with the bundled [reminder blueprint](#blueprint-upcoming-event-reminders)'s optional to-do tracking, which already writes the event's date and name into each item - but hand-written items work exactly as well, as long as the due date is right.

**Complete from card** (on by default, same section): clicking a badged event's icon asks for confirmation and then marks all of that event's open items as completed. Works on the row icon in the List layout, and on the header icon and the expanded Details list in the [Timeline layout](#timeline-layout). Turn it off to leave the badge as a pure indicator. The badge on a Timeline axis dot is display-only either way, since clicking a dot already opens its tooltip.

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-todo-tasks.gif" alt="Clicking a badged event's icon to complete its to-do item from the card" width="45%">

**Open to-dos only** (Layout → General → **Show / Hide**) turns the same matching into a filter: only events that still have an open item are shown. It narrows the neighboring **VIP only** / **Important only** toggles rather than joining them - those two combine with each other as "either", and this one then applies on top, so all three on means "the VIP or Important events that still have something to do". Like the other two, it only narrows Annuals' own events: an embedded [external calendar](#external-calendars) event can never carry a to-do the card can see, so it stays in the list rather than being filtered out by a test it could never pass.

The badge's icon and colors live with the other badges under Layout → Highlight: a **To-do tasks** on/off toggle, the MDI icon to use (`mdi:pin` by default), and separate List/Timeline colors (the theme's red by default) - exactly the same set of controls VIP and Important have.

### External calendars

Settings → Events → **External calendars** lets you embed one or more of your existing Home Assistant `calendar.*` entities (Google, CalDAV, a Local Calendar helper, another integration's calendar, ...) alongside Annuals' own events, in the same card. Unlike an Annuals event, an external calendar event lands on its own real date - not a yearly-recurring "next occurrence" - and, within a day it shares with other events, sorts by its own time of day (all-day events first, then timed events earliest-first); an Annuals event has no time of day of its own and always sorts as if it were all-day.

Pick any number of calendars from the entity picker; each one's events within the card's configured day window (`days_ahead`/`days_past`/`soon_days`, same as everything else) are pulled in automatically - no import step, no separate entry, and no effect on Annuals' own `types`/`categories`/VIP/Important filters, which simply don't apply to a calendar event. To also show a calendar event's own time range, location, or description:

- **List layout**: add a **Time**, **Location**, and/or **Description** column ([Row columns](#row-columns)), or use the same three toggles inline on the Type field itself (see the **External calendars only** group above) - either way, they render empty for every non-calendar event.
- **Timeline layout**: turn on **Show time** / **Show location** / **Show description** (Layout → Timeline → Options) - each appends into the same trailing parenthetical **Show date** already uses, e.g. "...is in 3 days (03:00 PM–04:00 PM · Home · Weekly sync)". All four are independent toggles; any combination (or none) can be on at once.

A calendar event's icon comes from the source calendar's own icon. Its dot/text color follows that specific calendar's own **Calendar color** - each embedded calendar keeps its own color rather than sharing one. Its "type" text - wherever a row or Timeline sentence would otherwise show one - is the source calendar's own name by default, e.g. "Team meeting - Family", the same way an Annuals event shows "Anna - Birthday" (turn this off with the **Calendar name** toggle above once Time/Location/Description already say enough).

Time, Location and Description each get their own row under **External calendar fields** in the Design tab, whether the field sits in a column of its own or inline on a Type column, so a long description can be sized down without shrinking the time above it. All three default to the theme's secondary text color. Setting them apart from the Annuals fields around them is usually enough to tell an embedded calendar entry from an Annuals event at a glance, without adding a column that says so. The group appears only once a calendar is actually embedded.

### Row columns

Each row's layout is set in Layout → List view → **Row columns**: add, remove and reorder as many columns as you like, choosing from Icon, Name, Last name, Full name, Type, Name + Type, Full name + Type, Occurrence, Countdown, Date, Date block, Accent bar, Time, Location, Description, or free-form **Custom text**. Three of them are worth a word:

- **Date** writes the next occurrence in whichever of the eight formats **Date format** is set to (see [Date format](#date-format)) - or "Today" once it actually is, the same as the Countdown column.
- **Time**, **Location** and **Description** only ever show anything for an [embedded external calendar event](#external-calendars). They render empty for every Annuals event, which has none of the three.
- **Custom text** mixes your own text with placeholders - `{name}`, `{last_name}`, `{full_name}`, `{type}`, `{occurrence}`, `{when}`, `{date}`, `{country}`, `{time}`, `{location}`, `{description}` - so a row can read as one continuous sentence instead of a table: "Anna · Birthday · 30 · Today" becomes "🎉 Anna turns 30 today! 🎉". Each placeholder keeps its own field's color and font (Layout → Design), so `{occurrence}` still looks like an occurrence number - the typography carries over, not the pill behind a real Occurrence badge. Sizes in `em` compound with the Custom text size; use `px` for an absolute one.

A new card starts on **Icon, Full name + Type, Occurrence, Countdown**. Three buttons above the list set the whole arrangement in one click, each still fully editable afterward:

- **Default** - that same starting arrangement.
- **Agenda** - Date block, Accent bar, Full name + Type, Occurrence, Icon, for a list that reads like a paper agenda rather than a table. It brings the week rule with it.
- **Minimal** - Name, Occurrence and Countdown, for a card with room for nothing else.

Whichever button matches the list as it stands is highlighted, so the buttons say where the card is and not only where it can go - touch a single column and none of them is marked any more. The Agenda arrangement was inspired by [Calendar Card Pro](https://github.com/alexpfau/calendar-card-pro) by [@alexpfau](https://github.com/alexpfau) – worth a look if a calendar-first card is what you are after.

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-listview-presets.png" alt="The Default, Agenda and Minimal row-column presets side by side" width="90%">

**Date block** and **Accent bar** are the two columns that make a list read like a calendar agenda rather than a table. **Date block** writes the occurrence as three stacked lines - weekday, a large day number, and the month in capitals - instead of one line of text. It's a column of its own rather than a ninth [date format](#date-format): `{date}` in a custom text column and the [Timeline layout](#timeline-layout) keep using whatever Date format is set to. It always shows the real date, so *Say "Today"* has no effect on it; the row still says "today" through its countdown and its color. **Accent bar** is a colored bar the height of the row, in that row's own icon color - Accent, Today or Soon, as set under Layout → Design - so today and the next few days stand out before you read anything. Put it first for the usual left-edge stripe, or anywhere else you want a divider. Both are ordinary columns, so they move, repeat and disappear like the rest.

Each of the Date block's three lines has its own block in Layout → **Design**, under a **Date block** heading of their own: *Weekday*, *Day* and *Month*. They are independent of the **Date** entry, which belongs to the separate Date column - sizes are relative to the card's own font size (0.75 / 1.5 / 0.75 when left empty), and an empty color means the weekday and month take the theme's secondary text color while the day takes its primary one. The month's small-caps look is the **Uppercase** toggle on its own row (on by default); switch it off for a plain "Aug". The day has no Uppercase toggle - it is a number.

The **Accent bar** column has its own block in Layout → **Design**, alongside every other element: a **Color** and, where the others have a font, a **Width** (3px if left empty). Left empty, the color is the one thing the column is for - each bar takes its own row's color - and setting it here pins every bar to one fixed color instead. There is no on/off switch: the bar appears exactly when its column is in the row columns, and its block in Design appears with it.

The bar can also carry the row's badges. Layout → Highlight opens with a **Badges** section holding the VIP, Important and to-do settings, and each of the three carries two switches of its own: **Event icon** draws that badge in the corner of the row's event icon, **Accent bar** draws it in a stack immediately left of the bar - centered against the row, and always ordered VIP, Important, to-do from the top. They are independent, so one badge can move to the bar while the others stay on the icon, or run in both places at once. Useful on a card that shows no icons at all, or one that wants the flags read as a column rather than as decoration on something else. The stack takes a badge's width whether it holds three or none, so every row's bar stays on the same vertical line. *Accent bar* is listed only while that column is in use, and neither switch appears in the timeline layout.

Each badge is a symbol on a disc, and both are configurable: **Badge color** is the symbol, **Badge background color** the disc behind it.

**Tap countdown for date** (Layout → List view, off by default) makes the Countdown column tappable: tapping swaps "in 2 days" for the event's actual date ("Mon, 3 Aug 2026"), tapping again swaps back - the same way Home Assistant's own activity feed toggles a relative time for an exact one. The rest of the row keeps triggering its usual [tap/hold action](#row-clicktap-behavior). The [Timeline layout](#timeline-layout) has its own equivalent under Layout → Timeline → Options, applying to the countdown at the end of its sentence.

**Name flexibility for non-holiday events:** set a Last name on an event (Adding an event, above) to get first/last name apart - e.g. a **Name** column showing just "Anna" for a compact card, and a separate **Full name** column ("Anna Miller") elsewhere. The Design tab has dedicated blocks for Last name and Full name, right next to Name.

Any column that includes a Type field - the standalone **Type** column, or the combined **Name + Type**/**Full name + Type** - shows its extra options grouped under two headings:
- **Holidays only**: a **Suffix** toggle per name field (Name/Full name/Type on the combined columns, just Type on the standalone one) that appends the imported country (+ subdivision) for holiday rows, e.g. "· US (UT)". Plus a **Type label** toggle (on by default) that drops the type text itself for holidays - "Holiday (Public) · US (Hawaii)" becomes "US (Hawaii)" - for whom the category adds nothing next to the place. Holidays only: every other event type keeps its label, which is often all that cell says.
- **External calendars only**: **Calendar name** (on by default - the source calendar's own name filling the Type cell), **Time**, **Location**, and **Description** - each only ever has an effect on an [embedded external calendar event](#external-calendars); every Annuals event, including a one-time event, ignores them. Each of the four gets its own line in the cell, with Time, Location and Description led by a clock, pin and text icon so they're recognizable at a glance; they used to run together on one " · " line, which became an unbroken string as soon as more than one was switched on. Turn **Calendar name** off once Time/Location/Description already say enough without it. Only these four stack - a holiday's own "Holiday (Public) · US (Hawaii)" still reads as a single line.

Both groups follow the same rule as the rest of the editor: **Holidays only** is listed while holidays are among the selected event types, **External calendars only** while a calendar is embedded, and a column left with neither group simply has no block under it. Every toggle in both has its own "i" explaining exactly what it does.

Turning on **Compact** mode removes the spacing between columns, centers the row, and equalizes the weight/opacity of every field - meant for exactly that sentence-style layout. Switching it on immediately swaps the columns to **Icon, Full name, Occurrence, Type, Countdown, Date**, with a plain space column automatically inserted before each of the last five so nothing runs together with no gap - a starting point you're still free to add, remove, or reorder from there. Switching Compact back off resets the columns to the standard (non-compact) default above. This is also how to build a small "today only" card: duplicate the card, turn on the **Today only** filter (Settings), reduce the columns to a single custom-text one, and enable Compact:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/birthday_small_animated.gif" alt="Compact today-only birthday card" width="40%">

### Day, week and month separators

**Day separators**, **Week separators** and **Month separators** (Layout → List view) draw a line wherever two consecutive rows fall on different days, in different weeks, or in different months, breaking a long list into blocks. Nothing is re-sorted or grouped: they only mark the boundaries the list order already has. Where a week starts is Home Assistant's own **First day of the week**, the setting on each viewer's profile page (click your name at the bottom of the sidebar), next to Language and Time format. Left on its default, *Language*, the week starts wherever the language the card is being read in starts it - Monday across most of Europe, Sunday in the US - so the lines fall where the reader's own calendar breaks either way. A row that begins two boundaries at once gets only the coarser line.

Each is its own block with a switch in its heading; turning one on reveals that scale's **Width**, **Style** (solid, dashed or dotted) and **Color**. Left unset, a line is 1px in the theme's own text color - dotted for days, dashed for weeks and solid for months, so a list with more than one on reads as a hierarchy.

A line can also say which boundary it marks. **Show weekday**, **Show calendar week** and **Show month** write that name on the rule itself: centered, on a plate with strongly rounded corners in the card's own background color, so the line breaks around the text instead of running through it. The plate follows the text's own width, so "Monday" and "9" each leave exactly the gap they need. Switching one on reveals the label's own appearance, laid out like any Design block - **Label color** and **Label background**, empty meaning the theme's text color and the card's background, then **Font** with Bold/Italic/UPPERCASE/Underline and **Letter spacing**. The calendar week is counted from the same **First day of the week** that decides where the week lines fall, so a line and the number on it can never disagree; with a Monday start that is ISO-8601 week numbering. All three labels are off by default.

### Row click/tap behavior

Clicking or tapping a row opens its more-info dialog by default, and **Layout → List view** has a **Tap action** and a **Hold action** field to change that: More info, Navigate, URL, Perform action, Toggle, Assist, or Nothing. They sit with the row columns because they configure the list layout's own rows - the [Timeline layout](#timeline-layout) has no row to tap, its axis dots and header sentence having their own fixed behavior.

### Timeline layout

**Layout style** (Layout → General) switches the whole card from the classic row list to a **Timeline**: a compact horizontal axis with a dot per visible event (sized and positioned by how close it is to today), a header sentence for whichever day is soonest/most recent, and a "Details" toggle that expands the full chronological list. Handy for a narrow Sections-view column where a full row list doesn't fit.

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-timeline-example-1.png" alt="Timeline layout, collapsed" width="45%">

Tapping **Details** expands the same axis into the full chronological list, oldest to furthest out:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-timeline-example-2.png" alt="Timeline layout, expanded Details list" width="45%">

- **Header** (Layout → Timeline): by default, the header shows one sentence per event tied for the very next (or most recent) day, with no cap and nothing pulled in from later days. **Max events per day** caps how many header lines a single day of tied events contributes - anything beyond the cap for that day still gets its own dot on the axis, just without a header line. **Always show N upcoming** always shows at least that many header lines in total, pulling in further days beyond the very next one if needed (each still subject to the cap above). Both are optional; leave either empty for the original, uncapped single-day behavior.
- **Options** (Layout → Timeline): **Show full name** shows each event's full name (first + last) instead of just the first name, everywhere the layout uses a name - the header, a dot's tooltip, and the expandable list. **Show holiday suffix** appends the imported country (+ subdivision) after a holiday's name, e.g. "Pioneer Day (US-UT)". **Show date** appends the short calendar date in parentheses at the very end, e.g. "...is in 3 days (6 Aug)" - left off on the event's own day, since the sentence there already ends "...is today". **Show location** / **Show time** / **Show description** each append an [embedded external calendar event's](#external-calendars) own location/time range/description into that same trailing parenthetical - see there for details. **Tap countdown for date** (off by default) makes just the countdown at the end of the sentence tappable, swapping "...is in 2 days" for "...is Mon, 3 Aug 2026" and back - in the header, a dot's tooltip, and the expanded list alike, each with its own state. Unlike **Show date**, this one works on the event's own day too, since "which day is 'today'?" is exactly what you'd tap to find out.
- **"More" button** (Layout → Timeline): the footer button next to "Details" runs its own configurable action - typically a Navigate action pointing at a dashboard using the full List layout - and is hidden entirely while left on "Nothing".
- **Design** tab (Layout → Design) lists this layout's own elements, and only while Timeline is the active layout style. **Header**, **Tooltip**, **List (Details)** and **Details / More button** each get a color and a font. **Timeline line** and **Divider line** each get a width, a style (solid, dashed or dotted) and a color – the second for the vertical line marking the boundary between past and future events, which is only drawn once past events are visible. Below them, [Design rows by event type](#row-colors) drives each type's dot and icon color on the axis, in the header and in the list, replacing the built-in default palette.

VIP, Important, and [to-do](#to-dos) badges each get their own Timeline-specific badge color (Layout → Highlight), independent from the List layout's own, since the two layouts render them differently: here a VIP star replaces the dot itself, while an Important exclamation mark sits immediately left of it and a to-do pin immediately right - versus a corner badge on the row icon in List. Only the active layout's color field is shown, since each one colors exactly one layout.

Everything above - per-event-type dot colors, header/tooltip/list fonts and colors, icons - is just as themeable as the classic List layout:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-timeline-example-3.gif" alt="Timeline layout with custom fonts, colors, and event type colors" width="45%">

### Row colors

Out of the box a row's color says how near its event is: ordinary rows take the **Accent** color, today's rows **Today**, and the next few days **Soon**. Everything below is a chain, each step overriding the one before it, so you can go as far as you want and stop:

1. **The card's own defaults** - what an untouched card renders in.
2. **Design** - the color of each element in a row (Layout → Design): the Icon block, the Accent bar, the name, the type, the countdown, and so on. Set here, it applies to every row.
3. **Event types** - switch on **Design rows by event type** (Layout → Design) and each type overrides Design for its own rows.
4. **Event status** - the **Past events**, **Today** and **Soon** blocks (Layout → Highlight) override both, for the rows in that state.

**Design rows by event type** gives every event type - and every [embedded calendar](#external-calendars), which belongs to its calendar rather than to a shared type - a block of its own. In the List layout each block carries four settings, every one behind its own switch so the block stays as short as what you actually use:

| Setting | Paints |
| --- | --- |
| **Whole row color** | the row's text, its icon and its accent bar together |
| **Accent bar color** | the [Accent bar](#row-columns) column only - listed while that column is in use |
| **Icon color** | the row's leading icon only |
| **Icon animation** | that type's icons - Pulse, Bounce, Shake, Spin or Flash |

The Timeline layout has no row to tint and no bar to color, so its blocks carry **Entry text color** (the header sentence and the event's line in the Details list), **Icon color** (the dot, and the glyphs in the header and Details list) and the same **Icon animation**.

Each color field is empty by default, meaning "this type's own color" - the one the Timeline draws its dots in - and each field's swatch previews that color, so an untouched row already shows what it will render as. Every embedded calendar starts on the color Home Assistant itself stores for that calendar entity, so two calendars are told apart before anything is configured.

**Event status** (Layout → Highlight) is the last word. Three blocks - **Past events**, **Today**, **Soon** - each with a **Background color** (a tint across the whole row), a **Whole text color**, an **Accent bar color**, an **Icon color** and an **Icon animation**. Each of the last four carries a plain on/off switch: off, the setting folds away and the row takes whatever applied before it - the event type's color where *Design rows by event type* is on, the Design default where it is not. Today and Soon start with their colors overridden, which is what makes them stand out; Past overrides nothing, and no status starts with an animation, since every animation starts at *None* and an open field that changes nothing is just a row in the way. The Timeline gets the same blocks, minus *Background color* and *Accent bar color* - it has neither.

### Icon animations

An icon can carry a looping animation - **Pulse**, **Bounce**, **Shake**, **Spin** or **Flash** - and it follows the same chain the colors do, so you can set one for the whole card and then override it where it matters:

1. **Layout → Design → Icon → Animation** sets one animation for every icon on the card.
2. Each **event type** can override it, on its own *Icon animation* row under [Design rows by event type](#row-colors) - as can each [embedded calendar](#external-calendars), under the same row.
3. Each **event status** can override both, on its own *Icon animation* row under Layout → Highlight.

All three apply in the List and Timeline layouts alike. Every step starts at *None*, so nothing animates until you ask for it - handy for making today's or upcoming events stand out at a glance:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/holiday_small_animated.gif" alt="Pulsing icon animation on an upcoming holiday" width="40%">

### Example configurations

A plain, unstyled card - just the defaults, letting the row highlighting (today/soon) and your Home Assistant theme do the work. Two existing Home Assistant calendars ("Personal" and "Kids") are embedded alongside Annuals' own events, with their own time/location/description shown instead of the calendar's name:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-example-1.png" alt="Annuals card, default styling" width="50%">

<details>
<summary>YAML</summary>

```yaml
type: custom:annuals-card
external_calendars:
  - calendar.personal
  - calendar.kids
show_type_calendar_name: false
show_type_time: true
show_type_location: true
show_type_description: true
```

</details>

A fully styled card - custom colors per row element, bold/uppercase/underlined fonts, highlight tints for past/today/soon, custom VIP/Important badge icons and colors, and a translucent background image:

<img src="https://raw.githubusercontent.com/somansch/annuals/main/docs/annuals-card-example-2.png" alt="Annuals card, fully styled" width="50%">

<details>
<summary>YAML</summary>

```yaml
type: custom:annuals-card
title: 🎉
count: 12
days_ahead: 10
days_past: 2
soon_days: 3
types:
  - birthday
  - name_day
  - wedding_anniversary
  - memorial
  - pet_birthday
  - work_anniversary
  - custom
highlight_soon: true
show_type: false
vip_badge_icon: mdi:account-star
important_badge_icon: mdi:account-alert
colors:
  today: "#e91e63"
  soon: "#ffeb3b"
  accent: "#607d8b"
  name: "#607d8b"
  badge: "#2196f3"
  when: "#9e9e9e"
  match_today: true
  highlight_past: "#9c27b0"
  highlight_today: "#4caf50"
  highlight_soon: "#ffeb3b"
  vip_badge: var(--primary-color)
  important_badge: "#795548"
font_sizes:
  name: 24px
  badge: 24px
  when: 20px
font_style:
  name:
    bold: true
    uppercase: true
    letter_spacing: 2px
  type:
    italic: true
  badge:
    italic: true
    underline: true
  when:
    bold: true
    italic: true
    letter_spacing: 1px
background:
  enabled: true
  color: "#03a9f4"
  image: /local/your-image.jpg
  size: contain
  opacity: 13
```

</details>

Both are set through the visual editor above - shown here as YAML just to make what each card actually changes easy to scan and copy. Every option not listed sits at its default, which is why the first card is six lines: the card only stores what you change. Anything left at its default inherits from your Home Assistant theme, per the CSS variables below.

### Theming with CSS variables

Every color, font size and font style the card's editor can set is also a CSS custom property, with a fallback chain ending at Home Assistant's own theme variables. So:

- Leaving a field **empty** in the card's editor lets it inherit from your **theme** (or any custom CSS) instead of a hardcoded value.
- Setting it in the editor overrides the theme for that one card, like any other per-card setting.

To theme every Annuals card at once, set these under a theme's `styles`, or globally via `card-mod`/custom CSS targeting `annuals-card`.

**Naming.** Every variable reads `--annuals-<scope>-<element>-<property>`:

| Part | Values |
| --- | --- |
| **scope** | `card` (the card as a whole), `row` (anything in a List row), `timeline` (the Timeline layout's own elements), `status` (the four colors both layouts share) |
| **element** | the field's own name, spelled out - `full-name-type-name`, `day-separator-label`, `vip-badge` |
| **property** | `color`, `background-color`, `size`, `weight`, `style`, `transform`, `decoration`, `spacing`, `width`, `image`, `opacity`, `repeat` |

#### Coming from 3.0.0

Every variable moved to the scheme above, so a theme written against 3.0.0 needs its Annuals names updated. Nothing about a card's own configuration changed and no card looks different - only the names a theme or `card-mod` rule targets. Where you stand:

| | |
| --- | --- |
| **83 names are unchanged** | every `--annuals-row-<field>-size` / `-weight` / `-style` / `-transform` / `-decoration` / `-spacing`, plus `--annuals-card-title-color` and the four Timeline text and line variables. Nothing to do. |
| **40 names changed** | listed below. |
| **125 names are new** | marked *3.1.0* in the reference tables further down. |

> **Two of them changed meaning, not just spelling.** In 3.0.0, `--annuals-vip-badge-color` and `--annuals-important-badge-color` painted the **disc** behind the badge, and the symbol on it was always white. In 3.1.0 both halves are separate, and the name without `background` is the **symbol**. So these two must become `--annuals-row-vip-badge-background-color` and `--annuals-row-important-badge-background-color` - note the **background** in the middle. Simply adding the `row` scope would leave you coloring the other half without noticing. The to-do badge is unaffected: its `-color` always meant the symbol, and still does.

<details>
<summary>All 40 renames</summary>

**The four status colors gain a `status` scope**

| 3.0.0 | 3.1.0 |
| --- | --- |
| `--annuals-accent-color` | `--annuals-status-accent-color` |
| `--annuals-soon-color` | `--annuals-status-soon-color` |
| `--annuals-today-color` | `--annuals-status-today-color` |

**The card's own title and background gain a `card` scope**

| 3.0.0 | 3.1.0 |
| --- | --- |
| `--annuals-bg-color` | `--annuals-card-background-color` |
| `--annuals-bg-image` | `--annuals-card-background-image` |
| `--annuals-bg-opacity` | `--annuals-card-background-opacity` |
| `--annuals-bg-repeat` | `--annuals-card-background-repeat` |
| `--annuals-bg-size` | `--annuals-card-background-size` |
| `--annuals-title-decoration` | `--annuals-card-title-decoration` |
| `--annuals-title-size` | `--annuals-card-title-size` |
| `--annuals-title-spacing` | `--annuals-card-title-spacing` |
| `--annuals-title-style` | `--annuals-card-title-style` |
| `--annuals-title-transform` | `--annuals-card-title-transform` |
| `--annuals-title-weight` | `--annuals-card-title-weight` |

**Row fields gain the `row` scope their font properties already had**

| 3.0.0 | 3.1.0 |
| --- | --- |
| `--annuals-badge-bg-color` | `--annuals-row-badge-background-color` |
| `--annuals-badge-color` | `--annuals-row-badge-color` |
| `--annuals-calendar-color` | `--annuals-row-calendar-color` |
| `--annuals-date-color` | `--annuals-row-date-color` |
| `--annuals-full-name-color` | `--annuals-row-full-name-color` |
| `--annuals-highlight-past-color` | `--annuals-row-highlight-past-color` |
| `--annuals-highlight-soon-color` | `--annuals-row-highlight-soon-color` |
| `--annuals-highlight-today-color` | `--annuals-row-highlight-today-color` |
| `--annuals-last-name-color` | `--annuals-row-last-name-color` |
| `--annuals-name-color` | `--annuals-row-name-color` |
| `--annuals-row-template` | `--annuals-row-grid-template` |
| `--annuals-row-text-decoration` | `--annuals-row-custom-text-decoration` |
| `--annuals-row-text-size` | `--annuals-row-custom-text-size` |
| `--annuals-row-text-spacing` | `--annuals-row-custom-text-spacing` |
| `--annuals-row-text-style` | `--annuals-row-custom-text-style` |
| `--annuals-row-text-transform` | `--annuals-row-custom-text-transform` |
| `--annuals-row-text-weight` | `--annuals-row-custom-text-weight` |
| `--annuals-text-color` | `--annuals-row-custom-text-color` |
| `--annuals-type-color` | `--annuals-row-type-color` |
| `--annuals-when-color` | `--annuals-row-when-color` |

**The Timeline's badges put the layout in front, like every other timeline variable**

| 3.0.0 | 3.1.0 |
| --- | --- |
| `--annuals-important-badge-timeline-color` | `--annuals-timeline-important-badge-color` |
| `--annuals-todo-badge-timeline-color` | `--annuals-timeline-todo-badge-color` |
| `--annuals-vip-badge-timeline-color` | `--annuals-timeline-vip-badge-color` |

**The two halves of a badge are now named for what they paint**

| 3.0.0 | 3.1.0 |
| --- | --- |
| `--annuals-important-badge-color` | `--annuals-row-important-badge-background-color` |
| `--annuals-todo-badge-color` | `--annuals-row-todo-badge-color` |
| `--annuals-vip-badge-color` | `--annuals-row-vip-badge-background-color` |

</details>

Where a row below lists a font's properties together (`-size` / `-weight` / …), each is a variable of its own, e.g. `--annuals-row-name-size` and `--annuals-row-name-weight`.

#### Reference

The **Since** column reads: **3.0.0** - this exact name has worked since 3.0.0; **3.0.0 · renamed** - the variable existed then under a different name, see the table above; **3.1.0** - new, there was nothing to set before. A row showing two releases has two halves that arrived at different times, and the badge rows are the ones to read carefully.

<details>
<summary>Card</summary>

| Variable | Affects | Falls back to | Since |
| --- | --- | --- | --- |
| `--annuals-card-title-color` | Card title text color | inherit | 3.0.0 |
| `--annuals-card-title-size` / `-weight` / `-style` / `-transform` / `-decoration` / `-spacing` | Card title font | `1.2em` / normal | 3.0.0 · renamed |
| `--annuals-card-no-events-color` | The ["no events" line](#custom-dashboard-card) | `--secondary-text-color` | 3.1.0 |
| `--annuals-card-no-events-size` / `-weight` / `-style` / `-transform` / `-decoration` / `-spacing` | That line's font | inherit / normal | 3.1.0 |
| `--annuals-card-background-color` / `-image` / `-size` / `-repeat` / `-opacity` | Card background | transparent / none | 3.0.0 · renamed |

</details>

<details>
<summary>Status - shared by both layouts</summary>

| Variable | Affects | Falls back to | Since |
| --- | --- | --- | --- |
| `--annuals-status-accent-color` | Events with no special status | `--primary-text-color` | 3.0.0 · renamed |
| `--annuals-status-today-color` | Today's events | `--error-color` | 3.0.0 · renamed |
| `--annuals-status-soon-color` | Events within the "soon" threshold | `--warning-color` | 3.0.0 · renamed |
| `--annuals-status-past-color` | Past events | `--secondary-text-color` | 3.1.0 |

</details>

<details>
<summary>Row - the List layout</summary>

| Variable | Affects | Falls back to | Since |
| --- | --- | --- | --- |
| `--annuals-row-icon-color` | One fixed color for every row icon | the row's own status color | 3.1.0 |
| `--annuals-row-name-color` + font | [Name column](#row-columns) | inherit / normal | 3.0.0 · renamed |
| `--annuals-row-last-name-color` + font | Last name column | inherit / normal | 3.0.0 · renamed |
| `--annuals-row-full-name-color` + font | Full name column | inherit / normal | 3.0.0 · renamed |
| `--annuals-row-type-color` + font | Type column | inherit / normal | 3.0.0 · renamed |
| `--annuals-row-info-name-color` / `--annuals-row-info-type-color` + fonts | The two lines inside **Name + Type** | inherit / normal | 3.1.0 |
| `--annuals-row-full-name-type-name-color` / `--annuals-row-full-name-type-type-color` + fonts | The two lines inside **Full name + Type** | inherit / normal | 3.1.0 |
| `--annuals-row-badge-color` / `--annuals-row-badge-background-color` + font | Occurrence badge, text and pill | inherit / `rgba(128, 128, 128, 0.25)` | 3.0.0 · renamed |
| `--annuals-row-when-color` + font | Countdown column | inherit / normal | 3.0.0 · renamed |
| `--annuals-row-date-color` + font | [Date column](#date-format) | inherit / normal | 3.0.0 · renamed |
| `--annuals-row-custom-text-color` + font | [Custom text column](#row-columns) | inherit / normal | 3.0.0 · renamed |
| `--annuals-row-date-block-weekday-color` / `-day-` / `-month-` + fonts | The [Date block](#row-columns)'s three lines | secondary / primary / secondary text color | 3.1.0 |
| `--annuals-row-accent-bar-color` / `-width` | The [Accent bar](#row-columns) column | the row's own color / `3px` | 3.1.0 |
| `--annuals-row-calendar-color` + font | Shared fallback for an [external calendar event](#external-calendars)'s own fields | `--secondary-text-color` | 3.0.0 · renamed |
| `--annuals-row-calendar-time-color` / `-location-` / `-description-` + fonts | Those three fields, each on its own | `--annuals-row-calendar-color` | 3.1.0 |
| `--annuals-row-highlight-past-color` / `-today-` / `-soon-` | Row tint per status | `--secondary-text-color` / the matching status color | 3.0.0 · renamed |
| `--annuals-row-vip-badge-color` / `-background-color` | VIP badge - the star, and the disc behind it | white / `--error-color` | 3.1.0 / 3.0.0 |
| `--annuals-row-important-badge-color` / `-background-color` | Important badge - glyph and disc | white / `--annuals-status-soon-color` | 3.1.0 / 3.0.0 |
| `--annuals-row-todo-badge-color` / `-background-color` | [To-do](#to-dos) pin - glyph and disc | `--error-color` / transparent | 3.0.0 / 3.1.0 |
| `--annuals-row-day-separator-color` / `-width` / `-style` | The [day separator](#day-week-and-month-separators) line | `--primary-text-color` / `1px` / dotted | 3.1.0 |
| `--annuals-row-week-separator-…` / `--annuals-row-month-separator-…` | The same three, per scale | dashed / solid | 3.1.0 |
| `--annuals-row-day-separator-label-color` / `-background-color` + font | That line's [label](#day-week-and-month-separators) and its plate | `--primary-text-color` / the card background / `0.75em` | 3.1.0 |
| `--annuals-row-week-separator-label-…` / `--annuals-row-month-separator-label-…` | The same, per scale | as above | 3.1.0 |

Three more are written by the card onto each row rather than read from a theme, and are listed only so a `card-mod` rule can read them: `--annuals-row-resolved-icon-color`, `--annuals-row-resolved-bar-color` and `--annuals-row-resolved-text-color` hold what that row actually resolved to after [the whole chain](#row-colors). Setting them from a theme has no effect.

</details>

<details>
<summary>Timeline</summary>

| Variable | Affects | Falls back to | Since |
| --- | --- | --- | --- |
| `--annuals-timeline-header-color` + font | Header sentence | inherit / normal | 3.0.0 |
| `--annuals-timeline-tooltip-color` + font | A dot's tooltip | `--secondary-text-color` / normal | 3.0.0 |
| `--annuals-timeline-list-color` + font | The expandable Details list | inherit / normal | 3.0.0 |
| `--annuals-timeline-button-color` + font | Details / More button | `--secondary-text-color` / normal | 3.0.0 |
| `--annuals-timeline-line-color` / `-width` / `-style` | The horizontal axis | `--divider-color` / `4px` / solid | 3.0.0 |
| `--annuals-timeline-divider-color` / `-width` / `-style` | The vertical past/future divider | `--divider-color` / `4px` / solid | 3.0.0 |
| `--annuals-timeline-vip-badge-color` / `--annuals-timeline-important-badge-color` / `--annuals-timeline-todo-badge-color` | VIP star / Important glyph / [to-do](#to-dos) pin, on the dots and in the header and Details list | `--error-color` / `--annuals-status-soon-color` / `--error-color` | 3.0.0 · renamed |

</details>

## Installation

### HACS (recommended)

Annuals is part of the default HACS integration list:

1. Open HACS in Home Assistant
2. Search for "Annuals"
3. Click the "Download" button
4. Restart HA

### Manual

Download `annuals.zip` from the [latest release](https://github.com/somansch/annuals/releases/latest) and extract its contents to the `config/custom_components/annuals` directory:

```bash
mkdir -p custom_components/annuals
cd custom_components/annuals
wget https://github.com/somansch/annuals/releases/latest/download/annuals.zip
unzip annuals.zip
rm annuals.zip
```

A manual install needs no separate Lovelace resource step for the [custom dashboard card](#custom-dashboard-card): it sits in the same tree, and the integration serves it itself on every startup.

## Help and Contribution

If you find a problem, feel free to open an issue and I will do my best to help. If you have something to contribute, your help is greatly appreciated! If you want to add a new feature, please open a pull request first so we can discuss the details.

---

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/somansch)
