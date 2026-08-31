import {
    getCached,
    getStaleCached,
    setCached
} from "../cache/cache.js";


const OURMANNA_URL =
    "https://beta.ourmanna.com/api/v1/get?format=json&order=daily";


const CACHE_KEY =
    "ourmanna:daily-verse";


const CACHE_MAX_AGE =
    86400000; // 24 hours


const REQUEST_TIMEOUT =
    10000; // 10 seconds


const MAX_RETRIES =
    2;


/*
 * ============================================================
 * FETCH OURMANNA
 * ============================================================
 *
 * Retry temporary upstream failures and network/timeout
 * failures before giving up.
 */

async function fetchOurManna() {

    let lastError;


    for (
        let attempt = 0;
        attempt <= MAX_RETRIES;
        attempt++
    ) {

        try {

            const controller =
                new AbortController();


            const timeout =
                setTimeout(
                    () => controller.abort(),
                    REQUEST_TIMEOUT
                );


            try {

                const response =
                    await fetch(
                        OURMANNA_URL,
                        {
                            signal:
                                controller.signal,

                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                if (
                    response.ok
                ) {

                    return response;

                }


                lastError =
                    new Error(
                        `OurManna API error: ${response.status}`
                    );


                /*
                 * Retry temporary 5xx server errors.
                 */

                if (
                    response.status >= 500 &&
                    response.status < 600 &&
                    attempt < MAX_RETRIES
                ) {

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                1000 * (attempt + 1)
                            )
                    );

                    continue;

                }


                throw lastError;

            }

            finally {

                clearTimeout(
                    timeout
                );

            }

        }

        catch (error) {

            lastError =
                error;


            /*
             * Retry network failures and timeouts.
             */

            if (
                attempt < MAX_RETRIES
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1000 * (attempt + 1)
                        )
                );

                continue;

            }

        }

    }


    throw lastError;

}


/*
 * ============================================================
 * GET DAILY VERSE
 * ============================================================
 */

export async function getDailyVerse() {

    /*
     * Use the normal 24-hour cache first.
     */

    const cached =
        getCached(
            CACHE_KEY,
            CACHE_MAX_AGE
        );


    if (
        cached
    ) {

        return cached;

    }


    try {

        const response =
            await fetchOurManna();


        const data =
            await response.json();


        const verse =
            data?.verse?.details;


        if (
            !verse
        ) {

            throw new Error(
                "Invalid OurManna response."
            );

        }


        /*
         * Cache the successful response.
         */

        setCached(
            CACHE_KEY,
            verse
        );


        return verse;

    }

    catch (error) {

        console.error(
            "OurManna unavailable:",
            error
        );


        /*
         * The normal cache may be expired, but the last
         * successful verse is still available.
         *
         * Use it rather than breaking the dashboard.
         */

        const staleCached =
            getStaleCached(
                CACHE_KEY
            );


        if (
            staleCached
        ) {

            console.warn(
                "Using stale cached OurManna verse because the API is unavailable."
            );


            return staleCached;

        }


        /*
         * Nothing has ever been cached and OurManna is
         * unavailable. Let the caller handle the failure.
         */

        throw error;

    }

}