// ============================================================
// GOOGLE CALENDAR CLIENT AUTH
//
// Google OAuth is handled by the Node server.
// The browser does NOT perform Google authentication directly.
// ============================================================

const API_BASE = "";

// ============================================================
// GET CALENDARS
// ============================================================

export async function getCalendars() {

    const response =
        await fetch(
            `${API_BASE}/api/google-calendar/calendars`
        );

    if (!response.ok) {

        const body =
            await response.text();

        throw new Error(
            `Google Calendar calendars API error: ${response.status} ${body}`
        );
    }

    return await response.json();
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
            `${API_BASE}/api/google-calendar/events?${params}`
        );

    if (!response.ok) {

        const body =
            await response.text();

        throw new Error(
            `Google Calendar events API error: ${response.status} ${body}`
        );
    }

    return await response.json();
}

// ============================================================
// AUTH
//
// Kept for compatibility with existing imports.
// The server handles authentication.
// ============================================================

export async function signInToGoogle() {

    const response =
        await fetch(
            `${API_BASE}/api/google-calendar/status`
        );

    if (!response.ok) {

        throw new Error(
            "Unable to contact Google Calendar server."
        );
    }

    return await response.json();
}

export async function getAccessToken() {

    return null;
}

export function clearAccessToken() {

    // Authentication is maintained by the server.
    return;
}