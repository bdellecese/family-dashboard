# Dashboard Architecture

## Overview

This project is a touchscreen information dashboard designed to run on a Raspberry Pi and display information across multiple screens.

Development is performed on a desktop using VS Code. The production environment runs on a Raspberry Pi connected to a dedicated display.

The dashboard is built using:

- HTML
- CSS
- Vanilla JavaScript
- ES modules
- Node.js
- External web APIs
- Browser-based rendering

There is no Node.js build process or bundler. Node.js is used as the production application server and for server-side services that require credentials or authentication that should not be exposed to the browser.

The production environment consists of:

```text
Raspberry Pi
    |
    +-- Node.js application server
    |       |
    |       +-- Dashboard static files
    |       +-- Server-side API services
    |
    +-- LabWC desktop session
    |       |
    |       +-- Chromium kiosk
    |
    +-- Physical display
```

---

# High-Level Architecture

The dashboard is organized around four primary concepts:

1. Dashboard
2. Screens
3. Regions
4. Widgets

The general application flow is:

```text
Dashboard
    |
    v
Screen Manager
    |
    v
Screen
    |
    v
Region
    |
    v
Widget
    |
    v
Data Service
    |
    +-- Browser-accessible external API
    |
    +-- Node.js server API
```

Some services communicate directly with external APIs from the browser.

Services requiring protected credentials, persistent authentication, or server-side processing communicate through the Node.js application server.

---

# Project Structure

The project currently follows this general structure:

```text
/
|
+-- index.html
|
+-- server/
|   |
|   +-- server.js
|
+-- config/
|   |
|   +-- config.js
|   +-- screens.js
|   +-- google-calendar-token.json
|   +-- ...
|
+-- css/
|
+-- js/
|   |
|   +-- dashboard.js
|   +-- screen-manager.js
|   +-- widget-loader.js
|   +-- register-widgets.js
|   +-- ...
|   |
|   +-- screens/
|   |
|   +-- layouts/
|
+-- services/
|   |
|   +-- weather/
|   +-- google-calendar/
|   |   |
|   |   +-- calendar-auth.js
|   |   +-- calendar-data.js
|   |   +-- google-calendar-server.js
|   |
|   +-- dashboard/
|   +-- ...
|
+-- scripts/
|   |
|   +-- display-schedule.sh
|
+-- widgets/
|   |
|   +-- date-time/
|   +-- weather/
|   +-- weather-alerts/
|   +-- calendar/
|   +-- calendar-list/
|   +-- countdown/
|   +-- news/
|   +-- prayer-list/
|   +-- family-menu/
|   +-- wifi/
|   +-- photo/
|   +-- ...
|
+-- docs/
|   |
|   +-- architecture.md
```

The exact directory contents may evolve as additional screens, widgets, and services are added.

---

# Dashboard Entry Point

The dashboard application starts through:

```text
dashboard.js
```

The dashboard performs three primary tasks:

1. Initialize dashboard scaling.
2. Register available widgets.
3. Start the screen manager.

The current startup flow is:

```text
dashboard.js
    |
    +-- initializeDashboardScaling()
    |
    +-- registerWidgets()
    |
    +-- startScreenRotation()
```

The dashboard itself should remain lightweight.

Application behavior belongs in the appropriate manager, widget, or service rather than being implemented directly in `dashboard.js`.

---

# Production Server

The Raspberry Pi uses a Node.js application server to serve the dashboard and provide server-side API endpoints.

The primary server is:

```text
server/server.js
```

The server listens on:

```text
http://0.0.0.0:3000
```

The dashboard is accessed locally by Chromium at:

```text
http://localhost:3000
```

The Node server provides two primary functions:

1. Serve the dashboard application.
2. Provide server-side APIs for services that should not communicate directly with external APIs from the browser.

The Node server is managed by `systemd`.

The production service is:

```text
family-dashboard.service
```

The service is enabled at boot and runs as the appropriate Raspberry Pi service.

The expected process is:

```text
Raspberry Pi boot
    |
    v
systemd
    |
    v
family-dashboard.service
    |
    v
Node.js
    |
    v
server/server.js
    |
    v
localhost:3000
```

The Node server should automatically restart if it exits unexpectedly, subject to the configuration of the systemd service.

---

# Raspberry Pi Deployment

The production environment is:

```text
Raspberry Pi
    |
    +-- Debian Linux
    |
    +-- systemd
    |      |
    |      +-- family-dashboard.service
    |
    +-- LabWC desktop session
    |
    +-- Chromium
           |
           v
     http://localhost:3000
```

