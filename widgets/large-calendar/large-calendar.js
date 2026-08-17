import {
    getEventsForRange
} from "../../services/google-calendar/calendar-data.js";

import weatherData from "../../services/weather/weather-data.js";

import {
    CALENDARS
} from "../../config/calendars.js";

import {
    enableTouchScroll
} from "../../services/ui/touch-scroll.js";

const largeCalendar = {

    name: "large-calendar",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        /*
         * CURRENT DATE
         */

        const today =
            new Date();


        /*
         * START OF CURRENT WEEK
         *
         * Sunday = 0
         */

        const startDate =
            new Date(today);

        startDate.setHours(
            0,
            0,
            0,
            0
        );

        startDate.setDate(
            startDate.getDate() -
            startDate.getDay()
        );


        /*
         * END DATE
         *
         * Four weeks = 28 days
         */

        const endDate =
            new Date(startDate);

        endDate.setDate(
            endDate.getDate() + 28
        );


        /*
         * WRAPPER
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "large-calendar-widget";

        container.appendChild(
            wrapper
        );

        /*
         * ENABLE TOUCH SCROLLING
         */

        enableTouchScroll(
            wrapper
        );


        /*
         * LEGEND
         */

        const legend =
            document.createElement("div");

        legend.className =
            "large-calendar-widget__legend";


        const calendars =
            config.calendars || [];


        calendars.forEach(
            calendarId => {

                const calendar =
                    CALENDARS[calendarId];


                if (!calendar) {

                    return;

                }


                const item =
                    document.createElement("div");

                item.className =
                    "large-calendar-widget__legend-item";


                /*
                 * ICON
                 */

                const icon =
                    document.createElement("span");

                icon.dataset.sourceCal =
                    calendarId;

                icon.className =
                    `large-calendar-widget__legend-icon fa-fw ${calendar.icon}`;

                icon.innerHTML =
                    "&nbsp;";

                icon.style.color =
                    calendar.color;


                /*
                 * CALENDAR NAME
                 */

                const name =
                    document.createElement("span");

                name.className =
                    "large-calendar-widget__legend-name";

                name.textContent =
                    calendar.name;


                item.appendChild(
                    icon
                );

                item.appendChild(
                    name
                );

                legend.appendChild(
                    item
                );

            }
        );


        wrapper.appendChild(
            legend
        );


        /*
         * LOAD WEATHER
         *
         * Weather service already returns
         * the next five forecast days.
         *
         * Hardcoded to Holden for now.
         */

        let weatherByDate =
            new Map();


        try {

            const weather =
                await weatherData.getWeather(
                    "Holden"
                );


            if (
                weather &&
                weather.daily
            ) {

                weather.daily.forEach(
                    forecast => {

                        weatherByDate.set(
                            forecast.date,
                            forecast
                        );

                    }
                );

            }

        }

        catch (error) {

            console.error(
                "Failed to load weather:",
                error
            );

        }


        /*
         * CALENDAR GRID
         */

        const grid =
            document.createElement("div");

        grid.className =
            "large-calendar-widget__grid";


        /*
         * DAY HEADERS
         */

        const dayNames = [
            "S",
            "M",
            "T",
            "W",
            "T",
            "F",
            "S"
        ];


        dayNames.forEach(
            dayName => {

                const dayHeader =
                    document.createElement("div");

                dayHeader.className =
                    "large-calendar-widget__day-name";

                dayHeader.textContent =
                    dayName;

                grid.appendChild(
                    dayHeader
                );

            }
        );


        /*
         * LOAD EVENTS
         */

        const eventsByDate =
            new Map();


        for (
            const calendarId
            of calendars
        ) {

            try {

                const events =
                    await getEventsForRange(
                        calendarId,
                        startDate,
                        endDate
                    );


                for (
                    const event
                    of events
                ) {

                    const eventDate =
                        getEventDate(
                            event
                        );


                    if (!eventDate) {

                        continue;

                    }


                    if (
                        !eventsByDate.has(
                            eventDate
                        )
                    ) {

                        eventsByDate.set(
                            eventDate,
                            []
                        );

                    }


                    eventsByDate
                        .get(eventDate)
                        .push({

                            ...event,

                            calendarId

                        });

                }

            }

            catch (error) {

                console.error(
                    "Failed to load calendar:",
                    calendarId,
                    error
                );

            }

        }


        /*
         * CREATE FOUR WEEKS
         */

        for (
            let i = 0;
            i < 28;
            i++
        ) {

            const date =
                new Date(startDate);

            date.setDate(
                startDate.getDate() + i
            );


            const dateKey =
                formatDateKey(
                    date
                );


            const isToday =
                dateKey ===
                formatDateKey(today);


            const isPast =
                dateKey <
                formatDateKey(today);


            const events =
                eventsByDate.get(
                    dateKey
                ) || [];


            const forecast =
                weatherByDate.get(
                    dateKey
                ) || null;


            grid.appendChild(
                createDay(
                    date,
                    isToday,
                    isPast,
                    events,
                    forecast,
                    i === 0
                )
            );

        }


        /*
         * ADD GRID
         */

        wrapper.appendChild(
            grid
        );

    }

};


