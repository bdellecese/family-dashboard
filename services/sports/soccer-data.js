import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


/*
 * ============================================================
 * SOCCER DATA SERVICE
 *
 * Server-side data service for soccer.
 *
 * Provider:
 * - ESPN public soccer endpoints
 *
 * Responsibilities:
 * - ESPN requests
 * - Persistent local cache
 * - Cache freshness / TTL
 * - Stale-cache fallback
 * - Team schedule / fixture retrieval
 * - Match summary retrieval
 * - Standings retrieval
 *
 * The service only runs while the dashboard application is
 * running. There is no independent background process.
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
        "soccer-cache.json"
    );


const API_BASE_URL =
    "https://site.api.espn.com/apis/site/v2/sports/soccer";


const STANDINGS_BASE_URL =
    "https://site.api.espn.com/apis/v2/sports/soccer";


const CACHE_TTL = {

    /*
     * Today's games.
     */
    fixturesToday:
        15 * 60 * 1000,


    /*
     * Future fixtures.
     */
    fixturesFuture:
        12 * 60 * 60 * 1000,


    /*
     * Completed match data.
     */
    completed:
        24 * 60 * 60 * 1000,


    /*
     * League standings.
     */
    standings:
        60 * 60 * 1000,


    /*
     * FIFA rankings.
     */
    rankings:
        24 * 60 * 60 * 1000,


    /*
     * Team / competition metadata.
     */
    metadata:
        7 * 24 * 60 * 60 * 1000

};


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


        return JSON.parse(contents);

    } catch (error) {

        console.error(
            "[soccer] Unable to read cache:",
            error.message
        );


        return {};

    }

}


function saveCache(cache) {

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

    } catch (error) {

        console.error(
            "[soccer] Unable to write cache:",
            error.message
        );

    }

}


function getCacheEntry(
    cache,
    key
) {

    return cache[key] || null;

}


function isCacheFresh(
    entry,
    ttl
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
    ) < ttl;

}


/*
 * ============================================================
 * ESPN API
 * ============================================================
 */


async function requestApi(
    baseUrl,
    endpoint,
    params = {}
) {

    const query =
        new URLSearchParams(
            params
        ).toString();


    const url =
        query
            ? `${baseUrl}${endpoint}?${query}`
            : `${baseUrl}${endpoint}`;


    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            `ESPN request failed: ${response.status} ${response.statusText}`
        );

    }


    return await response.json();

}


/*
 * ============================================================
 * CACHED REQUEST
 * ============================================================
 *
 * Fresh cache:
 *     return cache
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


async function getCachedData(
    key,
    ttl,
    endpoint,
    params = {},
    baseUrl = API_BASE_URL
) {

    const cache =
        loadCache();


    const cached =
        getCacheEntry(
            cache,
            key
        );


    if (
        isCacheFresh(
            cached,
            ttl
        )
    ) {

        return cached.data;

    }


    try {

        const data =
            await requestApi(
                baseUrl,
                endpoint,
                params
            );


        cache[key] = {

            timestamp:
                Date.now(),

            data

        };


        saveCache(cache);


        return data;

    } catch (error) {

        console.error(
            `[soccer] ESPN request failed for ${key}:`,
            error.message
        );


        if (cached?.data) {

            console.warn(
                `[soccer] Using stale cache for ${key}.`
            );


            return cached.data;

        }


        return null;

    }

}


/*
 * ============================================================
 * TEAM SCHEDULE
 * ============================================================
 *
 * ESPN's "all" team schedule provides cross-competition
 * results for a team.
 *
 * Example:
 *
 * /all/teams/110/schedule
 *
 * This can include:
 * - domestic league
 * - Champions League
 * - domestic cups
 * - friendlies
 *
 * The normal endpoint returns completed/recent events.
 * ============================================================
 */


async function getTeamSchedule(
    teamId
) {

    const key =
        `team-${teamId}-schedule`;


    return await getCachedData(
        key,
        CACHE_TTL.completed,
        `/all/teams/${teamId}/schedule`
    );

}


