import {
    COMMUTE_SETTINGS,
    COMMUTE_DESTINATIONS
} from "../../config/commute.js";


/*
 * ============================================
 * GET COMMUTE DATA
 * ============================================
 */

export async function getCommuteData(
    currentMinutesByDestination = {},
    now = new Date(),
    calendarEvents = []
) {

    /*
     * ----------------------------------------
     * Check schedule
     * ----------------------------------------
     */

    const day =
        new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long"
            }
        ).format(
            now
        );


    if (
        !COMMUTE_SETTINGS.activeDays.includes(
            day
        )
    ) {

        return [];

    }


    /*
     * ----------------------------------------
     * Build commute data
     * ----------------------------------------
     */

    return COMMUTE_DESTINATIONS
        .map(
            destination => {

                /*
                 * --------------------------------
                 * Find today's next matching events
                 * --------------------------------
                 */

                const matchingEvents =
                    findMatchingEvents(
                        destination,
                        calendarEvents,
                        now
                    );


                /*
                 * No relevant events remaining
                 * today.
                 */

                if (
                    matchingEvents.length === 0
                ) {

                    return null;

                }


                /*
                 * --------------------------------
                 * Build upcoming events
                 * --------------------------------
                 *
                 * Each event gets its own resolved
                 * destination address.
                 *
                 * Priority:
                 *
                 *   1. destination.address
                 *   2. event.location
                 *
                 * This allows sports events to have
                 * different destinations.
                 * --------------------------------
                 */

                const events =
                    matchingEvents.map(
                        event => {

                            const address =
                                destination.address ||
                                event.location ||
                                null;


                            return {

                                id:
                                    event.id,

                                title:
                                    event.title,

                                start:
                                    event.start,

                                end:
                                    event.end,

                                /*
                                 * Original calendar
                                 * location.
                                 */

                                location:
                                    event.location,

                                /*
                                 * Resolved commute
                                 * destination.
                                 *
                                 * Config address wins.
                                 * Otherwise use the
                                 * event location.
                                 */

                                address,

                                /*
                                 * Event start is the
                                 * required arrival time.
                                 */

                                arriveBy:
                                    getEventStartTime(
                                        event
                                    ),

                                /*
                                 * Populated later by
                                 * commute-server.js.
                                 */

                                currentMinutes:
                                    null,

                                leaveBy:
                                    null

                            };

                        }
                    );


                /*
                 * --------------------------------
                 * Return destination
                 * --------------------------------
                 */

                return {

                    id:
                        destination.id,

                    name:
                        destination.name,

                    /*
                     * Keep configured address
                     * when one exists.
                     *
                     * Otherwise this remains null
                     * because the actual address is
                     * event-specific.
                     */

                    address:
                        destination.address ||
                        null,

                    /*
                     * Optional.
                     *
                     * Only destinations that have
                     * normalMinutes configured will
                     * have delay/status comparisons.
                     */

                    normalMinutes:
                        destination.normalMinutes,

                    arrivalBufferMinutes:
                        destination.arrivalBufferMinutes || 0,

                    events

                };

            }
        )
        .filter(
            Boolean
        );

}


/*
 * ============================================
 * FIND MATCHING EVENTS
 * ============================================
 *
 * Returns up to two matching events occurring
 * later today.
 *
 * Events whose start time has already passed
 * are ignored.
 *
 * Matching behavior comes from the
 * destination.calendarMatch configuration.
 */

function findMatchingEvents(
    destination,
    calendarEvents,
    now
) {

    const match =
        destination.calendarMatch;


    if (
        !match
    ) {

        return [];

    }


    /*
     * ----------------------------------------
     * Find matching events
     * ----------------------------------------
     */

    let matchingEvents;


    /*
     * MATCH BY CALENDAR
     */

    if (
        match.type === "calendar"
    ) {

        matchingEvents =
            calendarEvents.filter(
                event =>
                    event.calendarId ===
                    match.calendarId
            );

    }


    /*
     * MATCH BY TITLE
     */

    else if (
        match.type === "title"
    ) {

        const searchValue =
            String(
                match.value || ""
            )
            .trim()
            .toLowerCase();


        if (
            !searchValue
        ) {

            return [];

        }


        matchingEvents =
            calendarEvents.filter(
                event =>
                    event.calendarId ===
                        match.calendarId &&
                    String(
                        event.title || ""
                    )
                    .toLowerCase()
                    .includes(
                        searchValue
                    )
            );

    }


    else {

        return [];

    }


    /*
     * ----------------------------------------
     * Keep timed events that have not started
     * yet.
     *
     * All-day events are excluded because they
     * do not provide a useful arrival time.
     * ----------------------------------------
     */

    matchingEvents =
        matchingEvents.filter(
            event => {

                if (
                    !event.start ||
                    !event.start.includes("T")
                ) {

                    return false;

                }


                const eventStart =
                    new Date(
                        event.start
                    );


                if (
                    Number.isNaN(
                        eventStart.getTime()
                    )
                ) {

                    return false;

                }


                return (
                    eventStart > now
                );

            }
        );


    /*
     * ----------------------------------------
     * Sort chronologically.
     * ----------------------------------------
     */

    matchingEvents.sort(
        (a, b) => {

            return (
                new Date(a.start).getTime() -
                new Date(b.start).getTime()
            );

        }
    );


    /*
     * ----------------------------------------
     * Return the next two events only.
     * ----------------------------------------
     */

    return matchingEvents.slice(
        0,
        2
    );

}


/*
 * ============================================
 * EVENT START TIME
 * ============================================
 */

function getEventStartTime(
    event
) {

    if (
        !event ||
        !event.start
    ) {

        return null;

    }


    /*
     * ----------------------------------------
     * All-day events do not provide a useful
     * arrival time for commute purposes.
     * ----------------------------------------
     */

    if (
        !event.start.includes("T")
    ) {

        return null;

    }


    const eventStart =
        new Date(
            event.start
        );


    if (
        Number.isNaN(
            eventStart.getTime()
        )
    ) {

        return null;

    }


    return getTimeString(
        eventStart
    );

}


/*
 * ============================================
 * TIME STRING
 * ============================================
 */

function getTimeString(
    date
) {

    return new Intl.DateTimeFormat(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    )
    .format(date);

}