/*
 * CREATE DAY
 */

function createDay(
    date,
    isToday,
    isPast,
    events,
    forecast,
    isFirstDate
) {

    const cell =
        document.createElement("div");

    cell.className =
        "large-calendar-widget__day";


    /*
     * TODAY
     */

    if (
        isToday
    ) {

        cell.classList.add(
            "large-calendar-widget__day--today"
        );

    }


    /*
     * PAST
     */

    if (
        isPast
    ) {

        cell.classList.add(
            "large-calendar-widget__day--past"
        );

    }


    /*
     * DATE
     */

    const number =
        document.createElement("div");

    number.className =
        "large-calendar-widget__day-number";


    if (
        date.getDate() === 1 ||
        isFirstDate
    ) {

        number.textContent =
            date.toLocaleDateString(
                undefined,
                {
                    month: "short"
                }
            );

    }

    else {

        number.textContent =
            date.getDate();

    }


    cell.appendChild(
        number
    );


    /*
     * WEATHER
     *
     * Always create the weather container.
     * This reserves identical vertical space
     * even when no forecast is available.
     */

    const weather =
        createWeather(
            forecast,
            isPast
        );

    cell.appendChild(
        weather
    );


    /*
     * SEPARATE ALL-DAY
     * AND TIMED EVENTS
     */

    const allDayEvents =
        events.filter(
            event =>
                event.allDay
        );


    const timedEvents =
        events.filter(
            event =>
                !event.allDay
        );


    /*
     * ALL-DAY EVENTS
     */

    if (
        allDayEvents.length
    ) {

        const allDayContainer =
            document.createElement("div");

        allDayContainer.className =
            "large-calendar-widget__all-day-events";


        allDayEvents.forEach(
            event => {

                allDayContainer.appendChild(
                    createAllDayEvent(
                        event
                    )
                );

            }
        );


        cell.appendChild(
            allDayContainer
        );

    }


    /*
     * TIMED EVENTS
     */

    if (
        timedEvents.length
    ) {

        const timedContainer =
            document.createElement("div");

        timedContainer.className =
            "large-calendar-widget__timed-events";


        timedEvents.forEach(
            event => {

                timedContainer.appendChild(
                    createEvent(
                        event
                    )
                );

            }
        );


        cell.appendChild(
            timedContainer
        );

    }


    return cell;

}


/*
 * CREATE WEATHER
 *
 * Returns a fixed-height weather row.
 *
 * If there is no forecast, the row remains
 * empty so all event lists stay aligned.
 */

function createWeather(
    forecast,
    isPast
) {

    const weather =
        document.createElement("div");

    weather.className =
        "large-calendar-widget__weather";


    if (
        !forecast ||
        isPast
    ) {

        return weather;

    }


    /*
     * ICON
     */

    const icon =
        document.createElement("span");

    icon.className =
        "large-calendar-widget__weather-icon";

    icon.textContent =
        getWeatherIcon(
            forecast.weatherCode
        );


    /*
     * HIGH
     */

    const high =
        document.createElement("span");

    high.className =
        "large-calendar-widget__weather-high";

    high.textContent =
        `${Math.round(forecast.high)}°`;


    /*
     * LOW
     */

    const low =
        document.createElement("span");

    low.className =
        "large-calendar-widget__weather-low";

    low.textContent =
        `${Math.round(forecast.low)}°`;


    /*
     * PRECIPITATION
     */

    const precipitation =
        document.createElement("span");

    precipitation.className =
        "large-calendar-widget__weather-precip";

    precipitation.textContent =
        `💧 ${forecast.precipitationProbability ?? 0}%`;


    /*
     * BUILD
     */

    weather.appendChild(
        icon
    );

    weather.appendChild(
        high
    );

    weather.appendChild(
        low
    );

    weather.appendChild(
        precipitation
    );


    return weather;

}


/*
 * WEATHER ICON
 *
 * Open-Meteo WMO weather codes.
 */