/*
 * ============================================================
 * TEAM FIXTURES
 * ============================================================
 *
 * ESPN exposes future fixtures using:
 *
 * /all/teams/{teamId}/schedule?fixture=true
 *
 * This is separate from the completed/recent schedule.
 * ============================================================
 */


async function getTeamFixtures(
    teamId
) {

    const key =
        `team-${teamId}-fixtures`;


    return await getCachedData(
        key,
        CACHE_TTL.fixturesFuture,
        `/all/teams/${teamId}/schedule`,
        {
            fixture: "true"
        }
    );

}


/*
 * ============================================================
 * TEAM GAMES FOR DATE
 * ============================================================
 *
 * Combines completed/recent games and future fixtures, then
 * returns only games occurring on the requested calendar date.
 *
 * Date format:
 *
 *     YYYY-MM-DD
 *
 * The ESPN event timestamp is converted to the calendar date
 * represented by the timestamp itself.
 *
 * The scoreboard layer can later provide the dashboard's
 * timezone if we need more precise local-date handling.
 * ============================================================
 */


async function getTeamGames(
    teamId,
    date
) {

    const [
        schedule,
        fixtures
    ] =
        await Promise.all([
            getTeamSchedule(teamId),
            getTeamFixtures(teamId)
        ]);


    const scheduleEvents =
        schedule?.events || [];


    const fixtureEvents =
        fixtures?.events || [];


    const events =
        [
            ...scheduleEvents,
            ...fixtureEvents
        ];


    const uniqueEvents =
        new Map();


    for (
        const event of events
    ) {

        if (
            event?.id
        ) {

            uniqueEvents.set(
                event.id,
                event
            );

        }

    }


    return [
        ...uniqueEvents.values()
    ].filter(
        event =>
            event?.date?.startsWith(
                date
            )
    );

}


async function getCompetitionGames(
    competitionSlug,
    date
) {

    if (
        !competitionSlug ||
        !date
    ) {
        return [];
    }


    const key =
        `competition-${competitionSlug}-scoreboard-${date}`;


    const dateParameter =
        date.replace(
            /-/g,
            ""
        );


    const data =
        await getCachedData(
            key,
            CACHE_TTL.fixturesToday,
            `/${competitionSlug}/scoreboard`,
            {
                dates:
                    dateParameter
            }
        );


    return (
        data?.events ||
        []
    );

}

/*
 * ============================================================
 * MATCH SUMMARY
 * ============================================================
 *
 * Detailed match data is competition-specific.
 *
 * Example:
 *
 * /club.friendly/summary?event=401905173
 *
 * The competition slug comes from the event itself.
 *
 * This provides:
 * - scoring events
 * - scorers
 * - goal times
 * - own goals
 * - penalty kicks
 * - shootout events
 * - match status
 * - other match details
 * ============================================================
 */


async function getMatchSummary(
    eventId,
    competitionSlug
) {

    if (
        !eventId ||
        !competitionSlug
    ) {

        return null;

    }


    const key =
        `match-${competitionSlug}-${eventId}-summary`;


    return await getCachedData(
        key,
        CACHE_TTL.completed,
        `/${competitionSlug}/summary`,
        {
            event:
                eventId
        }
    );

}


/*
 * ============================================================
 * STANDINGS
 * ============================================================
 *
 * ESPN standings use the /apis/v2/ endpoint rather than the
 * normal site API endpoint.
 *
 * Example:
 *
 * /apis/v2/sports/soccer/eng.1/standings
 *
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


    const key =
        `standings-${competitionSlug}`;


    const ttl =
        competitionSlug ===
            "fifa.world"
            ? CACHE_TTL.rankings
            : CACHE_TTL.standings;


    return await getCachedData(
        key,
        ttl,
        `/${competitionSlug}/standings`,
        {},
        STANDINGS_BASE_URL
    );

}


/*
 * ============================================================
 * PUBLIC SERVICE
 * ============================================================
 */


export const soccerData = {

    cacheFile:
        CACHE_FILE,

    cacheTtl:
        CACHE_TTL,

    getCachedData,

    getTeamSchedule,

    getTeamFixtures,

    getTeamGames,

    getCompetitionGames,

    getMatchSummary,

    getStandings

};