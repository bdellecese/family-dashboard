import {
    CALENDARS
}
from "../../config/calendars.js";

import {
    getCalendars,
    getEventsForRange,
    GoogleCalendarAuthorizationRequiredError
}
from "../../services/google-calendar/calendar-data.js";

import {
    enableTouchScroll
}
from "../../services/ui/touch-scroll.js";


const calendarList = {

    name:
        "calendar-list",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "calendar-list-widget";

        container.appendChild(
            wrapper
        );


        /*
         * ========================================================
         * ENABLE TOUCH SCROLLING
         * ========================================================
         */

        enableTouchScroll(
            wrapper
        );


        /*
         * ========================================================
         * CONFIGURATION
         * ========================================================
         */

        const calendarIds =
            config.calendars || [];

        const days =
            config.days || 7;

        /*
         * Location display is opt-in.
         *
         * Existing screens therefore retain their current
         * behavior unless they explicitly set:
         *
         *     showLocation: true
         */

        const showLocation =
            config.showLocation === true;


        try {

            /*
             * ====================================================
             * GET CALENDARS
             * ====================================================
             */

            const calendars =
                await getCalendars();


            const selectedCalendars =
                calendars.filter(
                    calendar =>
                        calendarIds.includes(
                            calendar.id
                        )
                );


            /*
             * ====================================================
             * DATE RANGE
             * ====================================================
             */

            const start =
                new Date();

            start.setHours(
                0,
                0,
                0,
                0
            );


            const end =
                new Date(start);

            end.setDate(
                end.getDate() + days
            );


            /*
             * ====================================================
             * GET EVENTS
             * ====================================================
             */

            const eventGroups =
                await Promise.all(

                    selectedCalendars.map(
                        async calendar => {

                            const events =
                                await getEventsForRange(
                                    calendar.id,
                                    start,
                                    end
                                );


                            return events.map(
                                event => ({

                                    ...event,

                                    calendarName:
                                        calendar.name

                                })
                            );

                        }
                    )

                );


            const events =
                eventGroups.flat();


            /*
             * ====================================================
             * SORT EVENTS
             * ====================================================
             *
             * All-day events should always appear before timed
             * events on the same day.
             *
             * Within each group, events are sorted chronologically.
             *
             * This gives us:
             *
             *     All day
             *     All day
             *     8:00 AM
             *     10:30 AM
             *     3:00 PM
             * ====================================================
             */

            events.sort(
                (
                    a,
                    b
                ) => {

                    /*
                     * All-day events first.
                     */

                    if (
                        a.allDay &&
                        !b.allDay
                    ) {

                        return -1;

                    }


                    if (
                        !a.allDay &&
                        b.allDay
                    ) {

                        return 1;

                    }


                    /*
                     * Within the same type, sort by start time.
                     */

                    return (
                        new Date(a.start) -
                        new Date(b.start)
                    );

                }
            );


            /*
             * ====================================================
             * GROUP EVENTS BY DAY
             * ====================================================
             */

            const groupedEvents =
                new Map();


            events.forEach(
                event => {

                    const eventDate =
                        new Date(
                            event.start
                        );


                    const key =
                        `${eventDate.getFullYear()}-${String(
                            eventDate.getMonth() + 1
                        ).padStart(2, "0")}-${String(
                            eventDate.getDate()
                        ).padStart(2, "0")}`;


                    if (
                        !groupedEvents.has(key)
                    ) {

                        groupedEvents.set(
                            key,
                            {

                                date:
                                    eventDate,

                                events:
                                    []

                            }
                        );

                    }


                    groupedEvents
                        .get(key)
                        .events
                        .push(event);

                }
            );


            /*
             * ====================================================
             * RENDER EACH DAY
             * ====================================================
             */

            for (
                let i = 0;
                i < days;
                i++
            ) {

                const day =
                    new Date(start);


                day.setDate(
                    day.getDate() + i
                );


                const key =
                    `${day.getFullYear()}-${String(
                        day.getMonth() + 1
                    ).padStart(2, "0")}-${String(
                        day.getDate()
                    ).padStart(2, "0")}`;


                const dayData =
                    groupedEvents.get(key);


                /*
                 * =================================================
                 * DATE HEADER
                 * =================================================
                 */

                const dateHeader =
                    document.createElement(
                        "div"
                    );

                dateHeader.className =
                    "calendar-list-widget__day";


                const dayNumber =
                    document.createElement(
                        "span"
                    );

                dayNumber.className =
                    "calendar-list-widget__day-number";

                dayNumber.textContent =
                    day.getDate();


                const dayName =
                    document.createElement(
                        "span"
                    );

                dayName.className =
                    "calendar-list-widget__day-name";


                if (
                    i === 0
                ) {

                    dayName.textContent =
                        "Today";

                }

                else {

                    dayName.textContent =
                        day.toLocaleDateString(
                            undefined,
                            {
                                weekday:
                                    "long"
                            }
                        );

                }


                dateHeader.appendChild(
                    dayNumber
                );

                dateHeader.appendChild(
                    dayName
                );


                wrapper.appendChild(
                    dateHeader
                );


                /*
                 * =================================================
                 * NO EVENTS
                 * =================================================
                 */

                if (
                    !dayData ||
                    dayData.events.length === 0
                ) {

                    const empty =
                        document.createElement(
                            "div"
                        );

                    empty.className =
                        "calendar-list-widget__empty";

                    empty.textContent =
                        "No events";


                    wrapper.appendChild(
                        empty
                    );


                    continue;

                }


                /*
                 * =================================================
                 * RENDER EVENTS
                 * =================================================
                 */

                dayData.events.forEach(
                    event => {

                        const item =
                            document.createElement(
                                "div"
                            );

                        item.className =
                            "calendar-list-widget__item";


                        /*
                         * =================================================
                         * TIME
                         * =================================================
                         */

                        const time =
                            document.createElement(
                                "div"
                            );

                        time.className =
                            "calendar-list-widget__time";


                        if (
                            event.allDay
                        ) {

                            time.textContent =
                                "All day";

                        }

                        else {

                            const eventStart =
                                new Date(
                                    event.start
                                );


                            const eventEnd =
                                new Date(
                                    event.end
                                );


                            time.innerHTML =
                                `${formatTime(eventStart)} -<br>${formatTime(eventEnd)}`;

                        }


                        /*
                         * =================================================
                         * CALENDAR ICON
                         * =================================================
                         */

                        const icon =
                            document.createElement(
                                "i"
                            );


                        const calendarDisplay =
                            CALENDARS[
                                event.calendarId
                            ];


                        icon.className =
                            calendarDisplay?.icon ||
                            "fa-fw fas fa-calendar";


                        icon.style.color =
                            calendarDisplay?.color ||
                            "white";


                        /*
                         * =================================================
                         * EVENT CONTENT
                         * =================================================
                         */

                        const content =
                            document.createElement(
                                "div"
                            );

                        content.className =
                            "calendar-list-widget__content";


                        /*
                         * =================================================
                         * TITLE
                         * =================================================
                         */

                        const title =
                            document.createElement(
                                "div"
                            );

                        title.className =
                            "calendar-list-widget__title";

                        title.textContent =
                            event.title;


                        content.appendChild(
                            title
                        );


                        /*
                         * =================================================
                         * LOCATION
                         * =================================================
                         *
                         * Location display is opt-in.
                         *
                         * Google Calendar event locations are expected
                         * on event.location.
                         * =================================================
                         */

                        if (
                            showLocation &&
                            event.location
                        ) {

                            const location =
                                document.createElement(
                                    "div"
                                );

                            location.className =
                                "calendar-list-widget__location";

                            location.textContent =
                                event.location;

                            location.textContent =
                                `at ${formatEventLocation(
                                    event.location
                                )}`;



                            content.appendChild(
                                location
                            );

                        }


                        /*
                         * =================================================
                         * BUILD EVENT ROW
                         *
                         * TIME → ICON → CONTENT
                         * =================================================
                         */

                        item.appendChild(
                            time
                        );

                        item.appendChild(
                            icon
                        );

                        item.appendChild(
                            content
                        );


                        wrapper.appendChild(
                            item
                        );

                    }
                );

            }

        }

        catch (error) {

            /*
             * ========================================================
             * GOOGLE CALENDAR AUTHORIZATION REQUIRED
             * ========================================================
             */

            if (
                error instanceof
                GoogleCalendarAuthorizationRequiredError
            ) {

                renderAuthorizationRequired(
                    wrapper
                );

                return;

            }


            /*
             * ========================================================
             * OTHER CALENDAR ERROR
             * ========================================================
             */

            console.error(
                "Calendar list widget error:",
                error
            );


            renderCalendarError(
                wrapper
            );

        }

    }

};


