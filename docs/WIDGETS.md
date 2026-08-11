# Dashboard Widgets

This document is a living inventory of the widgets used by the dashboard.

Each widget is responsible for rendering a specific piece of dashboard
functionality.

Widgets should follow the common widget contract:

```text
const widget = {

    name: "widget-name",

    async render(
        container,
        config = {}
    ) {

        // Render widget

    }

};

export default widget;
```

---

# Widget Contract

Every widget should:

* Export a default object.
* Provide a `name`.
* Provide a `render()` function.
* Accept a target `container`.
* Accept an optional `config` object.
* Render only inside the supplied container.
* Avoid manipulating unrelated parts of the dashboard.
* Use data services for external API access when practical.

The normal rendering flow is:

```text
screen configuration
      |
      v
widget-loader
      |
      v
   widget
      |
      v
data service
      |
      v
external API
```

---

# Widget Inventory

| Widget         | Purpose                      | Configurable | Data Source                  | Status         |
| -------------- | ---------------------------- | -----------: | ---------------------------- | -------------- |
| date-time      | Current date and time        |          Yes | Browser                      | Complete       |
| weather        | Current weather and forecast |          Yes | Open-Meteo                   | Complete       |
| weather-alerts | Active weather alerts        |          Yes | NWS / Open-Meteo             | Complete       |
| calendar       | Calendar display             |          Yes | Google Calendar              | Complete       |
| large-calendar | Four-week calendar + weather |          Yes | Google Calendar / Open-Meteo | Complete       |
| calendar-list  | Multi-calendar event list    |          Yes | Google Calendar              | Complete       |
| countdown      | Event countdowns             |          Yes | Configuration / data         | Complete       |
| news           | Rotating news headlines      |          Yes | RSS                          | Complete       |
| prayer-list    | Prayer list                  |          TBD | Configuration / data         | Complete       |
| family-menu    | Family menu                  |          TBD | Configuration / data         | Complete       |
| wifi           | Wi-Fi information / QR       |          Yes | Configuration                | Complete       |
| photo          | Rotating photos              |          Yes | iCloud shared album          | In development |

---

# Date / Time

## Widget

```text
date-time
```

## Purpose

Displays the current date and time.

The widget supports timezone-aware rendering and configurable formatting.

## Configuration

Example:

```text
{
    name: "date-time",

    config: {

        timezone:
            "America/New_York",

        color:
            "rgba(255, 255, 255, 0.85)",

        time: {

            format: "12h",

            size: 72,

            weight: "normal"

        },

        date: {

            format:
                "weekday-month-day",

            size: 48,

            weight: "normal"

        },

        alignment:
            "left"

    }

}
```

## Data Source

Browser date/time APIs.

## Status

Complete.

---

# Weather

## Widget

```text
weather
```

## Purpose

Displays current weather and forecast information.

The widget is location configurable.

## Configuration

Example:

```text
{
    name: "weather",

    config: {

        location:
            "Holden, MA"

    }

}
```

## Data Source

Open-Meteo.

## Notes

The weather widget is designed to operate directly from the browser without
a local proxy.

Weather presentation includes:

* Current conditions
* Forecast
* Sunrise
* Sunset
* Wind
* Weather condition indicators
* Precipitation information

## Status

Complete.

---

# Weather Alerts

## Widget

```text
weather-alerts
```

## Purpose

Displays active National Weather Service weather alerts for the configured
location.

The widget highlights alert severity using:

* Red = Warning
* Orange = Watch
* Yellow = Advisory

## Configuration

Example:

```text
{
    name: "weather-alerts",

    config: {

        location:
            "Holden, MA"

    }

}
```

The configurable location is also useful for testing.

For example, a location with an active Red Flag Warning can be used to
validate the red severity styling.

## Data Flow

The alert service performs:

```text
configured location
        |
        v
Open-Meteo geocoding
        |
        v
latitude / longitude
        |
        v
NWS points API
        |
        v
forecast zone
        |
        v
NWS active alerts API
        |
        v
normalized alert data
        |
        v
weather-alerts widget
```

## Alert Parsing

The widget separates the alert into:

* WHAT
* WHERE
* WHEN
* IMPACTS

