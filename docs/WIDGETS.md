# Dashboard Widgets

This document is a code-verified inventory of the dashboard widgets. It distinguishes registered widgets from repository components that are present but not currently registered or used by the rotating screens.

## Widget Contract

Widgets are dynamically loaded by `app/widget-loader.js` and registered by `app/register-widgets.js`.

The expected widget shape is a default-exported object with a `name` and `render()` function. Widgets receive a target container and configuration. Widgets should remain scoped to that container. Widgets that create ongoing resources may provide cleanup behavior used during screen transitions.

The effective data path varies by widget. Depending on implementation, a widget may use browser APIs, configuration/local data, a shared service, or a Node `/api/*` endpoint. The older one-size-fits-all `widget -> data service -> external API` description is therefore only a common pattern, not a universal contract.

## Current Registered Inventory

There are **29 registered widgets** in `app/register-widgets.js`:

| Widget | Current use | Data / integration class | Status |
|---|---|---|---|
| date-time | Information | Browser date/time | Registered and used |
| weather | Information; Distraction-free | Open-Meteo / browser-side service | Registered and used |
| weather-alerts | Information | NWS/Open-Meteo | Registered and used |
| calendar | Information | Google Calendar | Registered and used |
| large-calendar | Calendar | Google Calendar / weather | Registered and used |
| calendar-list | Information; Sports | Google Calendar | Registered and used |
| commute | Information; Distraction-free | Calendar / Google Routes | Registered and used |
| countdown | Information | Configuration/data | Registered and used |
| news | Information; Sports | RSS | Registered and used |
| prayer-list | Information | Configuration/data | Registered and used |
| family-menu | Information | Configuration/data | Registered and used |
| wifi | Information | Configuration/browser | Registered and used |
| photo | Information | iCloud Photos | Registered and used |
| sonos-status | Information | Sonos | Registered and used |
| sports-scoreboard | Sports | Sports APIs | Registered and used |
| sports-standings | Sports | Sports APIs | Registered and used |
| sports-trivia | Sports | Local data | Registered and used |
| sports-legends | Sports | Local data/service | Registered and used |
| kids-chores | Chores + Fun | Configuration/data | Registered and used |
| household-chores | Chores + Fun | Configuration/data | Registered and used |
| school-lunch | Chores + Fun | Server/API | Registered and used |
| playing-time | Chores + Fun | Configuration/data | Registered and used |
| on-this-day | Chores + Fun | Local data/service | Registered and used |
| did-you-know | Chores + Fun | Local data/service | Registered and used |
| word-of-day | Chores + Fun | Local data/service | Registered and used |
| quote-of-day | Chores + Fun | Local data/service | Registered and used |
| dad-wisdom | Chores + Fun | Local data/service | Registered and used |
| text | Chores + Fun | Configuration | Registered and used |
| greeting | Distraction-free only | Configuration | Registered; not in rotating screen order |

## Registered vs. Active

The normal rotating screens are `information`, `calendar`, `chores-fun`, and `sports`.

`greeting` is registered and is referenced by the `distraction-free` screen, but `distraction-free` is not included in `screenOrder`. Therefore `greeting` is not part of normal automatic rotation.

## Orphaned / Unregistered Widget Components

The repository contains components named `sports-news` and `on-this-day-sports`, but they are not registered by `app/register-widgets.js` and are not referenced by the current rotating screen configuration. The Sports screen currently uses the generic `news` widget with sports RSS feeds.

These components should be treated as **orphaned/unregistered**, not as active widgets, until deliberately reintroduced.

## Screen Usage Summary

### Information

- date-time
- photo
- weather-alerts
- calendar-list
- calendar
- news
- countdown
- prayer-list
- wifi
- weather
- sonos-status
- family-menu
- commute

### Calendar

- large-calendar

### Chores + Fun

- text
- kids-chores
- household-chores
- school-lunch
- playing-time
- on-this-day
- did-you-know
- word-of-day
- quote-of-day
- dad-wisdom

### Sports

- sports-scoreboard
- sports-standings
- news (sports RSS configuration)
- sports-trivia
- sports-legends
- calendar-list (sports calendar configuration)

### Distraction-free

Defined in configuration but excluded from normal rotation:

- greeting
- weather
- commute
- calendar-list

## Notes for Future Reconciliation

- A directory under `widgets/` or `services/` is not by itself proof of active runtime use.
- Registration does not by itself prove that a widget is on a rotating screen.
- Screen configuration is the authoritative source for normal dashboard composition.
- `app/register-widgets.js` is the authoritative source for the registered widget set.
- The server route/service implementation is authoritative for server-backed integrations.
- Detailed per-widget behavior should be updated only when verified against the corresponding implementation.