The Raspberry Pi is intended to operate as a dedicated appliance rather than as a general-purpose desktop computer.

The dashboard should therefore start automatically after boot without requiring manual intervention.

---

# Chromium Kiosk

Chromium is used as the dashboard display application.

The browser is launched in kiosk mode using:

```text
/usr/bin/chromium
```

The current production browser configuration includes:

```text
--ozone-platform=wayland
--kiosk
--noerrdialogs
--disable-infobars
--start-maximized
--password-store=basic
http://localhost:3000
```

The `--ozone-platform=wayland` option is required for the current Raspberry Pi / LabWC environment.

The `--password-store=basic` option prevents Chromium from attempting to create or unlock a desktop keyring for the dashboard application.

The browser is launched by:

```text
scripts/display-schedule.sh
```

rather than relying exclusively on the LabWC autostart command.

---

# Display Scheduling

The physical dashboard display is intended to operate only during defined morning and afternoon/evening periods.

Display scheduling is implemented by:

```text
scripts/display-schedule.sh
```

The script determines the current day and time and starts or stops Chromium accordingly.

The current schedule is:

## Monday-Friday

### Morning

```text
06:00 - 09:00
```

### Afternoon / Evening

```text
15:00 - 20:00
```

## Saturday-Sunday

### Morning

```text
07:00 - 09:00
```

### Afternoon / Evening

```text
16:00 - 18:00
```

The display is considered ON during the defined intervals and OFF outside those intervals.

The schedule is intentionally implemented in the script rather than duplicating scheduling logic across multiple cron entries.

---

# Display Schedule Architecture

The display scheduling flow is:

```text
LabWC session
    |
    v
display-schedule.sh
    |
    +-- Determine day
    |
    +-- Determine current time
    |
    +-- Should display be ON?
             |
             +-- YES --> Start Chromium
             |
             +-- NO  --> Stop Chromium
```

The script can be safely run repeatedly because it first determines whether Chromium is already running.

If Chromium is already running during an ON period, it does not launch another instance.

If Chromium is not running during an ON period, it launches Chromium.

If the current time is outside the scheduled period, Chromium is terminated.

---

# Display Scheduling and Cron

The display schedule is periodically evaluated by the `pi` user's cron configuration.

The cron job invokes:

```text
/home/pi/family-dashboard/scripts/display-schedule.sh
```

Output is redirected to:

```text
/tmp/family-dashboard-schedule.log
```

Cron is used to periodically enforce the desired display state rather than creating a separate cron entry for every ON and OFF event.

This makes the scheduling logic centralized in the script.

For example, if the Pi is rebooted during an active display period, the scheduling script can detect that the display should be ON and launch Chromium.

Likewise, if the Pi remains running across a scheduled OFF period, the script will terminate Chromium.

---

# LabWC Autostart

The Raspberry Pi uses LabWC as its desktop environment.

The LabWC autostart file is:

```text
~/.config/labwc/autostart
```

The current configuration launches:

```text
/home/pi/family-dashboard/scripts/display-schedule.sh &
```

This allows the display schedule to be evaluated when the graphical session starts.

The Node.js application server is intentionally not launched from LabWC.

Node.js is a system-level service managed by `systemd`.

This separation is important:

```text
systemd
    |
    +-- Node.js server
    |
    v
localhost:3000


LabWC
    |
    +-- display-schedule.sh
            |
            v
        Chromium
            |
            v
        localhost:3000
```

---

# Screen Architecture

Screens represent complete dashboard pages.

Examples currently include:

- Information
- Large Calendar (planned / next major screen)

A screen defines:

- Its layout
- Its theme
- Its duration
- Its regions
- The widgets displayed in those regions

## Screen Configuration

Screens are configuration-driven.

Example:

```text
information: {

    layout: "information-layout",

    theme: "dark",

    duration: {
        minutes: 20
    },

    regions: {

        "left-panel": [
            {
                name: "date-time"
            },
            {
                name: "photo"
            },
            {
                name: "weather-alerts"
            }
        ]

    }

}
```

This allows screens to be changed without modifying the underlying widget implementation.

---

# Screen Manager

The screen manager is responsible for:

- Determining which screen is currently active
- Building the screen
- Loading its regions
- Loading the widgets within those regions
- Managing screen duration
- Advancing between screens

The screen manager should be the central authority for screen navigation.

Widgets should not directly control which screen is displayed.

## Future Navigation

The screen manager will eventually support both:

```text
Automatic rotation
      |
      v
Next screen
```

and:

```text
Touchscreen
   |
   +-- Previous
   |
   +-- Next
   |
   +-- Home
```

