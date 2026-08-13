// ============================================================
// GOOGLE CALENDAR CLIENT DATA
//
// Calendar authentication and Google API access are handled
// by the Node server. The browser only talks to same-origin
// server endpoints.
// ============================================================

// ============================================================
// GET CALENDARS
// ============================================================

export async function getCalendars() {

    const response =
        await fetch(
            "/api/google-calendar/calendars"
        );

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