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
 * Cache structure:
 *
 * data/sports/soccer/standings/
 *     eng.1.json
 *     ita.1.json
 *     esp.1.json
 *     fra.1.json
 *     por.1.json
 *     usa.1.json
 *
 * Each competition is cached independently so that refreshing
 * one competition does not require reading or rewriting the
 * entire standings cache.
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
        "../../data/sports/soccer/standings"
    );


const API_BASE_URL =
    "https://site.api.espn.com/apis/v2/sports/soccer";


const CACHE_TTL =
    60 * 60 * 1000;


const memoryCache =
    new Map();


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


function getCacheFile(
    competitionSlug
) {

    return path.join(
        CACHE_DIRECTORY,
        `${competitionSlug}.json`
    );

}


function loadCache(
    competitionSlug
) {

    if (
        memoryCache.has(
            competitionSlug
        )
    ) {

        return memoryCache.get(
            competitionSlug
        );

    }


    const cacheFile =
        getCacheFile(
            competitionSlug
        );


    if (!fs.existsSync(cacheFile)) {

        return null;

    }


    try {

        const contents =
            fs.readFileSync(
                cacheFile,
                "utf8"
            );


        const entry =
            JSON.parse(
                contents
            );


        memoryCache.set(
            competitionSlug,
            entry
        );


        return entry;

    }
    catch (
        error
    ) {

        console.error(
            `[soccer-standings] Unable to read cache for ${competitionSlug}:`,
            error.message
        );


        return null;

    }

}


function saveCache(
    competitionSlug,
    entry
) {

    ensureCacheDirectory();


    const cacheFile =
        getCacheFile(
            competitionSlug
        );


    try {

        fs.writeFileSync(
            cacheFile,
            JSON.stringify(
                entry,
                null,
                2
            )
        );


        memoryCache.set(
            competitionSlug,
            entry
        );

    }
    catch (
        error
    ) {

        console.error(
            `[soccer-standings] Unable to write cache for ${competitionSlug}:`,
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


    const cached =
        loadCache(
            competitionSlug
        );


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


        const entry = {

            timestamp:
                Date.now(),

            data

        };


        saveCache(
            competitionSlug,
            entry
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

    cacheDirectory:
        CACHE_DIRECTORY,

    cacheTtl:
        CACHE_TTL,

    getStandings

};