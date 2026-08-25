# Dashboard Widgets

This document is a living inventory of the widgets used by the dashboard.

Each widget is responsible for rendering a specific piece of dashboard functionality.

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

| Widget | Purpose | Configurable | Data Source | Status |
| --- | --- | ---: | --- | --- |
| date-time | Current date and time | Yes | Browser | Complete |
| weather | Current weather and forecast | Yes | Open-Meteo | Complete |
| weather-alerts | Active weather alerts | Yes | NWS / Open-Meteo | Complete |
| calendar | Calendar display | Yes | Google Calendar | Complete |
| large-calendar | Four-week calendar + weather | Yes | Google Calendar / Open-Meteo | Complete |
| calendar-list | Multi-calendar event list | Yes | Google Calendar | Complete |
| countdown | Event countdowns | Yes | Configuration / data | Complete |
| news | Rotating news headlines | Yes | RSS | Complete |
| prayer-list | Prayer list | TBD | Configuration / data | Complete |
| family-menu | Family menu | TBD | Configuration / data | Complete |
| wifi | Wi-Fi information / QR | Yes | Configuration | Complete |
| photo | Rotating photos | Yes | iCloud shared album | In development |
| sonos-status | Current Sonos playback status | Yes | Sonos API | Complete |
| sports-scoreboard | Live / recent sports scores | Yes | Sports data service | Complete |
| sports-standings | League standings | Yes | Sports data service | Complete |
| calendar-list | Upcoming games / schedules on Sports screen | Yes | Google Calendar | Complete |
| sports-news | Sports news headlines | Yes | RSS | Complete |
| on-this-day-sports | Historical sports events | TBD | Configuration / data | Complete |
| sports-trivia | Rotating sports trivia questions | TBD | Local data | Complete |
| sports-legends | Randomized legendary athletes | Yes | Local data | Complete |
| kids-chores | Kids' daily chores | TBD | Configuration / data | Complete |
| household-chores | Household chores | TBD | Configuration / data | Complete |
| school-lunch | School lunch information | TBD | Configuration / data | Complete |
| playing-time | Playing-time information | TBD | Configuration / data | Complete |
| on-this-day | Historical "On This Day" information | TBD | Configuration / data | Complete |
| did-you-know | Fun facts | TBD | Configuration / data | Complete |
| word-of-day | Word of the day | TBD | Configuration / data | Complete |
| quote-of-day | Quote of the day | TBD | Configuration / data | Complete |
| dad-wisdom | Dad wisdom / family sayings | TBD | Configuration / data | Complete |

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

            format:
                "12h",

            size:
                72,

            weight:
                "normal"

        },

        date: {

            format:
                "weekday-month-day",

            size:
                48,

            weight:
                "normal"

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

The weather widget is designed to operate directly from the browser without a local proxy.

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

Displays active National Weather Service weather alerts for the configured location.

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

For example, a location with an active Red Flag Warning can be used to validate the red severity styling.

## Data Flow

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

The NWS description is parsed to identify the explicit `IMPACTS...` section when available.

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

The calendar widget should not require an interactive "Connect Google Calendar" button.

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

Displays a four-week calendar view with seven columns representing Sunday through Saturday.

The widget combines calendar events with a compact five-day weather forecast displayed directly beneath each date.

The large calendar is intended for the primary calendar/dashboard screen and is optimized for a large touchscreen display.

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

Calendar IDs are supplied through configuration rather than being hard-coded in the widget.

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

The widget supports vertical scrolling when the calendar content exceeds the available screen height.

## Date Formatting

The current day is highlighted using a red circle around the date number.

Past dates are visually muted.

The date-number area has a fixed height so the current-day circle does not change the vertical alignment of the calendar rows.

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

The weather area maintains its reserved vertical space even when there is no forecast available. This prevents the event lists from shifting vertically between days.

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

Timed events and all-day events belonging to past dates are also visually muted.

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

The large calendar should reuse the existing Google Calendar data service rather than implementing an independent Google Calendar API integration.

The weather forecast should reuse the existing weather data service rather than making Open-Meteo requests directly from the widget.

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

This widget is currently used in the Information screen and is also used by the Sports screen to display upcoming sports games from a dedicated sports calendar.

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

        days:
            7,

        showCalendarName:
            false

    }
}
```

## Sports Screen Usage

On the Sports screen, the shared `calendar-list` widget is configured with a dedicated sports calendar and is displayed as:

```text
Upcoming Games
```

This allows the Sports screen to reuse the existing calendar infrastructure rather than maintaining a separate sports scheduling implementation.

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

The widget is intended to provide a quick visual indication of upcoming important dates.

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

The same news widget can be used for general news or sports news by providing different RSS feeds through configuration.

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

Multiple feeds can also be configured when supported by the widget.

## Data Source

RSS feed.

## Notes

The feed URL and rotation interval are configurable.

The Sports screen uses the same shared `news` widget with sports-specific RSS feeds and a Sports News label.

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

Displays Wi-Fi information, including a QR code or other connection information for guests.

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

Direct browser access to iCloud shared album APIs may encounter CORS restrictions.

Development is currently performed through VS Code Live Server.

The eventual target is a Raspberry Pi.

The photo architecture should avoid introducing a laptop-only proxy dependency if possible.

## Status

In development.

---

# Sonos Status

## Widget

```text
sonos-status
```

## Purpose

Displays the current playback status of a configured Sonos speaker and, when that speaker is grouped with other Sonos speakers, displays the full group.

The widget provides a compact view of:

* Sonos room / group name
* Playback state
* Song title
* Artist
* Album
* Album artwork

The widget is currently used on the Information screen.

## Configuration

Example:

```text
{
    name: "sonos-status",

    config: {

        speaker:
            "Kitchen",

        refreshInterval:
            10000

    }
}
```

`speaker` identifies the Sonos room used as the starting point for the query.

If the configured speaker is currently grouped with other Sonos speakers, the widget displays all members of that group.

The configured speaker is displayed first in the group name.

`refreshInterval` controls how frequently the widget refreshes its data, in milliseconds.

The current defaults are:

```text
speaker:
    Kitchen