### WHAT

Uses the NWS `event` field.

Examples:

* Heat Advisory
* Tornado Warning
* Flood Watch

### WHERE

Uses the NWS `areaDesc` field.

### WHEN

Uses the NWS `effective` and `expires` fields.

### IMPACTS

The NWS description is parsed to identify the explicit `IMPACTS...`
section when available.

This is preferable to simply displaying the entire NWS description.

## Severity

Severity is determined primarily from the NWS event name.

### Red

Events containing:

```text
warning
```

are classified as:

```text
warning
```

### Orange

Events containing:

```text
watch
```

are classified as:

```text
watch
```

### Yellow

Events containing:

```text
advisory
```

are classified as:

```text
advisory
```

The NWS severity field is used as a fallback.

## Data Service

```text
services/weather/weather-alert-data.js
```

## Status

Complete.

---

# Calendar

## Widget

```text
calendar
```

## Purpose

Displays calendar events.

The widget uses configured Google Calendar data.

## Configuration

Calendar configuration is maintained separately from the widget itself.

The calendar widget should not require an interactive "Connect Google
Calendar" button.

## Data Source

Google Calendar.

## Status

Complete.

---

# Large Calendar

## Widget

```text
large-calendar
```

## Purpose

Displays a four-week calendar view with seven columns representing
Sunday through Saturday.

The widget combines calendar events with a compact five-day weather
forecast displayed directly beneath each date.

The large calendar is intended for the primary calendar/dashboard screen
and is optimized for a large touchscreen display.

## Configuration

Example:

```text
{
    name: "large-calendar",

    config: {

        calendars: [

            "barry.dellecese@gmail.com",
            "family01156229611257150686",
            "natalie.dellecese@gmail.com",
            "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com"

        ]

    }

}
```

Calendar IDs are supplied through configuration rather than being
hard-coded in the widget.

The weather location is currently hard-coded to:

```text
Holden
```

This should eventually be moved into configuration.

## Calendar Layout

The widget displays:

* Four weeks / 28 days
* Seven columns
* Sunday through Saturday
* Calendar legend
* Date number for each day
* Weather forecast beneath the date
* All-day events
* Timed events
* Event locations when available

The widget supports vertical scrolling when the calendar content exceeds
the available screen height.

## Date Formatting

The current day is highlighted using a red circle around the date number.

Past dates are visually muted.

The date-number area has a fixed height so the current-day circle does not
change the vertical alignment of the calendar rows.

## Weather

The weather forecast is displayed directly beneath the date number.

The weather layout is:

```text
weather icon → high → low → precipitation
```

Example:

```text
☀️ 82° 61° 💧20%
```

Weather information is displayed only when forecast data is available.

The weather area maintains its reserved vertical space even when there is
no forecast available. This prevents the event lists from shifting vertically
between days.

Forecasts are currently available for five days.

Therefore:

* Past days have no weather forecast displayed.
* Days beyond the five-day forecast have no weather forecast displayed.
* The reserved weather space remains present for alignment.

## Calendar Events

### All-Day Events

All-day events are displayed as colored event tiles.

The layout is:

```text
icon → event title
```

The calendar's configured color is used for the event background and border.

All-day events do not display event locations.

### Timed Events

Timed events use the following layout:

```text
icon → time → title
```

The time is displayed on two lines:

```text
10:00 AM
→ 11:30 AM
```

The end time is smaller and muted.

The event title appears to the right of the time.

If a location exists, it is displayed beneath the title:

```text
Event Title
at Location
```

The location is smaller and muted relative to the event title.

## Past Events

Past dates are muted.

Timed events and all-day events belonging to past dates are also visually
muted.

## Legend

The legend displays the configured calendars using their configured:

* Icon
* Name
* Color

## Data Sources

Calendar events:

```text
services/google-calendar/calendar-data.js
```

Weather:

```text
services/weather/weather-data.js
```

The large calendar should reuse the existing Google Calendar data service
rather than implementing an independent Google Calendar API integration.

The weather forecast should reuse the existing weather data service rather
than making Open-Meteo requests directly from the widget.

## Data Flow