Both mechanisms should use the same screen navigation functions.

---

# Region Architecture

Regions define areas of a screen's layout.

Examples include:

- left-panel
- right-panel
- right-top
- right-bottom
- weather-column
- prayer-column
- menu-column

Regions may contain:

- A single widget
- Multiple widgets
- Nested regions

The screen manager is responsible for resolving the region configuration and passing the appropriate container to each widget.

---

# Widget Architecture

Widgets are independent UI components.

A widget normally exports a default object containing:

- `name`
- `render()`

Example:

```text
const exampleWidget = {

    name: "example",

    async render(
        container,
        config = {}
    ) {

        // Render widget

    }

};

export default exampleWidget;
```

The widget loader dynamically loads the widget module and calls:

```text
render(
    container,
    config
)
```

This creates a consistent contract across widgets.

---

# Widget Configuration

Widgets should use configuration supplied by the screen configuration whenever practical.

Example:

```text
{
    name: "weather",

    config: {

        location: "Holden, MA"

    }
}
```

The widget should not hard-code user-specific configuration if that value can reasonably be supplied through configuration.

## Configuration Principle

Configuration should flow:

```text
Screen Configuration
        |
        v
    Widget Loader
        |
        v
      Widget
        |
        v
    Data Service
```

This keeps widgets reusable.

---

# Data Services

Widgets should not contain large amounts of API-specific logic when that logic can be isolated into a service.

The preferred architecture is:

```text
Widget
  |
  v
Data Service
  |
  +-- Browser-accessible API
  |
  +-- Node.js server API
```

For example:

```text
weather-alerts
      |
      v
weather-alert-data.js
      |
      v
Open-Meteo
      |
      v
National Weather Service
```

For services requiring protected credentials:

```text
Widget
   |
   v
Browser Data Service
   |
   v
Node.js API
   |
   v
Server-side Data Service
   |
   v
External API
```

This separation allows:

- API logic to be tested independently
- Widgets to focus on presentation
- Multiple widgets to reuse the same data source
- API changes to be isolated from UI code
- Credentials and refresh tokens to remain on the server

---

# Current External Data Sources

The dashboard currently uses or is expected to use several external services.

## Weather

Weather data is provided by Open-Meteo.

The weather widget is configurable by location.

Weather data may be retrieved directly from browser-accessible APIs when appropriate.

---

# Weather Alerts

Weather alerts use:

1. Open-Meteo geocoding
2. NWS point lookup
3. NWS active alerts

The configured location is first converted into latitude/longitude.

That location is then used to determine the appropriate NWS forecast zone.

Active alerts are retrieved for that zone.

---

# Google Calendar

Google Calendar is implemented using a server-side authentication architecture.

The browser does not directly manage the long-lived Google OAuth credentials.

The architecture is:

```text
Calendar Widget
      |
      v
Calendar Data Service
      |
      v
Node.js /api/google-calendar/*
      |
      v
Google Calendar Service
      |
      v
Google Calendar API
```

The Node.js server manages Google authentication and communicates with Google Calendar.

A persistent Google OAuth refresh token is stored on the Raspberry Pi.

The token is stored in:

```text
/home/pi/family-dashboard/config/google-calendar-token.json
```

The token file is protected using restrictive filesystem permissions and should not be committed to Git.

The browser receives calendar data from the local Node.js API rather than requiring the user to repeatedly authenticate through a browser popup.

---

# Google Calendar Authentication

The current authentication architecture uses server-side authentication.

The primary components are:

```text
services/google-calendar/
    |
    +-- calendar-auth.js
    +-- calendar-data.js
    +-- google-calendar-server.js
```

The server-side Google Calendar service is responsible for:

- OAuth credentials
- Refresh token persistence
- Access token management
- Communication with the Google Calendar API

The browser-side calendar code should not contain the persistent refresh token.

The intended flow is:

```text
Browser
   |
   | GET calendar data
   v
Node.js server
   |
   | Authenticate / refresh token
   v
Google
   |
   | Calendar data
   v
Node.js server
   |
   | JSON response
   v
Browser
```

This architecture eliminates the need for the dashboard user to repeatedly authenticate with Google during normal operation.

---

# Google Calendar Token Security

The Google Calendar refresh token is sensitive information.

The following file must remain local to the Raspberry Pi:

```text
config/google-calendar-token.json
```

It should not be committed to the Git repository.

The file should have restrictive permissions, such as:

```text
-rw------- 
```

The project should also ensure that sensitive credentials and token files are included in `.gitignore`.

The server should be the only component that reads the refresh token.

---