refreshInterval:
    10000
```

or 10 seconds.

## Group Display

When the configured speaker is not grouped, the widget displays only that speaker:

```text
Kitchen
```

When the configured speaker is grouped with another speaker:

```text
Kitchen & Family Room
```

When the configured speaker is grouped with multiple speakers:

```text
Kitchen, Family Room & Bedroom
```

The configured speaker is always placed first, regardless of the order in which Sonos reports the group members.

For example, if the API returns:

```text
Family Room
Kitchen
Bedroom
```

for a widget configured for:

```text
speaker:
    Kitchen
```

the widget displays:

```text
Kitchen, Family Room & Bedroom
```

## Data Source

The widget retrieves Sonos data through the dashboard's local API:

```text
/api/sonos?speaker=<speaker>
```

The API communicates with Sonos players on the local network and returns normalized playback and group information.

The API response includes:

```text
speaker

state

track

group
```

The `group` object includes:

```text
grouped

coordinator

members
```

Each group member includes:

```text
uuid

name
```

## Data Flow

```text
screen configuration

        |

        v

sonos-status widget

        |

        v

/api/sonos?speaker=<speaker>

        |

        v

Sonos data service

        |

        +----------------------+

        |                      |

        v                      v

Sonos player             Zone Group State

        |                      |

        +----------+-----------+

                   |

                   v

          normalized Sonos data

                   |

                   v

            sonos-status
```

## Playback Information

The widget displays:

* Playback state
* Track title
* Artist
* Album
* Album artwork

Playback states include:

```text
PLAYING

PAUSED_PLAYBACK

STOPPED
```

These are translated into user-friendly labels:

```text
Playing

Paused

Stopped
```

The widget uses different visual treatments for playing and paused states.

## Album Artwork

When Sonos provides album artwork, the widget displays the artwork returned by the Sonos player.

If no artwork is available, the widget displays the music placeholder.

## Grouping

Sonos group membership is determined from the Sonos `ZoneGroupTopology` service.

The data service identifies the `ZoneGroup` containing the configured speaker and returns the members of that group.

The group coordinator is also returned by the API.

## Data Service

```text
services/sonos/sonos-data.js
```

The data service is responsible for:

* Sonos player discovery
* Finding a player by friendly room name
* Playback state
* Track metadata
* Album artwork
* Sonos group membership
* Group coordinator information

Player discovery currently uses Avahi / mDNS.

## Environment Considerations

The Sonos widget requires access to the local Sonos API.

When running through VS Code Live Server on the Mac, the widget is configured to call the Raspberry Pi directly.

When running on the Raspberry Pi, the widget uses the relative:

```text
/api/sonos
```

endpoint.

VS Code Live Server by itself does not provide the `/api/sonos` endpoint.

The Raspberry Pi dashboard server therefore provides the local API endpoint used by the production dashboard.

## Status

Complete.

---

# School Lunch

## Widget

```text
school-lunch
```

## Purpose

Displays the current and upcoming school lunch information for the family.

The widget is used by the Chores + Fun screen.

The widget is designed to present the lunch menu in a simple, family-friendly format without requiring users to open the underlying school menu documents.

## Data Source

School calendar and menu data.

The school lunch data is maintained separately from the widget and is normalized from the school's published menu information.

The source data includes school-year and monthly menu records, including menu PDF URLs for:

* Elementary / Middle School
* High School

## Data Flow

```text
school calendar / menu source

        |

        v