```text
screen configuration
        |
        v
large-calendar widget
        |
        +--------------------------+
        |                          |
        v                          v
calendar-data.js             weather-data.js
        |                          |
        v                          v
Google Calendar              Open-Meteo
        |                          |
        +------------+-------------+
                     |
                     v
              large-calendar
```

## Status

Complete.

---

# Calendar List

## Widget

```text
calendar-list
```

## Purpose

Displays upcoming events from multiple configured calendars.

This widget is currently used in the Information screen.

## Configuration

Example:

```text
{
    name: "calendar-list",

    config: {

        calendars: [

            "barry.dellecese@gmail.com",
            "family01156229611257150686",
            "natalie.dellecese@gmail.com",
            "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com"

        ],

        days: 7,

        showCalendarName: false

    }

}
```

## Data Source

Google Calendar.

## Status

Complete.

---

# Countdown

## Widget

```text
countdown
```

## Purpose

Displays countdowns to configured events.

The widget is intended to provide a quick visual indication of upcoming
important dates.

## Data Source

Configuration and/or dashboard event data.

## Status

Complete.

---

# News

## Widget

```text
news
```

## Purpose

Displays rotating news headlines.

## Configuration

Example:

```text
{
    name: "news",

    config: {

        feed:
            "http://feeds.bbci.co.uk/news/world/rss.xml",

        rotationSeconds:
            30

    }

}
```

## Data Source

RSS feed.

## Notes

The feed URL and rotation interval are configurable.

## Status

Complete.

---

# Prayer List

## Widget

```text
prayer-list
```

## Purpose

Displays the household prayer list.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# Family Menu

## Widget

```text
family-menu
```

## Purpose

Displays the family menu.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# Wi-Fi

## Widget

```text
wifi
```

## Purpose

Displays Wi-Fi information, including a QR code or other connection
information for guests.

## Configuration

Example:

```text
{
    name: "wifi",

    config: {

        image:
            "...",

        ssid:
            "YOUR_GUEST_SSID",

        password:
            "YOUR_GUEST_PASSWORD",

        security:
            "WPA"

    }
}
```

## Data Source

Configuration.

## Status

Complete.

---

# Photo

## Widget

```text
photo
```

## Purpose

Displays rotating photographs.

The long-term goal is to display photographs from an iCloud shared album.

## Data Source

iCloud shared album.

## Current Development Considerations

Direct browser access to iCloud shared album APIs may encounter CORS
restrictions.

Development is currently performed through VS Code Live Server.

The eventual target is a Raspberry Pi.

The photo architecture should avoid introducing a laptop-only proxy
dependency if possible.

## Status

In development.

---

# Widget Development Guidelines

When creating a new widget:

1. Create a dedicated widget directory.
2. Create the widget JavaScript module.
3. Create widget-specific CSS when appropriate.
4. Create a data service when external data is required.
5. Export the widget as the default module.
6. Register the widget with the widget registry.
7. Add the widget to screen configuration.
8. Test independently before integrating into a screen.
9. Document the widget in this file.

---

# Configuration Guidelines

Prefer:

```text
screen configuration
      |
      v
   widget
      |
      v
  data service
```

over:

```text
widget
   |
   +-- hard-coded user settings
   |
   +-- API access
   |
   +-- application logic
```

Configuration should be used for values such as:

* Locations
* Calendar IDs
* RSS feeds
* Rotation intervals
* Screen durations
* Display preferences

When a value is temporarily hard-coded during development, it should
eventually be moved into configuration when the widget architecture is
stable.

---

# Testing Guidelines

Widgets should be tested incrementally.

Recommended process:

1. Add or modify one file.
2. Save the file.
3. Refresh the dashboard.
4. Check the browser console.
5. Verify the widget visually.
6. Only then move to the next change.

Common errors to watch for include:

```text
Widget not registered

Failed to load dynamically imported module

Module does not expose expected function

Failed to fetch

CORS errors

404 Not Found
```

---

# Future Widgets / Screens

The dashboard now has two completed screens built from the shared widget
architecture.

Completed screens should continue to reuse existing widgets and data services
where practical rather than creating screen-specific implementations.

Additional widgets and screens can be added as dashboard requirements evolve.