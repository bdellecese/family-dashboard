import {
    getCommuteData
} from "./commute-data.js";

import {
    getDrivingDuration
} from "./google-routes.js";

import {
    COMMUTE_DESTINATIONS
} from "../../config/commute.js";

import {
    getEventsForRange
} from "../google-calendar/google-calendar-server.js";


/*
 * ============================================
 * COMMUTE API
 * ============================================
 */

export async function getCommute() {

    const now =
        new Date();


    /*
     * ----------------------------------------
     * Today's calendar range
     * ----------------------------------------
     */

    const startOfDay =
        new Date(
            now
        );

    startOfDay.setHours(
        0,
        0,
        0,
        0
    );


    const endOfDay =
        new Date(
            now
        );

    endOfDay.setHours(
        23,
        59,
        59,
        999
    );


    /*
     * ----------------------------------------
     * Get unique calendars configured for
     * commute destinations
     * ----------------------------------------
     */

    const calendarIds = [
        ...new Set(
            COMMUTE_DESTINATIONS
                .map(
                    destination =>
                        destination
                            .calendarMatch
                            ?.calendarId
                )
                .filter(
                    Boolean
                )
        )
    ];


    /*
     * ----------------------------------------
     * Get today's events
     * ----------------------------------------
     */

    const calendarEvents = [];


    for (
        const calendarId of
        calendarIds
    ) {

        try {

            const events =
                await getEventsForRange(
                    calendarId,
                    startOfDay,
                    endOfDay
                );


            calendarEvents.push(
                ...events
            );

        }

        catch (error) {

            console.error(
                `Commute calendar lookup failed for ${calendarId}:`,
                error.message
            );

        }

    }


    /*
     * ----------------------------------------
     * Build base commute data
     * ----------------------------------------
     *
     * This determines the next two matching
     * events for each configured destination.
     * ----------------------------------------
     */

    const commuteData =
        await getCommuteData(
            {},
            now,
            calendarEvents
        );


    /*
     * ----------------------------------------
     * Calculate live travel time
     * ----------------------------------------
     *
     * Travel time is calculated per event
     * because each event may have a different
     * destination.
     * ----------------------------------------
     */

    for (
        const destination of
        commuteData
    ) {

        for (
            const event of
            destination.events
        ) {

            /*
             * --------------------------------
             * Determine destination address
             * --------------------------------
             *
             * Configured address takes priority.
             *
             * If there is no configured address,
             * use the event location.
             * --------------------------------
             */

            const address =
                event.address;


            /*
             * --------------------------------
             * No address available
             * --------------------------------
             */

            if (
                !address
            ) {

                console.warn(
                    `No commute address available for ${event.title}`
                );

                event.currentMinutes =
                    null;

                event.leaveBy =
                    null;

                continue;

            }


            /*
             * --------------------------------
             * Get live driving duration
             * --------------------------------
             */

            try {

                const currentMinutes =
                    await getDrivingDuration(
                        address
                    );


                event.currentMinutes =
                    currentMinutes;


                /*
                 * --------------------------------
                 * Calculate leave-by time
                 * --------------------------------
                 */

                event.leaveBy =
                    calculateLeaveBy(
                        event.arriveBy,
                        currentMinutes,
                        destination.arrivalBufferMinutes,
                        now
                    );


                /*
                 * --------------------------------
                 * Calculate delay/status only
                 * when normalMinutes is configured.
                 * --------------------------------
                 */

                if (
                    destination.normalMinutes !==
                    undefined &&
                    destination.normalMinutes !==
                    null
                ) {

                    event.normalMinutes =
                        destination.normalMinutes;

                    event.delayMinutes =
                        currentMinutes -
                        destination.normalMinutes;

                    event.status =
                        getStatus(
                            event.delayMinutes
                        );

                }

            }

            catch (error) {

                console.error(
                    `Commute lookup failed for ${event.title}:`,
                    error.message
                );

                event.currentMinutes =
                    null;

                event.leaveBy =
                    null;

            }

        }

    }


    /*
     * ----------------------------------------
     * Remove events where travel time could
     * not be determined.
     * ----------------------------------------
     */

    return commuteData
        .map(
            destination => {

                destination.events =
                    destination.events.filter(
                        event =>
                            event.currentMinutes !== null
                    );

                return destination;

            }
        )
        .filter(
            destination =>
                destination.events.length > 0
        );

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
        !arriveBy ||
        travelMinutes === null ||
        travelMinutes === undefined
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
     * Leave early enough to cover:
     *
     *   1. current travel time
     *   2. configured arrival buffer
     */

    arrival.setMinutes(
        arrival.getMinutes() -
        travelMinutes -
        (arrivalBufferMinutes || 0)
    );


    return getTimeString(
        arrival
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