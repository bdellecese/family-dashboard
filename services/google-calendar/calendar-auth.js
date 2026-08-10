import {
    GOOGLE_CALENDAR_CONFIG
} from "../../config/config.js";


const CALENDAR_SCOPE =
    "https://www.googleapis.com/auth/calendar.readonly";


let tokenClient = null;

let accessToken = null;


function initializeTokenClient() {

    if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.oauth2
    ) {

        throw new Error(
            "Google Identity Services not loaded."
        );

    }


    tokenClient =
        google.accounts.oauth2.initTokenClient({

            client_id:
                GOOGLE_CALENDAR_CONFIG.clientId,

            scope:
                CALENDAR_SCOPE,

            callback: (
                response
            ) => {

                if (
                    response.error
                ) {

                    console.error(
                        "Google Calendar authorization failed:",
                        response
                    );

                    return;

                }


                accessToken =
                    response.access_token;

            }

        });

}


export function signInToGoogle() {

    if (!tokenClient) {

        initializeTokenClient();

    }


    return new Promise(
        (
            resolve,
            reject
        ) => {

            tokenClient.callback =
                (
                    response
                ) => {

                    if (
                        response.error
                    ) {

                        reject(
                            response
                        );

                        return;

                    }


                    accessToken =
                        response.access_token;


                    resolve(
                        accessToken
                    );

                };


            tokenClient.requestAccessToken();

        }
    );

}


export async function getAccessToken() {

    if (
        accessToken
    ) {

        return accessToken;

    }


    return await signInToGoogle();

}


export function clearAccessToken() {

    accessToken =
        null;

}