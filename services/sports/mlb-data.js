// ============================================================
// MLB DATA SERVICE
//
// Server-side MLB data retrieval and persistent caching.
//
// The browser should NEVER call the MLB API directly.
// ============================================================

import fs from "fs/promises";
import path from "path";

const MLB_API =
    "https://statsapi.mlb.com/api/v1";

const MLB_LIVE_API =
    "https://statsapi.mlb.com/api/v1.1";

const CACHE_DIR =
    path.resolve(
        process.cwd(),
        "data/sports/mlb"
    );

// ============================================================
// CACHE HELPERS
// ============================================================

async function ensureCacheDir() {
    await fs.mkdir(
        CACHE_DIR,
        {
            recursive: true
        }
    );
}

async function readCache(
    filename,
    maxAge
) {
    try {
        const filePath =
            path.join(
                CACHE_DIR,
                filename
            );

        const raw =
            await fs.readFile(
                filePath,
                "utf8"
            );

        const cached =
            JSON.parse(raw);

        const age =
            Date.now() -
            new Date(
                cached.cachedAt
            ).getTime();

        if (
            age > maxAge
        ) {
            return null;
        }

        return cached.data;
    }
    catch {
        return null;
    }
}

async function writeCache(
    filename,
    data
) {
    await ensureCacheDir();

    const filePath =
        path.join(
            CACHE_DIR,
            filename
        );

    await fs.writeFile(
        filePath,
        JSON.stringify(
            {
                cachedAt:
                    new Date().toISOString(),
                data
            },
            null,
            2
        )
    );
}

// ============================================================
// FETCH HELPER
// ============================================================

async function fetchJson(
    url
) {
    const response =
        await fetch(url);

    if (
        !response.ok
    ) {
        throw new Error(
            `MLB API request failed: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

// ============================================================
// DATE HELPERS
// ============================================================

function getYesterday() {
    const now =
        new Date();

    const eastern =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    "America/New_York",
                year:
                    "numeric",
                month:
                    "2-digit",
                day:
                    "2-digit"
            }
        ).formatToParts(now);

    const values = {};

    eastern.forEach(
        part => {
            values[part.type] =
                part.value;
        }
    );

    const date =
        new Date(
            Number(values.year),
            Number(values.month) - 1,
            Number(values.day)
        );

    date.setDate(
        date.getDate() - 1
    );

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}

// ============================================================
// SCHEDULE
// ============================================================

async function getSchedule(
    apiDate
) {
    const filename =
        `schedule-${apiDate}.json`;

    // Completed games don't change, so cache
    // yesterday's schedule for 24 hours.
    const cached =
        await readCache(
            filename,
            24 * 60 * 60 * 1000
        );

    if (
        cached
    ) {

        return cached;
    }


    const data =
        await fetchJson(
            `${MLB_API}/schedule?sportId=1&date=${apiDate}`
        );

    const games =
        data.dates?.[0]?.games ||
        [];

    await writeCache(
        filename,
        games
    );

    return games;
}

// ============================================================
// GAME FEED
// ============================================================

async function getGameFeed(
    gamePk
) {
    const filename =
        `game-${gamePk}.json`;

    // Completed games are effectively immutable.
    const cached =
        await readCache(
            filename,
            24 * 60 * 60 * 1000
        );

    if (
        cached
    ) {
        return cached;
    }

    const data =
        await fetchJson(
            `${MLB_LIVE_API}/game/${gamePk}/feed/live`
        );

    await writeCache(
        filename,
        data
    );

    return data;
}

// ============================================================
// PITCHER RECORD
// ============================================================

async function getPitcherRecord(
    playerId,
    season
) {
    const filename =
        `pitcher-${playerId}-${season}.json`;

    const cached =
        await readCache(
            filename,
            6 * 60 * 60 * 1000
        );

    if (
        cached
    ) {
        return cached;
    }

    const data =
        await fetchJson(
            `${MLB_API}/people/${playerId}/stats?stats=season&group=pitching&season=${season}`
        );

    const splits =
        data.stats?.[0]?.splits ||
        [];

    if (
        splits.length === 0
    ) {
        return "";
    }

    const pitching =
        splits[0].stat;

    let record = "";

    if (
        pitching.wins !== undefined &&
        pitching.losses !== undefined
    ) {
        record =
            `${pitching.wins}-${pitching.losses}`;
    }

    if (
        pitching.saves !== undefined &&
        pitching.saves > 0
    ) {
        record +=
            record
                ? `, ${pitching.saves} SV`
                : `${pitching.saves} SV`;
    }

    await writeCache(
        filename,
        record
    );

    return record;
}

// ============================================================
// STANDINGS
// ============================================================

async function getStandings() {
    const season =
        new Date().getFullYear();

    const filename =
        `standings-${season}.json`;

    // Standings can change throughout the day,
    // but there is no reason to hit MLB constantly.
    const cached =
        await readCache(
            filename,
            30 * 60 * 1000
        );

    if (
        cached
    ) {
        return cached;
    }

    const url =
        `${MLB_API}/standings?` +
        `leagueId=103,104&` +
        `season=${season}&` +
        `standingsTypes=regularSeason&` +
        `hydrate=team,division,league`;

    const data =
        await fetchJson(
            url
        );

    await writeCache(
        filename,
        data
    );

    return data;
}

// ============================================================
// WILD CARD STANDINGS
// ============================================================

async function getWildCardStandings() {
    const season =
        new Date().getFullYear();

    const filename =
        `wildcard-${season}.json`;

    const cached =
        await readCache(
            filename,
            30 * 60 * 1000
        );

    if (
        cached
    ) {
        return cached;
    }

    const url =
        `${MLB_API}/standings?` +
        `leagueId=103,104&` +
        `season=${season}&` +
        `standingsTypes=wildCard&` +
        `hydrate=team,division,league`;

    const data =
        await fetchJson(
            url
        );

    await writeCache(
        filename,
        data
    );

    return data;
}

// ============================================================
// PUBLIC API
// ============================================================

export {
    getYesterday,
    getSchedule,
    getGameFeed,
    getPitcherRecord,
    getStandings,
    getWildCardStandings
};