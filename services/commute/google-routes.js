import {
    COMMUTE_ORIGIN
} from "../../config/commute.js";

import {
    GOOGLE_ROUTES
} from "../../config/google-routes.js";


const GOOGLE_ROUTES_URL =
    "https://routes.googleapis.com/directions/v2:computeRoutes";


/*
 * ============================================
 * GET DRIVING DURATION
 * ============================================
 */

export async function getDrivingDuration(
    destination
) {

    if (
        !COMMUTE_ORIGIN ||
        !destination
    ) {

        throw new Error(
            "Origin and destination are required."
        );

    }


    if (
        !GOOGLE_ROUTES.apiKey
    ) {

        throw new Error(
            "Google Routes API key is not configured."
        );

    }


    const response =
        await fetch(
            GOOGLE_ROUTES_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "X-Goog-Api-Key":
                        GOOGLE_ROUTES.apiKey,

                    "X-Goog-FieldMask":
                        "routes.duration"

                },

                body:
                    JSON.stringify({

                        origin: {

                            address:
                                COMMUTE_ORIGIN

                        },

                        destination: {

                            address:
                                destination

                        },

                        travelMode:
                            "DRIVE",

                        routingPreference:
                            "TRAFFIC_AWARE"

                    })

            }
        );


    if (
        !response.ok
    ) {

        const errorText =
            await response.text();


        throw new Error(
            `Google Routes API error (${response.status}): ${errorText}`
        );

    }


    const data =
        await response.json();


    if (
        !data.routes ||
        data.routes.length === 0
    ) {

        throw new Error(
            "Google Routes API returned no routes."
        );

    }


    const duration =
        data.routes[0].duration;


    if (
        !duration
    ) {

        throw new Error(
            "Google Routes API response did not contain a duration."
        );

    }


    return parseDuration(
        duration
    );

}


/*
 * ============================================
 * PARSE GOOGLE DURATION
 * ============================================
 *
 * Google returns durations such as:
 *
 * "1320s"
 *
 * Convert to whole minutes.
 */

function parseDuration(
    duration
) {

    const seconds =
        Number(
            String(duration)
                .replace(
                    "s",
                    ""
                )
        );


    if (
        !Number.isFinite(
            seconds
        )
    ) {

        throw new Error(
            `Invalid Google Routes duration: ${duration}`
        );

    }


    return Math.ceil(
        seconds / 60
    );

}
