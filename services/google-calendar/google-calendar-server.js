import { GOOGLE_CALENDAR_CONFIG } from "../../config/config.js";

const CALENDAR_API =
    "https://www.googleapis.com/calendar/v3";

const CALENDAR_SCOPE =
    "https://www.googleapis.com/auth/calendar.readonly";

let accessToken = null;
let accessTokenExpiresAt = 0;

export function getGoogleCalendarAuthUrl() {
    const params = new URLSearchParams({
        client_id: GOOGLE_CALENDAR_CONFIG.clientId,
        redirect_uri: GOOGLE_CALENDAR_CONFIG.redirectUri,
        response_type: "code",
        scope: CALENDAR_SCOPE,
        access_type: "offline",
        prompt: "consent"
    });

    return (
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        params.toString()
    );
}

export async function exchangeGoogleCode(
    code
) {

    const response =
        await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    new URLSearchParams({
                        code,
                        client_id:
                            GOOGLE_CALENDAR_CONFIG.clientId,
                        client_secret:
                            GOOGLE_CALENDAR_CONFIG.clientSecret,
                        redirect_uri:
                            GOOGLE_CALENDAR_CONFIG.redirectUri,
                        grant_type:
                            "authorization_code"
                    })
            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            `Google OAuth token exchange failed: ${response.status} ${JSON.stringify(data)}`
        );
    }

    accessToken =
        data.access_token;

    accessTokenExpiresAt =
        Date.now() +
        ((data.expires_in || 3600) * 1000);

    return data;
}

export async function getGoogleCalendarAccessToken() {

    if (
        accessToken &&
        Date.now() <
            accessTokenExpiresAt - 60000
    ) {

        return accessToken;
    }

    throw new Error(
        "Google Calendar is not authorized. Complete the Google authorization flow first."
    );
}

export async function getCalendars() {

    const token =
        await getGoogleCalendarAccessToken();

    const response =
        await fetch(
            `${CALENDAR_API}/users/me/calendarList`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            `Google Calendar API error: ${response.status} ${JSON.stringify(data)}`
        );
    }

    return (
        data.items || []
    ).map(
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
}

export async function getEventsForRange(
    calendarId,
    start,
    end
) {

    const token =
        await getGoogleCalendarAccessToken();

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
                        `Bearer ${token}`
                }
            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            `Google Calendar API error: ${response.status} ${JSON.stringify(data)}`
        );
    }

    return (
        data.items || []
    ).map(
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
}
