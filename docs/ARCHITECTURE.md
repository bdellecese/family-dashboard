# Family Dashboard Architecture

## Purpose

This document describes the architecture that exists in the repository today. It is a code-verified source of truth for Step 1 of the dashboard work: reconcile documentation with the running code before defining future requirements or evaluating replacement platforms.

It deliberately distinguishes between components that exist in the repository, components that are registered/configured, and components that are actually used by the current rotating dashboard.

## Technology

- HTML/CSS
- Vanilla JavaScript using ES modules
- Node.js HTTP server
- Browser APIs
- External APIs and RSS feeds
- No frontend build/bundling step

The repository's runtime application entry point is `app/dashboard.js`. The Node server is `server/server.js`.

## Runtime Architecture

```text
Browser / Chromium
        |
        v
index.html
        |
        v
app/dashboard.js
        |
        +--> dashboard scaling
        +--> widget registration
        +--> screen manager
                 |
                 v
          config/screens.js
                 |
                 v
          app/screen-manager.js
                 |
                 +--> widget-loader
                 |       |
                 |       v
                 |    widgets/*
                 |
                 +--> services / browser APIs

Node.js server: server/server.js
        |
        +--> static dashboard files
        +--> Google Calendar
        +--> Todoist
        +--> iCloud Photos
        +--> Sonos
        +--> School Lunch
        +--> MLB / NFL / Soccer
        +--> RSS
        +--> Commute
        +--> Performance API
```

The browser and server are therefore separate layers, but they are part of one application. Widgets may obtain data through browser-accessible services, local/configuration data, or `/api/*` endpoints provided by the Node server.

## Repository Structure

The current top-level structure is:

```text
index.html
app/
assets/
config/
css/
docs/
scripts/
server/
services/
tests/
widgets/
package.json
package-lock.json
```

**Important correction:** application JavaScript is under `app/`, not `js/`. The older documentation's `js/` tree is stale.

## Application Startup

`app/dashboard.js` initializes dashboard scaling, registers the widget registry, and starts screen rotation after DOM content is ready.

```text
index.html
   |
   v
app/dashboard.js
   |
   +--> initializeDashboardScaling()
   +--> registerWidgets()
   +--> startScreenRotation()
```

Startup performance timers are also invoked, but browser performance event recording is currently inactive scaffolding; see Performance below.

## Screens

Screen definitions live in `config/screens.js`.

Current normal rotation order:

1. `information` — 60 seconds
2. `calendar` — 60 seconds
3. `chores-fun` — 60 seconds
4. `sports` — 90 seconds

`distraction-free` is defined but is **not** in `screenOrder`, so it is not part of normal automatic rotation.

Each screen defines its layout, theme, duration, and region/widget configuration.

### Screen loading

`app/screen-manager.js` builds a requested screen in a detached DOM structure and commits it only after the screen generation is still current. Previous widgets are destroyed after the new screen becomes visible.

The generation mechanism protects against stale asynchronous loads replacing a newer screen. This is an important runtime behavior and should be preserved in future architecture work.

### Current screens

**Information** uses date/time, photo, weather alerts, calendar list, calendar, news, countdown, prayer list, Wi-Fi, weather, Sonos status, family menu, and commute.

**Calendar** uses the `large-calendar` widget with the configured family/sports/holiday calendars.

**Chores + Fun** uses the `text`, `kids-chores`, `household-chores`, `school-lunch`, `playing-time`, `on-this-day`, `did-you-know`, `word-of-day`, `quote-of-day`, and `dad-wisdom` widgets.

**Sports** uses MLB/sports scoreboard and standings, a generic `news` widget configured with sports RSS feeds, sports trivia, sports legends, and a sports calendar list.

## Widget Registry

Widgets are registered by `app/register-widgets.js` and loaded dynamically by `app/widget-loader.js`.

There are currently **29 registered widgets**:

```text
date-time
weather
weather-alerts
calendar
large-calendar
calendar-list
commute
countdown
news
prayer-list
family-menu
wifi
photo
sonos-status
sports-scoreboard
sports-standings
sports-trivia
sports-legends
kids-chores
household-chores
school-lunch
playing-time
on-this-day
did-you-know
word-of-day
quote-of-day
dad-wisdom
text
greeting
```

The repository also contains `sports-news` and `on-this-day-sports` directories, but neither is registered. They must not be treated as active dashboard widgets. The current Sports screen uses the generic `news` widget for sports news.

## Widget Lifecycle

The widget loader expects a widget to expose a default object with a name and render function. Widgets receive a target container and configuration. Widgets may expose cleanup behavior used during screen transitions.

Conceptually:

```text
load widget
    |
    v
render(container, config)
    |
    v
active
    |
    v
destroy()
```

Widgets should remain scoped to their supplied container and avoid directly controlling unrelated dashboard regions.

## Data and Service Architecture

The repository contains a substantial `services/` layer. Services are not all equivalent: some are browser-side data modules, some are server-side integrations, and some are local/content providers.

Active server integrations verified in `server/server.js` include:

- Google Calendar
- Todoist
- iCloud Photos
- Sonos
- School Lunch
- MLB
- NFL
- Soccer
- Performance storage/API
- RSS
- Commute

The repository also contains service modules for local/content capabilities such as Dad Wisdom, Did You Know, On This Day, Quote of the Day, Sports Legends, Sports Trivia, Word of Day, and dashboard scaling. A service directory's existence alone does not establish that it is active in the current rotating dashboard.

The `services/on-this-day-sports` module is a concrete example of a repository component that exists but is not currently wired into the registered widget/screen path.