# Google Calendar API Endpoints

The Node.js server exposes local API endpoints for the dashboard.

Examples include:

```text
/api/google-calendar/calendars
/api/google-calendar/events
```

These endpoints allow browser widgets to retrieve calendar information without directly handling Google OAuth credentials.

The exact endpoint implementation may evolve as additional calendar functionality is added.

---

# News

The news widget can consume RSS feeds.

The feed URL is supplied through widget configuration.

Where a feed cannot be consumed directly by the browser because of CORS restrictions, a server-side service may be introduced.

---

# Photos

The photo widget is intended to display rotating photos.

The current implementation is designed around an iCloud shared photo album.

Browser CORS restrictions may affect direct access to iCloud services during development.

A server-side proxy or alternative data service should only be introduced if required.

---

# Styling Architecture

Layout and appearance are primarily controlled through CSS.

Screen-level layout classes define:

- Grid structure
- Columns
- Rows
- Spacing
- Backgrounds
- Overflow behavior

Widgets define their own internal presentation where appropriate.

## Layout Principle

Screen layout belongs to the screen/layout CSS.

Widget-specific presentation belongs to the widget CSS.

Avoid putting application-wide layout rules directly inside widget JavaScript.

---

# Responsive / Dashboard Scaling

The dashboard includes a scaling service:

```text
dashboard-scale.js
```

The purpose is to allow the dashboard UI to adapt to the target display.

The final deployment target is a Raspberry Pi connected to a large display.

The dashboard should therefore avoid assumptions about a desktop browser window size.

---

# Development Environment

Development currently uses:

```text
VS Code
    |
    v
Live Server
    |
    v
http://127.0.0.1:5500
```

The dashboard uses browser-native ES modules.

There is currently no npm build process or bundler.

The development environment may use Live Server because it provides a convenient browser development workflow.

Production differs from development because the Raspberry Pi uses the Node.js application server.

## Development vs Production

Development:

```text
VS Code
   |
   v
Live Server
   |
   v
Browser
```

Production:

```text
Raspberry Pi
   |
   +-- systemd
   |     |
   |     v
   |   Node.js
   |     |
   |     v
   |   localhost:3000
   |
   +-- LabWC
         |
         v
      Chromium
```

Features requiring the Node.js server should be tested against the production-style server when appropriate.

---

# Production Startup

The production startup process is divided into two independent responsibilities.

## Application Startup

Managed by systemd:

```text
Boot
 |
 v
systemd
 |
 v
family-dashboard.service
 |
 v
Node.js
 |
 v
server/server.js
 |
 v
localhost:3000
```

## Display Startup

Managed by the graphical session and schedule:

```text
Boot
 |
 v
LightDM
 |
 v
pi user
 |
 v
LabWC
 |
 v
display-schedule.sh
 |
 +-- If scheduled ON
 |       |
 |       v
 |    Chromium
 |
 +-- If scheduled OFF
         |
         v
     No Chromium
```

This separation allows the Node server to remain available even when the physical display is intentionally turned off.

---

# Systemd Service

The production Node.js server is managed by:

```text
family-dashboard.service
```

The service is enabled at boot.

The expected status is:

```text
Active: active (running)
```

The server process is:

```text
/usr/bin/node /home/pi/family-dashboard/server/server.js
```

The service should be preferred over launching Node.js from LabWC or cron because systemd provides:

- Boot-time startup
- Process supervision
- Automatic restart
- Centralized logging
- Dependency management

---

# Display Process Management

Chromium is treated as the physical display process.

The scheduling script uses process detection to determine whether Chromium is already running.

The basic logic is:

```text
Is current time within ON period?
        |
        +-- YES
        |    |
        |    +-- Chromium running?
        |           |
        |           +-- YES --> Do nothing
        |           |
        |           +-- NO --> Launch Chromium
        |
        +-- NO
             |
             +-- Chromium running?
                    |
                    +-- YES --> Stop Chromium
                    |
                    +-- NO --> Do nothing
```

This makes the script safe to execute repeatedly.

---

# Screen Rotation

Screen rotation is being introduced as a centralized application feature.

Each screen may define a duration.

Example:

```text
duration: {
    minutes: 20
}
```

The screen manager should use that configuration to determine how long the screen remains active.

Screen rotation should not be implemented independently by individual widgets.

---

# Touchscreen Navigation

The eventual dashboard will support touchscreen navigation.

The navigation system should allow viewers to:

- Move to the next screen
- Move to the previous screen
- Return to a primary/home screen

Touchscreen navigation should communicate with the screen manager rather than directly manipulating screen DOM elements.

