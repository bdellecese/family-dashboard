# Dashboard Architecture

## Overview

This project is a touchscreen information dashboard designed to run on a
Raspberry Pi and display information across multiple screens.

Development is currently performed on a desktop using VS Code and Live Server.

The dashboard is built using:

- HTML
- CSS
- Vanilla JavaScript
- ES modules
- External web APIs
- Browser-based rendering

There is no Node.js build process or bundler.

The production environment is expected to be a Raspberry Pi running a
browser in fullscreen/kiosk mode.


---

# High-Level Architecture

The dashboard is organized around four primary concepts:

1. Dashboard
2. Screens
3. Regions
4. Widgets

The general flow is:

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
        v
    External API


---

# Project Structure

The project currently follows this general structure:

    /
    |
    +-- index.html
    |
    +-- css/
    |
    +-- js/
    |   |
    |   +-- dashboard.js
    |   +-- screen-manager.js
    |   +-- widget-loader.js
    |   +-- register-widgets.js
    |   |
    |   +-- screens/
    |   |
    |   +-- layouts/
    |
    +-- services/
    |   |
    |   +-- weather/
    |   +-- google-calendar/
    |   +-- dashboard/
    |   +-- ...
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


The exact directory contents may evolve as additional screens and widgets
are added.


---

# Dashboard Entry Point

The dashboard starts through:

    dashboard.js

The dashboard performs three primary tasks:

1. Initialize dashboard scaling.
2. Register available widgets.
3. Start the screen manager.

The current startup flow is:

    dashboard.js
        |
        +-- initializeDashboardScaling()
        |
        +-- registerWidgets()
        |
        +-- startScreenRotation()


The dashboard itself should remain lightweight.

Application behavior belongs in the appropriate manager, widget, or service
rather than being implemented directly in `dashboard.js`.


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


This allows screens to be changed without modifying the underlying widget
implementation.


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

    Automatic rotation
          |
          v
    Next screen


and:

    Touchscreen
       |
       +-- Previous
       |
       +-- Next
       |
       +-- Home


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


The screen manager is responsible for resolving the region configuration
and passing the appropriate container to each widget.


---

# Widget Architecture

Widgets are independent UI components.

A widget normally exports a default object containing:

- `name`
- `render()`


Example:

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


The widget loader dynamically loads the widget module and calls:

    render(
        container,
        config
    )


This creates a consistent contract across widgets.


---

# Widget Configuration

Widgets should use configuration supplied by the screen configuration
whenever practical.

Example:

    {
        name: "weather",

        config: {

            location: "Holden, MA"

        }

    }


The widget should not hard-code user-specific configuration if that value
can reasonably be supplied through configuration.


## Configuration Principle

Configuration should flow:

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


This keeps widgets reusable.


---

# Data Services

Widgets should not contain large amounts of API-specific logic when that
logic can be isolated into a service.

The preferred architecture is:

    Widget
      |
      v
    Data Service
      |
      v
    External API


For example:

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


This separation allows:

- API logic to be tested independently
- Widgets to focus on presentation
- Multiple widgets to reuse the same data source
- API changes to be isolated from UI code


---

# Current External Data Sources

The dashboard currently uses or is expected to use several external services.

## Weather

Weather data is provided by Open-Meteo.

The weather widget is configurable by location.


## Weather Alerts

Weather alerts use:

1. Open-Meteo geocoding
2. NWS point lookup
3. NWS active alerts

The configured location is first converted into latitude/longitude.

That location is then used to determine the appropriate NWS forecast zone.

Active alerts are retrieved for that zone.


## Google Calendar

Google Calendar data is accessed through the calendar data service.

The dashboard uses configured calendar IDs rather than presenting an
interactive "Connect Google Calendar" interface.

The previous Google Calendar test/authentication button was development
code and has been removed.


## News

The news widget can consume RSS feeds.

The feed URL is supplied through widget configuration.


## Photos

The photo widget is intended to display rotating photos.

The current implementation is designed around an iCloud shared photo album.

Browser CORS restrictions may affect direct access to iCloud services during
development.


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

    dashboard-scale.js

The purpose is to allow the dashboard UI to adapt to the target display.

The final deployment target is expected to be a Raspberry Pi connected to a
large display.

The dashboard should therefore avoid assumptions about a desktop browser
window size.


---

# Development Environment

Development currently uses:

    VS Code
        |
        v
    Live Server
        |
        v
    http://127.0.0.1:5500


The dashboard uses browser-native ES modules.

There is currently no npm build process.


## Important Development Principle

A feature should work through the browser-based development environment
without requiring a local Node.js application server unless that requirement
is specifically justified.


---

# Raspberry Pi Deployment

The eventual deployment environment is:

    Raspberry Pi
        |
        v
    Browser
        |
        v
    Dashboard


The dashboard should therefore remain as self-contained as practical.

Avoid introducing unnecessary dependencies on:

- Node.js
- npm
- Local proxy servers
- Desktop-specific services


External services should ideally be accessed directly from the browser
when their APIs support browser access.


---

# Screen Rotation

Screen rotation is being introduced as a centralized application feature.

Each screen may define a duration.

Example:

    duration: {
        minutes: 20
    }


The screen manager should use that configuration to determine how long the
screen remains active.

Screen rotation should not be implemented independently by individual
widgets.


---

# Touchscreen Navigation

The eventual dashboard will support touchscreen navigation.

The navigation system should allow viewers to:

- Move to the next screen
- Move to the previous screen
- Return to a primary/home screen

Touchscreen navigation should communicate with the screen manager rather
than directly manipulating screen DOM elements.


## Automatic Rotation and Touch Interaction

A future enhancement may temporarily pause automatic rotation when the
viewer interacts with the touchscreen.

After a configurable period of inactivity, automatic rotation can resume.

This behavior should be implemented centrally in the screen/navigation
system.


---

# Architectural Principles

The following principles should guide future development.


## 1. Configuration over hard-coding

User-specific values such as:

- Locations
- Calendar IDs
- RSS feeds
- Screen durations

should live in configuration whenever practical.


## 2. Widgets should be independent

A widget should not depend on another widget's DOM structure.

Widgets should communicate through data services or application-level
interfaces where necessary.


## 3. Data and presentation should be separated

API access belongs in services.

Rendering belongs in widgets.


## 4. Screen navigation belongs to the screen manager

Widgets should never decide which screen is active.


## 5. Avoid unnecessary infrastructure

The dashboard is intended to run on a Raspberry Pi.

Do not introduce a server, proxy, build system, or dependency unless it
provides a meaningful benefit.


## 6. Reuse existing services

When building a new widget, first determine whether an existing data
service can provide the required information.


## 7. Test incrementally

Changes should generally be introduced one file at a time and tested in
the browser before moving to the next change.


---

# Current Development Status

At the time this document was created:

- Information screen is operational
- Weather widget is operational
- Weather alerts widget is operational
- Calendar widgets are operational
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

# Next Major Development Phase

The next development phase is:

1. Build the large Calendar screen.
2. Reuse the existing calendar data service.
3. Establish screen-to-screen navigation.
4. Implement automatic screen rotation.
5. Add touchscreen navigation controls.
6. Add temporary rotation pause/resume behavior.
7. Test the complete experience on the Raspberry Pi.

The goal is to keep screen navigation centralized and independent of the
individual widgets.