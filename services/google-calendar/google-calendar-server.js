import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { GOOGLE_CALENDAR } from "../../config/google-calendar.js";

const CALENDAR_API =
    "https://www.googleapis.com/calendar/v3";

const CALENDAR_SCOPE =
    "https://www.googleapis.com/auth/calendar.readonly";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_FILE =
    path.resolve(__dirname, "../../config/google-calendar-token.json");

let accessToken = null;
let accessTokenExpiresAt = 0;
let refreshToken = null;
let authorizationRequired = false;

// ============================================================
// TOKEN STORAGE
// ============================================================

function loadRefreshToken() {

    try {

        if (!fs.existsSync(TOKEN_FILE)) {
            return null;
        }

        const data =
            JSON.parse(
                fs.readFileSync(
                    TOKEN_FILE,
                    "utf8"
                )
            );

        return data.refresh_token || null;

    } catch (error) {

        console.error(
            "Failed to load Google Calendar token:",
            error
        );

        return null;
    }
}

function saveRefreshToken(
    token
) {

    fs.writeFileSync(
        TOKEN_FILE,
        JSON.stringify(
            {
                refresh_token: token
            },
            null,
            2
        ),
        {
            mode: 0o600
        }
    );

    refreshToken =
        token;
}

refreshToken =
    loadRefreshToken();

// ============================================================
// GOOGLE OAUTH AUTH URL
// ============================================================

export function getGoogleCalendarAuthUrl() {

    const params =
        new URLSearchParams({

            client_id:
                GOOGLE_CALENDAR.clientId,

            redirect_uri:
                GOOGLE_CALENDAR.redirectUri,

            response_type:
                "code",

            scope:
                CALENDAR_SCOPE,

            access_type:
                "offline",

            prompt:
                "consent"
        });

    return (
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        params.toString()
    );
}

// ============================================================
// EXCHANGE AUTHORIZATION CODE
// ============================================================

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
                            GOOGLE_CALENDAR.clientId,

                        client_secret:
                            GOOGLE_CALENDAR.clientSecret,

                        redirect_uri:
                            GOOGLE_CALENDAR.redirectUri,

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

    if (
        data.refresh_token
    ) {

        saveRefreshToken(
            data.refresh_token
        );
    }

    authorizationRequired = false;

    return data;


}

// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

async function refreshGoogleAccessToken() {

    if (
        authorizationRequired
    ) {

        throw new Error(
            "Google Calendar authorization required. Reauthorize Google Calendar."
        );
    }

    if (
        !refreshToken
    ) {

        throw new Error(
            "Google Calendar is not authorized. Complete the Google authorization flow first."
        );
    }

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

                        client_id:
                            GOOGLE_CALENDAR.clientId,

                        client_secret:
                            GOOGLE_CALENDAR.clientSecret,

                        refresh_token:
                            refreshToken,

                        grant_type:
                            "refresh_token"
                    })
            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        if (
            response.status === 400 &&
            data.error === "invalid_grant"
        ) {

            authorizationRequired = true;

            accessToken = null;
            accessTokenExpiresAt = 0;

            console.error(
                "Google Calendar authorization required: refresh token is expired or revoked."
            );

            throw new Error(
                "Google Calendar authorization required. Reauthorize Google Calendar."
            );
        }

        throw new Error(
            `Google OAuth token refresh failed: ${response.status} ${JSON.stringify(data)}`
        );
    }

    accessToken =
        data.access_token;

    accessTokenExpiresAt =
        Date.now() +
        ((data.expires_in || 3600) * 1000);

    return accessToken;
}

// ============================================================
// GET ACCESS TOKEN
// ============================================================

export async function getGoogleCalendarAccessToken() {

    if (
        accessToken &&
        Date.now() <
            accessTokenExpiresAt - 60000
    ) {

        return accessToken;
    }

    return await refreshGoogleAccessToken();
}

// ============================================================
// GET CALENDARS
// ============================================================

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

// ============================================================
// GET EVENTS
// ============================================================

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

// ============================================================
// AUTHORIZATION STATUS
// ============================================================

export function getGoogleCalendarAuthorizationStatus() {

    return {
        authorizationRequired:
            authorizationRequired
    };
}