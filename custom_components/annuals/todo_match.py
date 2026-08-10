"""Matching open to-do items to Annuals events, for the "todo" sensor attribute.

This is the server-side counterpart of the dashboard card's own matcher (see
matchTodoItems in frontend/annuals-card.js) and deliberately scores exactly
the same way, so a badge on the card and a `todo: true` attribute never
disagree about the same item. The two can't share one implementation: the
card needs each matched item's own uid/list to offer ticking it off, while
the sensor only ever publishes a boolean - but any change to the scoring
here has to be mirrored there (and vice versa).
"""

from __future__ import annotations

import functools
import logging
import re
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    CONF_HUB,
    CONF_TODO_LISTS,
    DATA_SENSORS,
    DATA_TODO_DEBOUNCER,
    DATA_TODO_MATCHES,
    DATA_TODO_UNSUB,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

# How much of the event is echoed in an item's own text. Weighted so a more
# specific hit always outranks any combination of vaguer ones (8 > 4+2+1),
# making "Anna Miller" beat a mere type-and-number coincidence rather than
# letting three weak signals outvote one strong one.
_SCORE_FULL_NAME = 8
_SCORE_NAME = 4
_SCORE_TYPE = 2
_SCORE_OCCURRENCE = 1


def _due_date(item: dict[str, Any]) -> str | None:
    """An item's due date as a plain YYYY-MM-DD string, or None if it has none.

    todo.get_items reports `due` as either a date or a datetime depending on
    how the item was created; only the date part is ever compared, since an
    Annuals event has no time of day of its own.
    """
    due = item.get("due")
    if not due:
        return None
    return str(due)[:10]


def _score(event: dict[str, Any], due: str | None, haystack: str) -> int | None:
    """How well one item fits one event, or None if it can't fit at all.

    The due date is a gate rather than a score: an item with no due date, or
    one due on a different day than the event's next occurrence, is never
    that event's, however much of its text happens to match.
    """
    next_date = event.get("next_date")
    if not next_date or due != next_date:
        return None
    score = 0
    full_name = (event.get("full_name") or "").lower()
    name = (event.get("name") or "").lower()
    type_label = (event.get("type_label") or "").lower()
    occurrence = event.get("occurrence_number")
    if full_name and full_name in haystack:
        score += _SCORE_FULL_NAME
    if name and name in haystack:
        score += _SCORE_NAME
    if type_label and type_label in haystack:
        score += _SCORE_TYPE
    if occurrence is not None and re.search(rf"\b{occurrence}\b", haystack):
        score += _SCORE_OCCURRENCE
    return score


def match_todo_items(
    events: list[dict[str, Any]], items: list[dict[str, Any]]
) -> set[str]:
    """The entity ids of every event with at least one open item matched to it.

    Each item goes to its single best-fitting event. A tie is deliberately
    left unmatched rather than broken arbitrarily: "Buy a gift" due on a day
    two events share says nothing about which one it belongs to, and guessing
    would put a `todo: true` on an event nobody meant.
    """
    matched: set[str] = set()
    for item in items:
        due = _due_date(item)
        if due is None:
            continue
        haystack = f"{item.get('summary') or ''} {item.get('description') or ''}".lower()
        best_entity: str | None = None
        best_score = -1
        tied = False
        for event in events:
            score = _score(event, due, haystack)
            if score is None:
                continue
            if score > best_score:
                best_entity, best_score, tied = event["entity_id"], score, False
            elif score == best_score:
                tied = True
        if best_entity is not None and not tied:
            matched.add(best_entity)
    return matched


async def async_fetch_todo_items(
    hass: HomeAssistant, entity_ids: list[str]
) -> list[dict[str, Any]]:
    """Every still-open item across the configured lists, as plain dicts.

    One call for all lists rather than one per list - todo.get_items already
    accepts several targets and returns them keyed by entity id, which is
    then flattened since the matching doesn't care which list an item is on.
    """
    if not entity_ids:
        return []
    try:
        response = await hass.services.async_call(
            "todo",
            "get_items",
            {"status": "needs_action"},
            target={"entity_id": entity_ids},
            blocking=True,
            return_response=True,
        )
    except Exception:  # noqa: BLE001 - a missing/misbehaving list must not
        # take the sensors down with it; every event simply reads as having
        # no open to-do until the next refresh.
        _LOGGER.warning(
            "Annuals: could not read to-do items from %s", ", ".join(entity_ids), exc_info=True
        )
        return []
    items: list[dict[str, Any]] = []
    for result in (response or {}).values():
        items.extend((result or {}).get("items") or [])
    return items


