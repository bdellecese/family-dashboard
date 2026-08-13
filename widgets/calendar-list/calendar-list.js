import {
    CALENDARS
} from "../../config/calendars.js";

import {
    getCalendars,
    getEventsForRange
} from "../../services/google-calendar/calendar-data.js";

import {
    enableTouchScroll
} from "../../services/ui/touch-scroll.js";


const calendarList = {

    name: "calendar-list",


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
         * ENABLE TOUCH SCROLLING
         */

        enableTouchScroll(
            wrapper
        );


        /*
         * CONFIGURATION
         */

        const calendarIds =
            config.calendars || [];


        const days =
            config.days || 7;


        /*
         * GET CALENDARS
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
         * DATE RANGE
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
         * GET EVENTS
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
         * SORT EVENTS
         */

        events.sort(
            (
                a,
                b
            ) =>
                new Date(a.start) -
                new Date(b.start)
        );


        /*
         * GROUP EVENTS BY DAY
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
         * RENDER EACH DAY
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
             * DATE HEADER
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
             * NO EVENTS
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
             * RENDER EVENTS
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
                     * TIME
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
                     * CALENDAR ICON
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
                     * TITLE
                     */

                    const title =
                        document.createElement(
                            "div"
                        );

                    title.className =
                        "calendar-list-widget__title";

                    title.textContent =
                        event.title;


                    /*
                     * BUILD EVENT ROW
                     *
                     * TIME → ICON → TITLE
                     */

                    item.appendChild(
                        time
                    );

                    item.appendChild(
                        icon
                    );

                    item.appendChild(
                        title
                    );


                    wrapper.appendChild(
                        item
                    );

                }
            );

        }

    }

};


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


export default calendarList;