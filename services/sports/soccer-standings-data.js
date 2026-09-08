import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


/*
 * ============================================================
 * SOCCER STANDINGS DATA SERVICE
 *
 * Server-side data service for soccer standings.
 *
 * Provider:
 * - ESPN public soccer standings endpoints
 *
 * Responsibilities:
 * - ESPN standings requests
 * - Persistent local cache
 * - Cache freshness / TTL
 * - Stale-cache fallback
 *
 * This service is intentionally separate from soccer-data.js
 * because standings have different caching and data requirements
 * than the soccer scoreboard.
 * ============================================================
 */


const __filename =
    fileURLToPath(import.meta.url);


const __dirname =
    path.dirname(__filename);


const CACHE_DIRECTORY =
    path.resolve(
        __dirname,
        "../../data/sports"
    );


const CACHE_FILE =
    path.join(
        CACHE_DIRECTORY,
        "soccer-standings-cache.json"
    );


const API_BASE_URL =
    "https://site.api.espn.com/apis/v2/sports/soccer";


const CACHE_TTL =
    60 * 60 * 1000;


/*
 * ============================================================
 * CACHE
 * ============================================================
 */


function ensureCacheDirectory() {

    if (!fs.existsSync(CACHE_DIRECTORY)) {

        fs.mkdirSync(
            CACHE_DIRECTORY,
            {
                recursive: true
            }
        );

    }

}


function loadCache() {

    ensureCacheDirectory();


    if (!fs.existsSync(CACHE_FILE)) {

        return {};

    }


    try {

        const contents =
            fs.readFileSync(
                CACHE_FILE,
                "utf8"
            );


        return JSON.parse(
            contents
        );

    }
    catch (
        error
    ) {

        console.error(
            "[soccer-standings] Unable to read cache:",
            error.message
        );


        return {};

    }

}


function saveCache(
    cache
) {

    ensureCacheDirectory();


    try {

        fs.writeFileSync(
            CACHE_FILE,
            JSON.stringify(
                cache,
                null,
                2
            )
        );

    }
    catch (
        error
    ) {

        console.error(
            "[soccer-standings] Unable to write cache:",
            error.message
        );

    }

}


function isCacheFresh(
    entry
) {

    if (
        !entry ||
        !entry.timestamp
    ) {

        return false;

    }


    return (
        Date.now() -
        entry.timestamp
    ) < CACHE_TTL;

}


/*
 * ============================================================
 * ESPN API
 * ============================================================
 */


async function requestStandings(
    competitionSlug
) {

    const url =
        `${API_BASE_URL}/${competitionSlug}/standings`;


    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            `ESPN standings request failed: ${response.status} ${response.statusText}`
        );

    }


    return await response.json();

}


/*
 * ============================================================
 * GET STANDINGS
 * ============================================================
 *
 * Fresh cache:
 *     return cached data
 *
 * Stale cache:
 *     attempt ESPN request
 *     ├── success → update cache
 *     └── failure → return stale cache
 *
 * No cache:
 *     attempt ESPN request
 *     ├── success → create cache
 *     └── failure → return null
 * ============================================================
 */


async function getStandings(
    competitionSlug
) {

    if (
        !competitionSlug
    ) {

        return null;

    }


    const cache =
        loadCache();


    const key =
        `standings-${competitionSlug}`;


    const cached =
        cache[key];


    if (
        isCacheFresh(
            cached
        )
    ) {

        return cached.data;

    }


    try {

        const data =
            await requestStandings(
                competitionSlug
            );


        cache[key] = {

            timestamp:
                Date.now(),

            data

        };


        saveCache(
            cache
        );


        return data;

    }
    catch (
        error
    ) {

        console.error(
            `[soccer-standings] ESPN request failed for ${competitionSlug}:`,
            error.message
        );


        if (
            cached?.data
        ) {

            console.warn(
                `[soccer-standings] Using stale cache for ${competitionSlug}.`
            );


            return cached.data;

        }


        return null;

    }

}


/*
 * ============================================================
 * PUBLIC SERVICE
 * ============================================================
 */


export const soccerStandingsData = {

    cacheFile:
        CACHE_FILE,

    cacheTtl:
        CACHE_TTL,

    getStandings

};