## Server

`server/server.js` is a custom Node `http.createServer()` implementation. It listens on `0.0.0.0:3000` and serves both API responses and static dashboard files.

It is not an Express application.

The server currently provides these API routes:

| Area | Endpoint | Method |
|---|---|---|
| Health | `/api/health` | GET |
| MLB scoreboard | `/api/sports/mlb/scoreboard` | GET |
| MLB postseason | `/api/sports/mlb/postseason` | GET |
| Soccer scoreboard | `/api/sports/soccer/scoreboard` | GET |
| Soccer standings | `/api/sports/soccer/standings` | GET |
| NFL scoreboard | `/api/sports/nfl/scoreboard` | GET |
| NFL standings | `/api/sports/nfl/standings` | GET |
| School lunch | `/api/school-lunch` | GET |
| Commute | `/api/commute` | GET |
| Photos | `/api/photos` | GET |
| Sonos | `/api/sonos` | GET |
| Google Calendar auth | `/api/google-calendar/auth` | GET |
| Google Calendar callback | `/api/google-calendar/callback` | GET |
| Google Calendar status | `/api/google-calendar/status` | GET |
| Google calendars | `/api/google-calendar/calendars` | GET |
| Google events | `/api/google-calendar/events` | GET |
| Todoist tasks | `/api/todoist/tasks` | GET |
| Complete Todoist task | `/api/todoist/tasks/:id/complete` | POST |
| Performance | `/api/performance` | GET/POST/DELETE |
| RSS | `/api/rss` | GET |

The server's JSON responses currently permit CORS with `*`.

### Sports API behavior

The MLB scoreboard has special postseason logic. When postseason games exist for the requested date, the response supplies postseason game data and series status rather than applying the normal favorite-team featured-card model. Regular-season MLB requests support configured primary and secondary teams.

The soccer scoreboard resolves configured favorite teams and also derives favorite competitions to populate `otherGames`. This is the current implementation behind the Sports screen's soccer data model.

## External Data Boundaries

The architecture should preserve the distinction between:

1. **Browser-local data** — browser APIs or configuration.
2. **Shared services** — reusable data/service modules.
3. **Server APIs** — integrations that require credentials, authentication, server-side processing, or centralized normalization.
4. **External providers** — Google Calendar, Todoist, sports providers, RSS feeds, Open-Meteo/NWS, Sonos, iCloud, etc.

This boundary is more accurate than describing every widget as following a single widget → service → external API path.

## Performance

The application contains performance instrumentation scaffolding in `app/performance.js` and server-side performance endpoints.

However, browser-side `recordPerformanceEvent()` is currently a stub that returns without recording an event. Therefore the project should currently be documented as having **performance instrumentation scaffolding, not active performance telemetry/monitoring**.

The server-side performance API exists and supports retrieval, recording, and clearing of performance events.

## Configuration and Secrets

Runtime behavior is substantially configuration-driven. Important configuration areas include:

- screen definitions and order
- sports preferences and registries
- calendar configuration
- commute configuration
- Todoist configuration
- Google Calendar configuration/authentication
- other widget/service-specific configuration

The repository's `.gitignore` explicitly excludes local credentials/configuration and generated data, including `config/todoist.js`, `config/google-calendar.js`, `config/google-calendar-token.json`, `config/google-routes.js`, school-lunch data, sports data, and dashboard performance data. `node_modules/` and macOS `.DS_Store` are also ignored.

`config/config.js` currently contains a Google OAuth client ID and a local-network callback URL. The client ID is not a client secret, but the callback URL makes the repository configuration environment-specific. Authentication tokens and other credential-bearing files are intentionally excluded by `.gitignore`.

## Testing

`package.json` defines a `test` script that is currently only the placeholder `echo "Error: no test specified"` and therefore is **not a real test runner**.

There are nevertheless four standalone test files in `tests/`:

```text
tests/commute-test.js
tests/google-routes-test.js
tests/soccer-data-test.js
tests/soccer-espn-test.js
```

These tests are not wired into `npm test`. The existing test suite therefore represents useful standalone verification code, but the repository does not currently provide a single canonical automated test command through `package.json`.

## Scripts

The repository contains:

- `scripts/cleanup-mlb-cache.js` — maintenance for MLB cache data.
- `scripts/display-schedule.sh` — display scheduling helper.

These scripts indicate operational tooling exists in the repository, but they do not by themselves prove how the production host currently schedules or launches the application.

## Deployment / Runtime

The code-level application runtime is verified as:

```text
Node.js
  -> server/server.js
  -> 0.0.0.0:3000
  -> static dashboard + /api/*

Chromium/browser
  -> index.html
  -> app/dashboard.js
```

Repository searches did not find Docker, PM2, or systemd deployment artifacts. That means those mechanisms should currently be treated as **not documented/verified in the repository**, not as proof that they are absent from the actual host.

Likewise, the repository contains `display-schedule.sh`, but system-level kiosk, startup, display, and scheduling settings remain outside the verified code-level architecture unless separately inspected on the deployment host.

## Error and Failure Model

The server generally catches integration errors and returns controlled JSON error responses rather than terminating the process. Screen loading also has generation-based protection and widget cleanup.

Future work should preserve graceful degradation: failure of one integration should not unnecessarily destroy unrelated dashboard functionality.

## Step 1 Boundary

This document is intentionally a description of the **current implementation**, not a target architecture.

The next phase should define what the dashboard is actually required to do. Only after those requirements are agreed should we evaluate which capabilities should remain custom, which should be delegated to a platform such as Home Assistant, and what the future architecture should look like.
