// ============================================================
// GOOGLE CALENDAR CLIENT DATA
//
// Calendar authentication and Google API access are handled
// by the Node server. The browser only talks to same-origin
// server endpoints.
// ============================================================


// ============================================================
// AUTHORIZATION ERROR
// ============================================================

export class GoogleCalendarAuthorizationRequiredError
    extends Error {

    constructor(
        message =
            "Google Calendar authorization is required. Please reauthorize Google Calendar."
    ) {

        super(message);

        this.name =
            "GoogleCalendarAuthorizationRequiredError";

    }

}


// ============================================================
// GET CALENDARS
// ============================================================

export async function getCalendars() {

    const response =
        await fetch(
            "/api/google-calendar/calendars"
        );


    if (
        response.status === 401
    ) {

        const data =
            await response.json();

        if (
            data.error ===
            "authorization_required"
        ) {

            throw new GoogleCalendarAuthorizationRequiredError(
                data.message
            );

        }

    }


    if (!response.ok) {

        const body =
            await response.text();

        throw new Error(
            `Google Calendar API error: ${response.status} ${body}`
        );

    }


    const data =
        await response.json();


    return data;

}


// ============================================================
// GET EVENTS
// ============================================================

export async function getEventsForRange(

    calendarId,

    start,

    end

) {

    const params =
        new URLSearchParams({

            calendarId:
                calendarId,

            start:
                start.toISOString(),

            end:
                end.toISOString()

        });


    const response =
        await fetch(
            `/api/google-calendar/events?${params.toString()}`
        );


    if (
        response.status === 401
    ) {

        const data =
            await response.json();

        if (
            data.error ===
            "authorization_required"
        ) {

            throw new GoogleCalendarAuthorizationRequiredError(
                data.message
            );

        }

    }


    if (!response.ok) {

        const body =
            await response.text();

        throw new Error(
            `Google Calendar API error: ${response.status} ${body}`
        );

    }


    const data =
        await response.json();


    return data;

}