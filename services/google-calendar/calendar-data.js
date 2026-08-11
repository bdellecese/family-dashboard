import {
    getAccessToken
} from "./calendar-auth.js";

import {
    getCached,
    setCached
} from "../cache/cache.js";


const CALENDAR_API =
    "https://www.googleapis.com/calendar/v3";


const CALENDAR_CACHE_DURATION =
    30 * 60 * 1000;


const EVENTS_CACHE_DURATION =
    5 * 60 * 1000;


/*
 * GET CALENDARS
 */

export async function getCalendars() {

    const cacheKey =
        "google-calendar:v2:calendars";    


    const cached =
        getCached(
            cacheKey,
            CALENDAR_CACHE_DURATION
        );


    if (cached) {

        return cached;

    }


    const accessToken =
        await getAccessToken();


    const response =
        await fetch(
            `${CALENDAR_API}/users/me/calendarList`,
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );


    if (!response.ok) {

        throw new Error(
            `Google Calendar API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    const calendars =
        (data.items || []).map(
            calendar => ({

                id:
                    calendar.id,

                name:
                    calendar.summary ||
                    "(Unnamed calendar)",

                description:
                    calendar.description ||
                    "",

                primary:
                    calendar.primary ||
                    false,

                accessRole:
                    calendar.accessRole,

                color:
                    calendar.backgroundColor

            })
        );


    setCached(
        cacheKey,
        calendars
    );


    return calendars;

}


/*
 * GET EVENTS
 */

export async function getEventsForRange(
    calendarId,
    start,
    end
) {

    const cacheKey =
    `google-calendar:v2:events:${calendarId}:${start.toISOString()}:${end.toISOString()}`;    

    const cached =
        getCached(
            cacheKey,
            EVENTS_CACHE_DURATION
        );


    if (cached) {

        return cached;

    }


    const accessToken =
        await getAccessToken();


    const params =
        new URLSearchParams({

            timeMin:
                start.toISOString(),

            timeMax:
                end.toISOString(),

            singleEvents:
                "true",

            orderBy:
                "startTime"

        });


    const response =
        await fetch(
            `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );


    if (!response.ok) {

        throw new Error(
            `Google Calendar API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    const events =
        (data.items || []).map(
            event => ({

                id:
                    event.id,

                calendarId:
                    calendarId,

                title:
                    event.summary ||
                    "(No title)",

                description:
                    event.description ||
                    "",

                location:
                    event.location ||
                    "",

                start:
                    event.start?.dateTime ||
                    event.start?.date,

                end:
                    event.end?.dateTime ||
                    event.end?.date,

                allDay:
                    Boolean(
                        event.start?.date
                    ),

                status:
                    event.status,

                htmlLink:
                    event.htmlLink ||
                    null

            })
        );


    setCached(
        cacheKey,
        events
    );


    return events;

}