function getWeatherIcon(
    code
) {

    if (
        code === 0
    ) {

        return "☀️";

    }

    if (
        code === 1 ||
        code === 2
    ) {

        return "🌤️";

    }

    if (
        code === 3
    ) {

        return "☁️";

    }

    if (
        code === 45 ||
        code === 48
    ) {

        return "🌫️";

    }

    if (
        code >= 51 &&
        code <= 57
    ) {

        return "🌦️";

    }

    if (
        code >= 61 &&
        code <= 67
    ) {

        return "🌧️";

    }

    if (
        code >= 71 &&
        code <= 77
    ) {

        return "🌨️";

    }

    if (
        code >= 80 &&
        code <= 82
    ) {

        return "🌦️";

    }

    if (
        code >= 85 &&
        code <= 86
    ) {

        return "🌨️";

    }

    if (
        code >= 95 &&
        code <= 99
    ) {

        return "⛈️";

    }

    return "🌤️";

}


/*
 * CREATE ALL-DAY EVENT
 *
 * ICON → TITLE
 */

function createAllDayEvent(
    event
) {

    const item =
        document.createElement("div");

    item.className =
        "large-calendar-widget__all-day-event";


    const calendar =
        CALENDARS[
            event.calendarId
        ];


    /*
     * CALENDAR COLOR
     */

    const calendarColor =
        calendar?.color ||
        "#cccccc";


    item.style.backgroundColor =
        calendarColor;

    item.style.borderColor =
        calendarColor;


    /*
     * ICON
     */

    const icon =
        document.createElement("span");

    icon.className =
        `large-calendar-widget__event-icon fa-fw ${calendar?.icon || "far fa-calendar"}`;

    icon.style.color =
        "#ffffff";

    icon.innerHTML =
        "&nbsp;";


    /*
     * TITLE
     */

    const title =
        document.createElement("span");

    title.className =
        "large-calendar-widget__event-title";

    title.textContent =
        event.title;

    title.style.color =
        "#ffffff";


    /*
     * BUILD
     */

    item.appendChild(
        icon
    );

    item.appendChild(
        title
    );


    return item;

}


/*
 * CREATE TIMED EVENT
 *
 * ICON → TIME → TITLE
 */

function createEvent(
    event
) {

    const item =
        document.createElement("div");

    item.className =
        "large-calendar-widget__event";


    const calendar =
        CALENDARS[
            event.calendarId
        ];


    /*
     * ICON
     */

    const icon =
        document.createElement("span");

    icon.className =
        `large-calendar-widget__event-icon fa-fw ${calendar?.icon || "fal fa-calendar"}`;

    icon.style.color =
        calendar?.color || "#666666";

    icon.innerHTML =
        "&nbsp;";


    /*
     * TIME
     */

    const time =
        document.createElement("span");

    time.className =
        "large-calendar-widget__event-time";


    const start =
        new Date(
            event.start
        );


    const end =
        event.end
            ? new Date(
                event.end
            )
            : null;


    const startTime =
        start.toLocaleTimeString(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    const endTime =
        end
            ? end.toLocaleTimeString(
                undefined,
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            )
            : "";


    time.innerHTML =
        `<span class="large-calendar-widget__event-start">${startTime}</span>` +
        `<span class="large-calendar-widget__event-end">→ ${endTime}</span>`;


    /*
     * EVENT CONTENT
     */

    const content =
        document.createElement("div");

    content.className =
        "large-calendar-widget__event-content";


    /*
     * EVENT TITLE
     */

    const title =
        document.createElement("div");

    title.className =
        "large-calendar-widget__event-title";

    title.textContent =
        event.title;


    content.appendChild(
        title
    );


    /*
     * LOCATION
     */

    if (
        event.location
    ) {

        const location =
            document.createElement("div");

        location.className =
            "large-calendar-widget__event-location";

        location.textContent =
            `at ${event.location}`;


        content.appendChild(
            location
        );

    }


    /*
     * BUILD EVENT
     */

    item.appendChild(
        icon
    );

    item.appendChild(
        time
    );

    item.appendChild(
        content
    );


    return item;

}


/*
 * GET EVENT DATE
 */

function getEventDate(
    event
) {

    if (
        !event.start
    ) {

        return null;

    }


    /*
     * ALL-DAY EVENT
     */

    if (
        event.allDay
    ) {

        return event.start;

    }


    /*
     * TIMED EVENT
     */

    return formatDateKey(
        new Date(
            event.start
        )
    );

}


/*
 * FORMAT DATE KEY
 *
 * YYYY-MM-DD
 */

function formatDateKey(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;

}


export default largeCalendar;