/*
 * ============================================================
 * DASHBOARD PERFORMANCE INSTRUMENTATION
 * ============================================================
 *
 * Lightweight performance instrumentation for the dashboard.
 *
 * Measurements are stored in:
 *
 *     1. Browser localStorage
 *     2. Server-side JSON storage
 *
 * Server storage allows performance data to be reviewed remotely
 * without accessing Chromium on the Raspberry Pi.
 *
 * Browser storage key:
 *
 *     dashboard-performance
 *
 * Server endpoint:
 *
 *     /api/performance
 *
 * ============================================================
 */


const STORAGE_KEY =
    "dashboard-performance";


const MAX_EVENTS =
    5000;


const SERVER_ENDPOINT =
    "/api/performance";


/*
 * ============================================================
 * INTERNAL STATE
 * ============================================================
 */

let events = [];

let pendingServerEvents = [];

let serverSyncTimer = null;

let serverSyncInProgress = false;


/*
 * ============================================================
 * LOAD EXISTING DATA
 * ============================================================
 */

function loadEvents() {

    try {

        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!stored) {

            events = [];

            return;

        }


        const parsed =
            JSON.parse(
                stored
            );


        if (
            Array.isArray(
                parsed
            )
        ) {

            events =
                parsed;

        }

        else {

            events = [];

        }

    }

    catch (error) {

        console.warn(
            "Performance data could not be loaded:",
            error
        );

        events = [];

    }

}


/*
 * ============================================================
 * SAVE LOCAL EVENTS
 * ============================================================
 */

function saveEvents() {

    try {

        if (
            events.length >
            MAX_EVENTS
        ) {

            events =
                events.slice(
                    -MAX_EVENTS
                );

        }


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                events
            )
        );

    }

    catch (error) {

        console.warn(
            "Performance data could not be saved:",
            error
        );

    }

}


/*
 * ============================================================
 * SERVER SYNCHRONIZATION
 * ============================================================
 */

function scheduleServerSync() {

    if (
        serverSyncTimer
    ) {

        return;

    }


    serverSyncTimer =
        setTimeout(
            () => {

                serverSyncTimer =
                    null;


                syncWithServer();

            },
            2000
        );

}


async function syncWithServer() {

    if (
        serverSyncInProgress ||
        pendingServerEvents.length === 0
    ) {

        return;

    }


    serverSyncInProgress =
        true;


    const batch =
        pendingServerEvents.splice(
            0
        );


    try {

        const response =
            await fetch(
                SERVER_ENDPOINT,
                {
                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            events:
                                batch
                        }),

                    keepalive:
                        true

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Performance server returned ${response.status}`
            );

        }

    }

    catch (error) {

        /*
         * Put the events back into the queue if the server
         * is temporarily unavailable.
         */

        pendingServerEvents =
            [
                ...batch,
                ...pendingServerEvents
            ];

        console.warn(
            "Performance data could not be synchronized with server:",
            error.message
        );

    }

    finally {

        serverSyncInProgress =
            false;


        /*
         * If more events arrived while the request was running,
         * schedule another synchronization.
         */

        if (
            pendingServerEvents.length > 0
        ) {

            scheduleServerSync();

        }

    }

}


/*
 * ============================================================
 * INITIALIZE
 * ============================================================
 */

loadEvents();


/*
 * ============================================================
 * RECORD EVENT
 * ============================================================
 */

export function recordPerformanceEvent(
    event
) {

    return null;

}


/*
 * ============================================================
 * START TIMER
 * ============================================================
 */

export function startPerformanceTimer(
    type,
    name,
    metadata = {}
) {

    const start =
        performance.now();


    return {

        end(
            additionalMetadata = {}
        ) {

            const durationMs =
                performance.now() -
                start;


            recordPerformanceEvent({

                type,

                name,

                durationMs,

                ...metadata,

                ...additionalMetadata

            });


            return durationMs;

        }

    };

}


/*
 * ============================================================
 * GET ALL LOCAL EVENTS
 * ============================================================
 */

export function getPerformanceEvents() {

    return [
        ...events
    ];

}


/*
 * ============================================================
 * CLEAR LOCAL EVENTS
 * ============================================================
 */

export function clearPerformanceEvents() {

    events = [];

    pendingServerEvents = [];


    if (
        serverSyncTimer
    ) {

        clearTimeout(
            serverSyncTimer
        );

        serverSyncTimer =
            null;

    }


    try {

        localStorage.removeItem(
            STORAGE_KEY
        );

    }

    catch (error) {

        console.warn(
            "Performance data could not be cleared:",
            error
        );

    }

}


/*
 * ============================================================
 * CLEAR SERVER EVENTS
 * ============================================================
 */

export async function clearServerPerformanceEvents() {

    try {

        const response =
            await fetch(
                SERVER_ENDPOINT,
                {
                    method:
                        "DELETE"
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Performance server returned ${response.status}`
            );

        }


        return true;

    }

    catch (error) {

        console.warn(
            "Server performance data could not be cleared:",
            error
        );

        return false;

    }

}


/*
 * ============================================================
 * EXPORT JSON
 * ============================================================
 */

export function exportPerformanceData() {

    const data =
        JSON.stringify(
            events,
            null,
            2
        );


    const blob =
        new Blob(
            [
                data
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.download =
        `dashboard-performance-${Date.now()}.json`;


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
        url
    );

}


/*
 * ============================================================
 * GLOBAL DEBUG API
 *
 * Available from Chromium DevTools if needed.
 * ============================================================
 */

window.dashboardPerformance = {

    get:
        getPerformanceEvents,

    clear:
        clearPerformanceEvents,

    clearServer:
        clearServerPerformanceEvents,

    export:
        exportPerformanceData

};