async def async_refresh_todo_matches(hass: HomeAssistant) -> None:
    """Recompute the whole match map and push it into every event sensor.

    Runs on a to-do list change, at midnight (the due-date gate is relative
    to each event's next occurrence, which rolls over then), and whenever the
    configured lists change - never from a sensor's own update, which reads
    the map this leaves behind rather than producing it.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    sensors = list(domain_data.get(DATA_SENSORS, ()))
    entity_ids = configured_todo_lists(hass)
    items = await async_fetch_todo_items(hass, entity_ids)

    # Read off the sensors' own already-computed attributes rather than
    # recomputing dates/names here - they're the same values the card matches
    # against, and keeping one source avoids the two drifting apart.
    events = [
        {"entity_id": sensor.entity_id, **(sensor.extra_state_attributes or {})}
        for sensor in sensors
    ]
    matched = match_todo_items(events, items)
    previous: set[str] = domain_data.get(DATA_TODO_MATCHES) or set()
    domain_data[DATA_TODO_MATCHES] = matched
    _LOGGER.debug(
        "Annuals: %d open to-do item(s) across %d list(s) matched %d event(s)",
        len(items),
        len(entity_ids),
        len(matched),
    )

    # Only the sensors whose answer actually changed are rewritten - a
    # to-do list ticking over otherwise re-renders every event in the system
    # for nothing.
    for sensor in sensors:
        if (sensor.entity_id in matched) != (sensor.entity_id in previous):
            sensor.async_schedule_update_ha_state(force_refresh=True)


def configured_todo_lists(hass: HomeAssistant) -> list[str]:
    """The todo.* entity ids picked in Annuals Settings, or [] if none are."""
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.data.get(CONF_HUB):
            return list(entry.options.get(CONF_TODO_LISTS) or [])
    return []


@callback
def async_request_todo_refresh(hass: HomeAssistant) -> None:
    """Ask for a refresh, coalescing bursts into one run.

    Setting up a config entry is the noisy caller here: a holiday import
    creates dozens of them back to back, and each one's sensor would
    otherwise trigger its own full re-match against every list.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    debouncer = domain_data.get(DATA_TODO_DEBOUNCER)
    if debouncer is None:
        debouncer = Debouncer(
            hass,
            _LOGGER,
            cooldown=5,
            immediate=False,
            function=functools.partial(async_refresh_todo_matches, hass),
        )
        domain_data[DATA_TODO_DEBOUNCER] = debouncer
    hass.async_create_task(debouncer.async_call())


@callback
def async_setup_todo_tracking(hass: HomeAssistant) -> None:
    """(Re)attach the listener watching the configured to-do lists.

    Called on hub setup and again whenever the list selection changes (see
    config_flow.async_step_todo_lists), so switching lists takes effect
    immediately rather than at the next restart. A to-do entity rewrites its
    state on any item change, so one state-change listener covers adding,
    completing, retitling, and re-dating an item alike.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    unsub = domain_data.pop(DATA_TODO_UNSUB, None)
    if unsub is not None:
        unsub()

    entity_ids = configured_todo_lists(hass)
    if entity_ids:
        domain_data[DATA_TODO_UNSUB] = async_track_state_change_event(
            hass, entity_ids, functools.partial(_async_todo_state_changed, hass)
        )
    # Requested even with nothing configured, so clearing the selection
    # clears every "todo" attribute back to False rather than freezing the
    # last answer in place.
    async_request_todo_refresh(hass)


@callback
def _async_todo_state_changed(hass: HomeAssistant, _event) -> None:
    async_request_todo_refresh(hass)
