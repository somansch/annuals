# Changelog

All notable changes to this integration are documented here.

## Unreleased

Added a custom Lovelace card (`custom:annuals-card`) bundled directly with the integration - no separate HACS frontend package or manual "Add resource" step. Shows a "today" highlight plus a sortable upcoming-events list (icon, name, type, countdown, occurrence number), fully configurable through a visual editor (title, count, days-ahead cutoff, event-type filter, colors, font sizes). The card's own text follows the viewing user's profile language (English and German so far). Colors and font sizes can also be set once, integration-wide, via theme-level CSS variables (`--annuals-today-color`, `--annuals-soon-color`, `--annuals-accent-color`, `--annuals-title-size`, `--annuals-list-size`).

## v1.0.0

Initial release
