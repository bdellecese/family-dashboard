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

const API_BASE_URL =
    "https://site.api.espn.com/apis/site/v2/sports/soccer";

const STANDINGS_BASE_URL =
    "https://site.api.espn.com/apis/v2/sports/soccer";

const CACHE_DIRECTORY =
    path.resolve(
        __dirname,
        "../../data/sports/soccer"
    );

const CACHE_TTL = {
    fixturesToday:
        15 * 60 * 1000,

    fixturesFuture:
        12 * 60 * 60 * 1000,

    completed:
        24 * 60 * 60 * 1000,

    standings:
        60 * 60 * 1000,

    rankings:
        24 * 60 * 60 * 1000,

    metadata:
        7 * 24 * 60 * 60 * 1000
};

const memoryCache =
    new Map();

const inFlightRequests =
    new Map();

function ensureCacheDirectory(
    directory
) {
    if (
        !fs.existsSync(
            directory
        )
    ) {
        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );
    }
}

function getCacheFile(
    key
) {
    if (
        key.startsWith(
            "team-"
        )
    ) {
        return path.join(
            CACHE_DIRECTORY,
            "teams",
            `${key}.json`
        );
    }

    if (
        key.startsWith(
            "match-"
        ) &&
        key.endsWith(
            "-summary"
        )
    ) {
        const filename =
            key
                .replace(
                    /^match-/,
                    ""
                )
                .replace(
                    /-summary$/,
                    ""
                );

        return path.join(
            CACHE_DIRECTORY,
            "games",
            `${filename}.json`
        );
    }

    if (
        key.startsWith(
            "competition-"
        ) &&
        key.includes(
            "-scoreboard-"
        )
    ) {
        const filename =
            key.replace(
                /^competition-/,
                ""
            );

        return path.join(
            CACHE_DIRECTORY,
            "competitions",
            `${filename}.json`
        );
    }

    if (
        key.startsWith(
            "standings-"
        )
    ) {
        const competition =
            key.replace(
                /^standings-/,
                ""
            );

        return path.join(
            CACHE_DIRECTORY,
            "standings",
            `${competition}.json`
        );
    }

    return null;
}

function loadCacheEntry(
    key
) {
    if (
        memoryCache.has(
            key
        )
    ) {
        return memoryCache.get(
            key
        );
    }

    const cacheFile =
        getCacheFile(
            key
        );

    if (!cacheFile) {
        return null;
    }

    if (
        !fs.existsSync(
            cacheFile
        )
    ) {
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
            key,
            entry
        );

        return entry;
    }
    catch (error) {
        console.error(
            `[soccer] Unable to read cache for ${key}:`,
            error.message
        );

        return null;
    }
}

function saveCacheEntry(
    key,
    entry
) {
    const cacheFile =
        getCacheFile(
            key
        );

    if (!cacheFile) {
        console.error(
            `[soccer] No cache file mapping for ${key}.`
        );

        return;
    }

    try {
        ensureCacheDirectory(
            path.dirname(
                cacheFile
            )
        );

        fs.writeFileSync(
            cacheFile,
            JSON.stringify(
                entry,
                null,
                2
            )
        );

        memoryCache.set(
            key,
            entry
        );
    }
    catch (error) {
        console.error(
            `[soccer] Unable to write cache for ${key}:`,
            error.message
        );
    }
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

async function requestApi(
    baseUrl,
    endpoint,
    params = {}
) {
    const url =
        new URL(
            `${baseUrl}${endpoint}`
        );

    for (
        const [
            key,
            value
        ]
        of Object.entries(
            params
        )
    ) {
        if (
            value !==
            undefined &&
            value !==
            null
        ) {
            url.searchParams.set(
                key,
                value
            );
        }
    }

    const response =
        await fetch(
            url
        );

    if (
        !response.ok
    ) {
        throw new Error(
            `ESPN API returned ${response.status}`
        );
    }

    return await response.json();
}

async function getCachedData(
    key,
    ttl,
    endpoint,
    params = {},
    baseUrl = API_BASE_URL
) {
    const cached =
        loadCacheEntry(
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

    if (
        inFlightRequests.has(
            key
        )
    ) {
        return await inFlightRequests.get(
            key
        );
    }

    const request =
        (async () => {
            try {
                const data =
                    await requestApi(
                        baseUrl,
                        endpoint,
                        params
                    );

                saveCacheEntry(
                    key,
                    {
                        timestamp:
                            Date.now(),
                        data
                    }
                );

                return data;
            }
            catch (error) {
                console.error(
                    `[soccer] ESPN request failed for ${key}:`,
                    error.message
                );

                if (
                    cached?.data
                ) {
                    console.warn(
                        `[soccer] Using stale cache for ${key}.`
                    );

                    return cached.data;
                }

                return null;
            }
        })();

    inFlightRequests.set(
        key,
        request
    );

    try {
        return await request;
    }
    finally {
        inFlightRequests.delete(
            key
        );
    }
}

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

async function getTeamGames(
    teamId,
    date
) {
    const [
        schedule,
        fixtures
    ] =
        await Promise.all([
            getTeamSchedule(
                teamId
            ),
            getTeamFixtures(
                teamId
            )
        ]);

    const events =
        [
            ...(schedule?.events || []),
            ...(fixtures?.events || [])
        ];

    const uniqueEvents =
        new Map();

    for (
        const event
        of events
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
    const key =
        `competition-${competitionSlug}-scoreboard-${date}`;

    return await getCachedData(
        key,
        CACHE_TTL.fixturesToday,
        `/${competitionSlug}/scoreboard`,
        {
            dates:
                date.replace(
                    /-/g,
                    ""
                )
        }
    );
}

async function getMatchSummary(
    eventId,
    competitionSlug
) {
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

async function getStandings(
    competitionSlug
) {
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

export const soccerData = {
    cacheDirectory:
        CACHE_DIRECTORY,

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