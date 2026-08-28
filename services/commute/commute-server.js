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
     * Get live travel times
     * ----------------------------------------
     *
     * Only request driving times for
     * destinations that actually have a
     * matching event today.
     * ----------------------------------------
     */

    const currentMinutesByDestination =
        {};


    for (
        const destination of
        COMMUTE_DESTINATIONS
    ) {

        const matchingEvent =
            findMatchingEvent(
                destination,
                calendarEvents
            );


        if (
            !matchingEvent
        ) {

            continue;

        }


        try {

            currentMinutesByDestination[
                destination.id
            ] =
                await getDrivingDuration(
                    destination.address
                );

        }

        catch (error) {

            console.error(
                `Commute lookup failed for ${destination.name}:`,
                error.message
            );

        }

    }


    /*
     * ----------------------------------------
     * Calculate commute data
     * ----------------------------------------
     */

    return await getCommuteData(
        currentMinutesByDestination,
        now,
        calendarEvents
    );

}


/*
 * ============================================
 * FIND MATCHING EVENT
 * ============================================
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
     * Only consider events from the configured
     * calendar.
     * ----------------------------------------
     */

    const events =
        calendarEvents.filter(
            event =>
                event.calendarId ===
                match.calendarId
        );


    /*
     * ----------------------------------------
     * Match any event on the calendar
     * ----------------------------------------
     */

    if (
        match.type === "calendar"
    ) {

        return (
            events[0] ||
            null
        );

    }


    /*
     * ----------------------------------------
     * Match event title
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
            events.find(
                event =>
                    String(
                        event.title || ""
                    )
                    .toLowerCase()
                    .includes(
                        searchValue
                    )
            ) ||
            null
        );

    }


    return null;

}