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
     * Check AM window
     * ----------------------------------------
     */

    const currentTime =
        getTimeString(now);


    if (
        currentTime <
            COMMUTE_SETTINGS.amStart ||
        currentTime >=
            COMMUTE_SETTINGS.amEnd
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
                 * Find today's matching event
                 * --------------------------------
                 */

                const matchingEvent =
                    findMatchingEvent(
                        destination,
                        calendarEvents
                    );


                /*
                 * No relevant event today
                 */

                if (
                    !matchingEvent
                ) {

                    return null;

                }


                /*
                 * --------------------------------
                 * Get live travel time
                 * --------------------------------
                 */

                const currentMinutes =
                    currentMinutesByDestination[
                        destination.id
                    ];


                /*
                 * No travel data available
                 */

                if (
                    currentMinutes === undefined
                ) {

                    return null;

                }


                /*
                 * --------------------------------
                 * Calculate delay
                 * --------------------------------
                 */

                const delayMinutes =
                    currentMinutes -
                    destination.normalMinutes;


                /*
                 * --------------------------------
                 * Determine arrival time
                 *
                 * The calendar event determines
                 * when she needs to arrive.
                 * --------------------------------
                 */

                const arriveBy =
                    getEventStartTime(
                        matchingEvent
                    );


                /*
                 * --------------------------------
                 * Calculate leave-by time
                 *
                 * Arrival buffer is added to the
                 * travel time.
                 * --------------------------------
                 */

                const leaveBy =
                    calculateLeaveBy(
                        arriveBy,
                        currentMinutes,
                        destination.arrivalBufferMinutes || 0,
                        now
                    );


                return {

                    id:
                        destination.id,

                    name:
                        destination.name,

                    address:
                        destination.address,

                    currentMinutes,

                    normalMinutes:
                        destination.normalMinutes,

                    delayMinutes,

                    arriveBy,

                    arrivalBufferMinutes:
                        destination.arrivalBufferMinutes || 0,

                    leaveBy,

                    event: {

                        id:
                            matchingEvent.id,

                        title:
                            matchingEvent.title,

                        start:
                            matchingEvent.start,

                        end:
                            matchingEvent.end,

                        location:
                            matchingEvent.location

                    },

                    status:
                        getStatus(
                            delayMinutes
                        )

                };

            }
        )
        .filter(
            Boolean
        );

}


/*
 * ============================================
 * FIND MATCHING EVENT
 * ============================================
 *
 * Matching behavior comes from the
 * destination.calendarMatch configuration.
 *
 * type: "calendar"
 *     Matches any event on the specified
 *     calendar.
 *
 * type: "title"
 *     Matches an event whose title contains
 *     the configured value.
 */

function findMatchingEvent(
    destination,
    calendarEvents
) {

    const match =
        destination.calendarMatch;


    if (
        !match
    ) {

        return null;

    }


    /*
     * ----------------------------------------
     * Match by calendar
     * ----------------------------------------
     */

    if (
        match.type === "calendar"
    ) {

        return (
            calendarEvents.find(
                event =>
                    event.calendarId ===
                    match.calendarId
            ) || null
        );

    }


    /*
     * ----------------------------------------
     * Match by title
     * ----------------------------------------
     */

    if (
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

            return null;

        }

        return (
            calendarEvents.find(
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
            ) || null
        );
    }


    return null;

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
 * STATUS
 * ============================================
 */

function getStatus(
    delayMinutes
) {

    if (
        delayMinutes <= 2
    ) {

        return "normal";

    }


    if (
        delayMinutes <= 5
    ) {

        return "slower";

    }


    return "delayed";

}


/*
 * ============================================
 * LEAVE BY
 * ============================================
 */

function calculateLeaveBy(
    arriveBy,
    travelMinutes,
    arrivalBufferMinutes,
    now
) {

    if (
        !arriveBy
    ) {

        return null;

    }


    const [
        hours,
        minutes
    ] =
        arriveBy
            .split(":")
            .map(Number);


    const arrival =
        new Date(
            now
        );


    arrival.setHours(
        hours,
        minutes,
        0,
        0
    );


    /*
     * Leave early enough to cover both:
     *
     *   1. current travel time
     *   2. configured arrival buffer
     */

    arrival.setMinutes(
        arrival.getMinutes() -
        travelMinutes -
        arrivalBufferMinutes
    );


    return getTimeString(
        arrival
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