## Automatic Rotation and Touch Interaction

A future enhancement may temporarily pause automatic rotation when the viewer interacts with the touchscreen.

After a configurable period of inactivity, automatic rotation can resume.

This behavior should be implemented centrally in the screen/navigation system.

---

# Architectural Principles

The following principles should guide future development.

## 1. Configuration over hard-coding

User-specific values such as:

- Locations
- Calendar IDs
- RSS feeds
- Screen durations
- Display schedules

should live in configuration whenever practical.

## 2. Widgets should be independent

A widget should not depend on another widget's DOM structure.

Widgets should communicate through data services or application-level interfaces where necessary.

## 3. Data and presentation should be separated

API access belongs in services.

Rendering belongs in widgets.

Server-side API access belongs in the Node.js server and its associated services.

## 4. Screen navigation belongs to the screen manager

Widgets should never decide which screen is active.

## 5. Avoid unnecessary infrastructure

The Node.js server is now an intentional part of the production architecture because it provides meaningful functionality, including:

- Serving the production dashboard
- Providing server-side API endpoints
- Protecting Google Calendar authentication
- Persisting OAuth refresh tokens

Additional infrastructure should only be introduced when it provides a meaningful benefit.

## 6. Keep credentials server-side

Long-lived credentials, OAuth refresh tokens, API secrets, and similar sensitive information should not be exposed to browser JavaScript.

## 7. Reuse existing services

When building a new widget, first determine whether an existing data service can provide the required information.

## 8. Test incrementally

Changes should generally be introduced one file at a time and tested in the browser before moving to the next change.

## 9. Keep deployment concerns centralized

Startup, shutdown, process supervision, and display scheduling should be handled by the Raspberry Pi deployment layer rather than individual dashboard widgets.

---

# Current Development Status

At the time this document was updated:

- Information screen is operational
- Weather widget is operational
- Weather alerts widget is operational
- Calendar widgets are operational
- Google Calendar server-side authentication is operational
- Google Calendar refresh token persistence is operational
- Node.js production server is operational
- Node.js server starts automatically through systemd
- Chromium kiosk display is operational
- Chromium uses Wayland on the Raspberry Pi
- Chromium uses the basic password store
- Display scheduling is operational
- Weekday display schedule is configured
- Weekend display schedule is configured
- News widget is operational
- Countdown widget is operational
- Prayer widget is operational
- Family menu widget is operational
- Wi-Fi widget is operational
- Photo widget is under development
- Large Calendar screen is the next major screen
- Screen rotation is being expanded
- Touchscreen navigation is planned

---

# Current Raspberry Pi Schedule

The production display schedule is currently:

```text
Monday-Friday

06:00  Display ON
09:00  Display OFF

15:00  Display ON
20:00  Display OFF
```

```text
Saturday-Sunday

07:00  Display ON
09:00  Display OFF

16:00  Display ON
18:00  Display OFF
```

The Node.js server remains running continuously.

Only the Chromium display process is scheduled on and off.

---

# Production Architecture Summary

The current production architecture can be summarized as:

```text
                         Raspberry Pi
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
      systemd                                  LightDM
          |                                       |
          v                                       v
family-dashboard.service                        LabWC
          |                                       |
          v                                       v
       Node.js                            display-schedule.sh
          |                                       |
          v                                       v
   server/server.js                          Chromium
          |                                       |
          |                                       v
          +------------> localhost:3000 <----------+
                              |
                              v
                         Dashboard
                              |
                 +------------+------------+
                 |                         |
                 v                         v
              Widgets                 Data Services
                                           |
                              +------------+------------+
                              |                         |
                              v                         v
                         Browser APIs              Node.js APIs
                                                        |
                                                        v
                                               Server-side Services
                                                        |
                                                        v
                                               External APIs
```

The architecture intentionally separates:

- Application logic
- Screen management
- Widget rendering
- Data services
- Server-side authentication
- Production server startup
- Display process management
- Display scheduling

This separation should make the dashboard easier to maintain as additional screens, widgets, and services are added.

---

# Next Major Development Phase

The next development phase is:

1. Build the large Calendar screen.
2. Reuse the existing calendar data service.
3. Establish screen-to-screen navigation.
4. Implement automatic screen rotation.
5. Add touchscreen navigation controls.
6. Add temporary rotation pause/resume behavior.
7. Continue testing the complete experience on the Raspberry Pi.
8. Refine the production startup and display scheduling behavior as needed.

The goal is to keep screen navigation centralized and independent of the individual widgets while maintaining a simple, reliable Raspberry Pi deployment.