school lunch data

        |

        v

normalized lunch data

        |

        v

school-lunch widget
```

## Menu Sources

The school menu data includes records such as:

```text
school-year

menu
```

with fields including:

```text
name

startDate

endDate

elementaryMiddleUrl

highSchoolUrl
```

Monthly menu records contain the source PDF URLs published by the school.

## Status

Complete.

---

# Sports Scoreboard

## Widget

```text
sports-scoreboard
```

## Purpose

Displays sports scores for configured teams and leagues.

The scoreboard is designed for the Sports screen and provides a quick visual summary of current, recent, and relevant games.

## Configuration

Example:

```text
{
    name: "sports-scoreboard",

    config: {

        rotationSeconds:
            20,

        sports: [

            {

                sport:
                    "mlb",

                team:
                    "boston-red-sox",

                season: {

                    start:
                        "03-01",

                    end:
                        "10-31"

                },

                priority:
                    1

            }

        ]

    }
}
```

Sports and teams are supplied through configuration rather than being hard-coded into the widget.

The current Sports screen is configured for the Boston Red Sox.

## Data Source

Sports data service / external sports API.

## Display

The scoreboard is intended to display:

* Team names
* Team logos when available
* Scores
* Game status
* Game date / time
* Relevant game state

The widget supports rotating scoreboard content when multiple sports or teams are configured.

## Status

Complete.

---

# Sports Standings

## Widget

```text
sports-standings
```

## Purpose

Displays league standings for configured sports.

The widget provides a quick view of team position within the relevant division or league.

## Configuration

Example:

```text
{
    name: "sports-standings",

    config: {

        rotationSeconds:
            20,

        sports: [

            "mlb"

        ]

    }
}
```

## Data Source

Sports data service / external sports API.

## Display

Depending on the configured sport, standings may include:

* Team
* Wins
* Losses
* Winning percentage
* Games behind
* Division / conference position
* Other sport-specific standings information

## Status

Complete.

---

# Sports Trivia

## Widget

```text
sports-trivia
```

## Purpose

Displays rotating sports trivia questions on the Sports screen.

The widget is designed as a timed trivia experience where the viewer has an opportunity to answer the question before the correct answer and explanation are revealed.

The widget runs continuously while the dashboard screen is active and cleans up its timers when the widget is destroyed or re-rendered.

## Presentation

The current trivia sequence is:

```text
0–30 seconds

Question and multiple-choice answers
```

```text
30–40 seconds

"Think you know it?"
```

```text
40–60 seconds

Correct answer and explanation
```

This creates a 60-second trivia experience that matches the duration of the Sports screen.

## Data Source

Local Sports Trivia data.

The question data is maintained separately from the widget.

The data includes:

* Question ID
* Sport
* Difficulty
* Question
* Multiple-choice answers
* Correct answer
* Explanation

Example:

```text
{
    "id": "mlb-006",
    "sport": "MLB",
    "difficulty": "medium",
    "question": "Who was the first pitcher to record 20 strikeouts in a regulation 9-inning game?",
    "answers": [
        "Roger Clemens",
        "Jon Lester",
        "Kerry Wood",
        "Felix Hernandez"
    ],
    "correctAnswer": "Roger Clemens",
    "explanation": "Roger Clemens first achieved the historic feat on April 29, 1986 against the Seattle Mariners, and did it again on September 18, 1996, against the Detroit Tigers."
}
```

## Question Selection

Questions are selected from the available data.

Question selection should be random rather than weighted.

The widget should not impose an artificial limit on the number of questions available.

## Configuration

The widget currently requires minimal configuration.

Example:

```text
{
    name:
        "sports-trivia"
}
```

The widget may optionally receive a `sports` configuration value to limit question selection to specific sports.

## Timer Management

The widget uses `setTimeout()` to manage the three phases of each 60-second trivia cycle.

All timers are registered through a shared `schedule()` function.

The widget maintains a `Set` of active timers and removes each timer from the set when it executes.

This provides centralized timer management and allows all outstanding timers to be cancelled when the widget is destroyed.

The widget also maintains a `destroyed` state. Scheduled callbacks check this state before executing, preventing callbacks from continuing after the widget has been removed.

## Cleanup

The widget returns a cleanup function from `render()`.

When cleanup occurs:

1. The widget is marked as destroyed.
2. All outstanding timers are cleared.
3. The timer collection is emptied.

This is important because the dashboard can render or re-render widgets as screens change.

Without explicit timer cleanup, previous instances could continue executing their timers after the widget was no longer visible. Each surviving timer could subsequently request another trivia question, causing requests to accumulate over time.

The current implementation prevents this timer/request leak.

## Request Behavior

A new trivia question is retrieved once per 60-second cycle.

Expected behavior is approximately:

```text
Initial render
    ↓