/*
 * ============================================================
 * AUTHORIZATION REQUIRED STATE
 * ============================================================
 */

function renderAuthorizationRequired(
    wrapper
) {

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "calendar-list-widget__authorization";


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "calendar-list-widget__authorization-title";

    title.textContent =
        "Google Calendar authorization required";


    const description =
        document.createElement(
            "div"
        );

    description.className =
        "calendar-list-widget__authorization-message";

    description.textContent =
        "Google Calendar access has expired or been revoked. Reauthorize Google Calendar to restore your calendar.";


    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "calendar-list-widget__authorization-button";

    button.textContent =
        "Reauthorize Google Calendar";


    button.addEventListener(
        "click",
        () => {

            window.location.href =
                "/api/google-calendar/auth";

        }
    );


    message.appendChild(
        title
    );

    message.appendChild(
        description
    );

    message.appendChild(
        button
    );


    wrapper.appendChild(
        message
    );

}


/*
 * ============================================================
 * GENERAL ERROR STATE
 * ============================================================
 */

function renderCalendarError(
    wrapper
) {

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "calendar-list-widget__authorization";


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "calendar-list-widget__authorization-title";

    title.textContent =
        "Unable to load Google Calendar";


    const description =
        document.createElement(
            "div"
        );

    description.className =
        "calendar-list-widget__authorization-message";

    description.textContent =
        "Google Calendar could not be loaded. Please try again later.";


    message.appendChild(
        title
    );

    message.appendChild(
        description
    );


    wrapper.appendChild(
        message
    );

}


/*
 * ============================================================
 * FORMAT TIME
 * ============================================================
 */

function formatTime(
    date
) {

    return date.toLocaleTimeString(
        undefined,
        {
            hour:
                "numeric",

            minute:
                "2-digit",

            hour12:
                true
        }
    )
    .toLowerCase();

}

/*
 * ============================================================
 * FORMAT EVENT LOCATION
 * ============================================================
 *
 * Online meeting URLs can be extremely long and consume
 * significant space in the calendar display.
 *
 * If the location contains an HTTP/HTTPS URL anywhere,
 * treat it as an online meeting.
 */

function formatEventLocation(
    location
) {

    const value =
        String(
            location || ""
        )
        .trim();

    if (
        !value
    ) {

        return "";

    }


    /*
     * Detect a URL anywhere in the location.
     *
     * This handles:
     *
     * https://teams.microsoft.com/...
     * Video, https://teams.microsoft.com/...
     * Zoom: https://zoom.us/...
     * Google Meet - https://meet.google.com/...
     */

    if (
        /https?:\/\//i.test(
            value
        )
    ) {

        return "Online meeting";

    }


    return value;

}


export default calendarList;