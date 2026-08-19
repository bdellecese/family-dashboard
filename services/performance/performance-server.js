/*
 * ============================================================
 * DASHBOARD PERFORMANCE SERVER
 * ============================================================
 *
 * Server-side storage for dashboard performance events.
 *
 * Browser-side performance.js sends events here so performance
 * data can be reviewed remotely without accessing Chromium's
 * localStorage or the physical Raspberry Pi console.
 *
 * Storage:
 *
 *     data/dashboard-performance.json
 *
 * ============================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


const DATA_DIR =
    path.resolve(
        __dirname,
        "../../data"
    );


const DATA_FILE =
    path.join(
        DATA_DIR,
        "dashboard-performance.json"
    );


const MAX_EVENTS =
    10000;


let events = [];


/*
 * ============================================================
 * INITIALIZE STORAGE
 * ============================================================
 */

function initializeStorage() {

    try {

        fs.mkdirSync(
            DATA_DIR,
            {
                recursive:
                    true
            }
        );


        if (
            !fs.existsSync(
                DATA_FILE
            )
        ) {

            fs.writeFileSync(
                DATA_FILE,
                "[]",
                "utf8"
            );

            events = [];

            return;

        }


        const stored =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );


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
                parsed.slice(
                    -MAX_EVENTS
                );

        }

        else {

            events = [];

        }

    }

    catch (error) {

        console.error(
            "Performance storage could not be initialized:",
            error
        );

        events = [];

    }

}


/*
 * ============================================================
 * SAVE
 * ============================================================
 */

function saveEvents() {

    try {

        fs.mkdirSync(
            DATA_DIR,
            {
                recursive:
                    true
            }
        );


        const temporaryFile =
            `${DATA_FILE}.tmp`;


        fs.writeFileSync(
            temporaryFile,
            JSON.stringify(
                events,
                null,
                2
            ),
            "utf8"
        );


        fs.renameSync(
            temporaryFile,
            DATA_FILE
        );

    }

    catch (error) {

        console.error(
            "Performance data could not be saved:",
            error
        );

        throw error;

    }

}


/*
 * ============================================================
 * ADD EVENTS
 * ============================================================
 */

export function recordPerformanceEvents(
    incomingEvents
) {

    if (
        !Array.isArray(
            incomingEvents
        )
    ) {

        throw new Error(
            "Performance events must be an array."
        );

    }


    for (
        const event of
        incomingEvents
    ) {

        if (
            event &&
            typeof event ===
                "object"
        ) {

            events.push(
                event
            );

        }

    }


    if (
        events.length >
        MAX_EVENTS
    ) {

        events =
            events.slice(
                -MAX_EVENTS
            );

    }


    saveEvents();


    return events.length;

}


/*
 * ============================================================
 * GET EVENTS
 * ============================================================
 */

export function getPerformanceEvents(
    limit = null
) {

    if (
        limit === null
    ) {

        return [
            ...events
        ];

    }


    const numericLimit =
        Number(
            limit
        );


    if (
        !Number.isFinite(
            numericLimit
        ) ||
        numericLimit <= 0
    ) {

        return [
            ...events
        ];

    }


    return events.slice(
        -Math.floor(
            numericLimit
        )
    );

}


/*
 * ============================================================
 * CLEAR EVENTS
 * ============================================================
 */

export function clearPerformanceEvents() {

    events = [];

    saveEvents();

}


/*
 * ============================================================
 * INITIALIZE
 * ============================================================
 */

initializeStorage();