1 data request
    ↓
60 seconds
    ↓
1 data request
    ↓
60 seconds
    ↓
1 data request
    ↓
...
```

The widget should not generate multiple concurrent request cycles as a result of previous renders.

## Performance / Validation

The timer lifecycle was specifically reviewed after observing excessive requests from widgets that remained active after being re-rendered.

The revised implementation was validated on the Raspberry Pi production dashboard.

Observed behavior:

* One Sports Trivia data request on initial load.
* Subsequent requests occur approximately every 60 seconds.
* No observed accumulation of requests from previous widget instances.
* Widget timers are explicitly cancelled during cleanup.

Example observed request sequence:

```text
3:46:39 PM
3:47:39 PM
```

This confirms the expected one-request-per-minute behavior.

## Status

Complete.

The widget provides the required 60-second trivia experience, uses the local trivia data source, supports continuous question rotation, and includes explicit timer lifecycle management and cleanup to prevent accumulating timers and network requests.

---

# Sports Legends

## Widget

```text
sports-legends
```

## Purpose

Displays rotating profiles of legendary sports players.

The widget combines player photography, career information, and notable statistics.

The widget is designed for the Sports screen.

## Configuration

Example:

```text
{
    name:
        "sports-legends",

    config: {
        sports: [
            "MLB",
            "NBA",
            "NFL",
            "Soccer"
        ],

        rotationSeconds:
            30
    }
}
```

### Sports

The `sports` configuration is optional.

When specified, it limits the eligible player pool to the listed sports.

For example:

```text
sports: [
    "MLB",
    "NBA"
]
```

will include only MLB and NBA players.

When `sports` is omitted, all players in the Sports Legends data file are eligible.

Sport selection is **not weighted equally**. Randomization is performed at the player level. Therefore, a sport with more players will naturally appear more frequently than a sport with fewer players.

For example, if the pool contains 15 MLB players and 3 NFL players, MLB collectively represents a larger percentage of possible selections.

Adding a new sport requires no changes to the selection algorithm. Add the sport and its players to the data file and include the sport in the widget configuration if a restricted pool is being used.

### Rotation

The `rotationSeconds` value controls how frequently the displayed legend changes.

Default:

```text
30 seconds
```

## Data Source

Local Sports Legends data:

```text
services/sports-legends/sports-legends-data.json
```

Player images are stored under:

```text
assets/images/sports-legends/
```

Player records contain information such as:

* Unique player ID
* Sport
* Name
* Team
* Career years
* Position
* Hall of Fame information
* Notable statistics
* Image path

The legacy `familyScore` property is no longer used by the widget or selection algorithm.

## Selection

Sports Legends uses **equal-probability random selection at the player level**.

There is no family-score weighting and no sport weighting.

### No-repeat cycle

Players are selected randomly from the remaining eligible players.

Once a player has been displayed, that player is excluded from subsequent selections until every other eligible player has also been displayed.

This means a player such as Tom Brady cannot appear again during the current cycle until the entire eligible player pool has been displayed.

For example, with 29 eligible players:

```text
Player 1
Player 2
Player 3
...
Player 29
```

will contain every eligible player exactly once, although the order is randomized.

After the 29th player is displayed, the cycle is complete and a new randomized cycle begins.

### Persistent history

The widget maintains the current cycle in browser `localStorage` using:

```text
sports-legends-cycle
```

This allows the no-repeat behavior to persist across page reloads and dashboard restarts.

The stored history tracks:

* The current player-pool signature
* Players already displayed during the current cycle

### Pool changes

The service maintains a signature of the eligible player pool.

If players are added or removed from the eligible pool, the pool signature changes and a new selection cycle is automatically started.

This allows the player data to evolve without requiring changes to the selection logic.

Adding new players or new sports is therefore forward-compatible.

### Cycle reset

When all eligible players have been displayed, the current history is cleared and a new cycle begins.

The first player of the new cycle is selected randomly from the complete pool.

## Data Service

Selection is handled by:

```text
services/sports-legends/sports-legends-data.js
```

The service exposes:

```text
getNextLegend()
```

Returns the next randomly selected eligible player while enforcing the current no-repeat cycle.

```text
getHistory()
```

Returns the current selection history and is useful for debugging.

```text
resetHistory()
```

Clears the current cycle and causes the next selection to begin a new cycle.

The widget itself is responsible only for rendering the player and requesting the next legend.

## Display

The widget may display:

* Sport
* Player name
* Team
* Career years
* Position
* Hall of Fame information
* Notable statistics
* Player photograph

The widget returns one legend at a time while maintaining compatibility with the existing widget architecture.

## Status

Complete.

---

# Kids Chores

## Widget

```text
kids-chores
```

## Purpose

Displays the children's daily chores.

The widget is used by the Chores + Fun screen.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# Household Chores

## Widget

```text
household-chores
```

## Purpose

Displays household chores and responsibilities.

The widget is used by the Chores + Fun screen.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# Playing Time

## Widget

```text
playing-time
```

## Purpose

Displays information related to available playing time.

The widget is used by the Chores + Fun screen.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# On This Day

## Widget

```text
on-this-day
```

## Purpose

Displays historical information associated with the current date.

The widget is used by the Chores + Fun screen as a rotating informational element.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# On This Day in Sports

## Widget

```text
on-this-day-sports
```

## Purpose

Displays historical sports events associated with the current date.

The widget is designed specifically for the Sports screen and provides a compact historical sports fact or event.

## Data Source

Local sports history data.

## Display

The widget displays:

* Year
* Sport
* Historical event

The presentation is optimized for the Sports screen and follows the same visual language as the other informational sports widgets.

## Status

Complete.

---

# Did You Know

## Widget

```text
did-you-know
```

## Purpose

Displays interesting facts and trivia.

The widget is used by the Chores + Fun screen.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# Word of the Day

## Widget

```text
word-of-day
```

## Purpose

Displays a word of the day and associated information.

The widget is used by the Chores + Fun screen.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# Quote of the Day

## Widget

```text
quote-of-day
```

## Purpose

Displays a quote of the day.

The widget is used by the Chores + Fun screen.

## Data Source

Configuration / dashboard data.

## Status

Complete.

---

# Dad Wisdom

## Widget

```text
dad-wisdom
```

## Purpose

Displays family-oriented advice, sayings, or "Dad Wisdom."

The widget is used by the Chores + Fun screen.

## Data Source

Configuration / dashboard data.

## Status

Complete.

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
* Sports
* Teams
* Rotation intervals
* Screen durations
* Display preferences
* Sonos speaker names
* Refresh intervals

When a value is temporarily hard-coded during development, it should eventually be moved into configuration when the widget architecture is stable.

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

500 Internal Server Error
```

For widgets that depend on local services, also verify that the required API or data service is reachable from the machine running the dashboard.

---

# Screens

The dashboard currently contains four screens built from the shared widget architecture:

```text
information

calendar

chores-fun

sports
```

## Information

The Information screen combines:

* Date / time
* Photos
* Weather alerts
* Calendar
* News
* Countdown
* Prayer list
* Wi-Fi information
* Weather
* Sonos status
* Family menu

## Calendar

The Calendar screen is centered around the large-calendar widget and provides a four-week calendar view with integrated weather information.

## Chores + Fun

The Chores + Fun screen combines:

* Kids' chores
* Household chores
* School lunch
* Playing time
* On This Day
* Did You Know
* Word of the Day
* Quote of the Day
* Dad Wisdom

## Sports

The Sports screen combines:

* Sports scoreboard
* Sports standings
* Sports news
* On This Day in Sports
* Sports trivia
* Sports legends
* Upcoming games

The current Sports screen layout is:

```text
Column 1
    Sports Scoreboard
    Sports Standings

Column 2
    Sports News
    On This Day in Sports
    Sports Trivia

Column 3
    Sports Legends
    Upcoming Games
```

The Upcoming Games area currently uses the shared `calendar-list` widget with a dedicated sports calendar.

The Sports screen is intended to provide a mixture of:

* Live / recent sports information
* Upcoming games
* Historical sports information
* Sports news
* Interactive trivia
* Sports legends

Completed screens should continue to reuse existing widgets and data services where practical rather than creating screen-specific implementations.

---

# Future Widgets / Screens

Additional widgets and screens can be added as dashboard requirements evolve.

When adding new functionality, prefer extending the shared widget and data service architecture rather than creating screen-specific implementations.

Potential future areas include:

* Additional sports and teams
* Expanded Sports Trivia content
* Additional sports
* Expanded Sonos support
* Additional music services
* Improved photo integration
* Additional family information
* Additional household automation
* More personalized dashboard content