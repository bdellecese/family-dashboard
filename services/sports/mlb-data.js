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
// POSTSEASON GAMES
// ============================================================

async function getPostseasonGames(
    season,
    apiDate
) {
    const filename =
        `postseason-games-${season}-${apiDate}.json`;

    // Completed postseason games don't change.
    // Cache the day's games for 24 hours.
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
            `${MLB_API}/schedule?sportId=1&` +
            `season=${season}&` +
            `date=${apiDate}&` +
            `gameTypes=F,D,L,W`
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
// POSTSEASON SEEDS
// ============================================================
//
// Builds the official postseason seed for each playoff team.
//
// MLB postseason seeding:
//   1-3 = division winners
//   4-6 = wild cards
//
// The standings endpoint provides leagueRank and wildCardRank,
// but those values are not directly the postseason bracket seed.
// We therefore derive the six playoff seeds from the final
// regular-season standings.
// ============================================================

async function getPostseasonSeeds(
    season
) {
    const filename =
        `postseason-seeds-${season}.json`;

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
            `${MLB_API}/standings?` +
            `leagueId=103,104&` +
            `season=${season}&` +
            `standingsTypes=regularSeason&` +
            `hydrate=team,division,league`
        );

    const seeds =
        {};

    for (
        const record of
            data.records || []
    ) {

        const leagueId =
            record.teamRecords?.[0]
                ?.team?.league?.id;

        const teamRecords =
            record.teamRecords || [];

        /*
         * The standings response is grouped by division.
         * We need to identify the three division winners
         * in each league first.
         */

        teamRecords.forEach(
            teamRecord => {

                const team =
                    teamRecord.team;

                if (
                    !team
                ) {
                    return;
                }

                if (
                    teamRecord.divisionRank === "1" ||
                    teamRecord.divisionRank === 1
                ) {

                    const league =
                        team.league?.id === 103
                            ? "AL"
                            : team.league?.id === 104
                                ? "NL"
                                : null;

                    if (
                        league
                    ) {

                        if (
                            !seeds[league]
                        ) {
                            seeds[league] =
                                {
                                    divisionWinners: [],
                                    wildCards: []
                                };
                        }

                        seeds[league]
                            .divisionWinners
                            .push(
                                teamRecord
                            );
                    }
                }
            }
        );
    }

    /*
     * --------------------------------------------------------
     * Build seeds 1-3 from division winners.
     *
     * MLB's league rank gives us their ordering.
     * --------------------------------------------------------
     */

    ["AL", "NL"].forEach(
        league => {

            const leagueId =
                league === "AL"
                    ? 103
                    : 104;

            const divisionWinners =
                seeds[league]
                    ?.divisionWinners || [];

            divisionWinners.sort(
                (a, b) =>
                    Number(
                        a.leagueRank
                    ) -
                    Number(
                        b.leagueRank
                    )
            );

            divisionWinners
                .forEach(
                    (
                        teamRecord,
                        index
                    ) => {

                        seeds[league]
                            .divisionWinners[
                                index
                            ] =
                            teamRecord;

                        seeds[league]
                            .divisionWinners[
                                index
                            ].postseasonSeed =
                            index + 1;
                    }
                );

            /*
             * ------------------------------------------------
             * Wild-card teams.
             *
             * WildCardRank identifies the playoff wild-card
             * order. We exclude division winners.
             * ------------------------------------------------
             */

            const allTeams =
                [];

            /*
             * We need all records for this league,
             * not just the division winners.
             */

            // Populated below from the original standings data.
        }
    );

    /*
     * Rebuild the seed map directly from all standings
     * records. This keeps the logic simple and deterministic.
     */

    const leagueTeams = {
        AL: [],
        NL: []
    };

    for (
        const record of
            data.records || []
    ) {

        for (
            const teamRecord of
                record.teamRecords || []
        ) {

            const leagueId =
                teamRecord.team?.league?.id;

            const league =
                leagueId === 103
                    ? "AL"
                    : leagueId === 104
                        ? "NL"
                        : null;

            if (
                league
            ) {

                leagueTeams[league]
                    .push(
                        teamRecord
                    );
            }
        }
    }

    ["AL", "NL"].forEach(
        league => {

            const teams =
                leagueTeams[league];

            const divisionWinners =
                teams.filter(
                    teamRecord =>
                        Number(
                            teamRecord.divisionRank
                        ) === 1
                );

            divisionWinners.sort(
                (a, b) =>
                    Number(
                        a.leagueRank
                    ) -
                    Number(
                        b.leagueRank
                    )
            );

            divisionWinners
                .forEach(
                    (
                        teamRecord,
                        index
                    ) => {

                        seeds[league]
                            .divisionWinners[
                                index
                            ] = {
                                teamId:
                                    teamRecord
                                        .team
                                        .id,

                                seed:
                                    index + 1
                            };
                    }
                );

            const divisionWinnerIds =
                new Set(
                    divisionWinners.map(
                        teamRecord =>
                            teamRecord
                                .team
                                .id
                    )
                );

            const wildCards =
                teams
                    .filter(
                        teamRecord =>
                            !divisionWinnerIds
                                .has(
                                    teamRecord
                                        .team
                                        .id
                                ) &&
                            teamRecord
                                .wildCardRank &&
                            teamRecord
                                .wildCardRank !==
                                "-"
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                a.wildCardRank
                            ) -
                            Number(
                                b.wildCardRank
                            )
                    );

            wildCards
                .slice(0, 3)
                .forEach(
                    (
                        teamRecord,
                        index
                    ) => {

                        seeds[league]
                            .wildCards
                            .push({
                                teamId:
                                    teamRecord
                                        .team
                                        .id,

                                seed:
                                    index + 4
                            });
                    }
                );
        }
    );

    /*
     * Flatten the result into a simple lookup:
     *
     * {
     *   "147": 1,
     *   "136": 2,
     *   ...
     * }
     */

    const seedMap =
        {};

    ["AL", "NL"].forEach(
        league => {

            [
                ...(
                    seeds[league]
                        ?.divisionWinners ||
                    []
                ),
                ...(
                    seeds[league]
                        ?.wildCards ||
                    []
                )
            ].forEach(
                entry => {

                    if (
                        entry?.teamId &&
                        entry?.seed
                    ) {

                        seedMap[
                            entry.teamId
                        ] =
                            entry.seed;
                    }
                }
            );
        }
    );

    await writeCache(
        filename,
        seedMap
    );

    return seedMap;
}

// ============================================================
// POSTSEASON SERIES
// ============================================================

async function getPostseasonSeries(
    season
) {
    const filename =
        `postseason-${season}.json`;

    // The postseason bracket can change as games are completed.
    // Refresh periodically rather than treating it as immutable.
    const cached =
        await readCache(
            filename,
            30 * 60 * 1000
        );

    if (cached) {
        return cached;
    }

    const data =
        await fetchJson(
            `${MLB_API}/schedule/postseason/series?sportId=1&season=${season}`
        );

    await writeCache(
        filename,
        data
    );

    return data;
}

// ============================================================
// POSTSEASON BRACKET NORMALIZATION
// ============================================================
//
// Converts the raw MLB postseason series response into a
// stable bracket model for the dashboard.
//
// The bracket is represented by:
// - Wild Card
// - Division Series
// - League Championship Series
// - World Series
//
// Series relationships are represented with feedsFrom / feedsInto
// so future matchups can be displayed before the teams are known.
// ============================================================

function normalizePostseasonBracket(
    data,
    postseasonSeeds = {}
) {
    const seriesList =
        data?.series || [];

    const normalized =
        seriesList.map(
            seriesData => {

                const series =
                    seriesData.series || {};

                const games =
                    seriesData.games || [];

                const gamesInSeries =
                    games[0]?.gamesInSeries ||
                    null;

                const firstGame =
                    games[0];

                const gameType =
                    series.gameType;

                const description =
                    firstGame?.seriesDescription ||
                    "";

                const league =
                    description.startsWith("AL")
                        ? "AL"
                        : description.startsWith("NL")
                            ? "NL"
                            : null;

                const teams =
                    getSeriesTeams(
                        games,
                        postseasonSeeds
                    );

                const winner =
                    getSeriesWinner(
                        teams,
                        gamesInSeries
                    );

                return {
                    id:
                        series.id,

                    gameType,

                    round:
                        getPostseasonRound(
                            gameType
                        ),

                    league,

                    seriesNumber:
                        getSeriesNumber(
                            series.id
                        ),

                    description,

                    teams,

                    winner,

                    gamesInSeries,

                    games
                };
            }
        );

    const wildCard =
        normalized.filter(
            series =>
                series.gameType === "F"
        );

    const divisionSeries =
        normalized.filter(
            series =>
                series.gameType === "D"
        );

    const leagueChampionship =
        normalized.filter(
            series =>
                series.gameType === "L"
        );

    const worldSeries =
        normalized.filter(
            series =>
                series.gameType === "W"
        );

    addBracketRelationships(
        wildCard,
        divisionSeries,
        leagueChampionship,
        worldSeries
    );

    return {
        wildCard,
        divisionSeries,
        leagueChampionship,
        worldSeries
    };
}


// ============================================================
// POSTSEASON ROUND
// ============================================================

function getPostseasonRound(
    gameType
) {
    switch (
        gameType
    ) {
        case "F":
            return "wildCard";

        case "D":
            return "divisionSeries";

        case "L":
            return "leagueChampionship";

        case "W":
            return "worldSeries";

        default:
            return "unknown";
    }
}

// ============================================================
// FILTER POSTSEASON BRACKET BY DATE
// ============================================================
//
// Creates a historical snapshot of the postseason bracket.
//
// Future games are removed from each series so that teams,
// wins, losses, and winners cannot leak into a historical
// test date.
//
// The bracket structure itself remains intact.
//
// Future-round teams are populated as soon as they become
// mathematically known, even if that round has not started.
// ============================================================

function filterPostseasonBracketByDate(
    bracket,
    apiDate,
    postseasonSeeds = {}
) {

    const cutoff =
        new Date(
            `${apiDate}T23:59:59`
        );


    function getCompletedGames(
        series
    ) {

        return (
            series?.games ||
            []
        ).filter(
            game => {

                const gameDate =
                    game.gameDate ||
                    game.date ||
                    game.officialDate;

                if (
                    !gameDate
                ) {
                    return false;
                }

                return (
                    new Date(
                        gameDate
                    ) <= cutoff
                );

            }
        );

    }


    function filterSeries(
        series
    ) {

        return (
            series || []
        ).map(
            currentSeries => {

                const completedGames =
                    getCompletedGames(
                        currentSeries
                    );


                if (
                    completedGames.length === 0
                ) {

                    let knownTeams = [];


                    /*
                    * Wild Card:
                    *
                    * The matchup itself is known even before the first
                    * game is played.
                    */
                    if (
                        currentSeries.round ===
                        "wildCard"
                    ) {

                        knownTeams =
                            (
                                currentSeries.teams ||
                                []
                            ).map(
                                team => ({
                                    ...team,
                                    wins: 0,
                                    losses: 0
                                })
                            );

                    }


                    /*
                    * Division Series:
                    *
                    * The #1/#2 bye team is known immediately.
                    *
                    * If the corresponding Wild Card series has already
                    * produced a winner, that team is also known even
                    * though the Division Series has not started.
                    */
                    else if (
                        currentSeries.round ===
                        "divisionSeries"
                    ) {

                        const byeTeam =
                            (
                                currentSeries.teams ||
                                []
                            ).find(
                                team =>
                                    team.seed === 1 ||
                                    team.seed === 2
                            );


                        let wildCardWinner =
                            null;


                        if (
                            byeTeam
                        ) {

                            const opponentSeeds =
                                byeTeam.seed === 1
                                    ? [4, 5]
                                    : [3, 6];


                            const wildCardSeries =
                                (
                                    filteredWildCard ||
                                    []
                                ).find(
                                    wc =>
                                        wc.league ===
                                            currentSeries.league &&
                                        wc.teams?.some(
                                            team =>
                                                opponentSeeds.includes(
                                                    team.seed
                                                )
                                        )
                                );


                            if (
                                wildCardSeries?.winner
                            ) {

                                wildCardWinner =
                                    (
                                        wildCardSeries.teams ||
                                        []
                                    ).find(
                                        team =>
                                            team.id ===
                                            wildCardSeries.winner
                                    );

                            }

                        }


                        if (
                            wildCardWinner &&
                            byeTeam
                        ) {

                            knownTeams = [
                                {
                                    ...wildCardWinner,
                                    wins: 0,
                                    losses: 0
                                },
                                {
                                    ...byeTeam,
                                    wins: 0,
                                    losses: 0
                                }
                            ];

                        }
                        else if (
                            byeTeam
                        ) {

                            knownTeams = [
                                {
                                    ...byeTeam,
                                    wins: 0,
                                    losses: 0
                                }
                            ];

                        }
                        else {

                            knownTeams = [];

                        }

                    }


                    /*
                     * LCS:
                     *
                     * The teams become known as soon as the corresponding
                     * Division Series produce winners.
                     */
                    else if (
                        currentSeries.round ===
                        "leagueChampionship"
                    ) {

                        const divisionSeries =
                            filteredDivisionSeries ||
                            [];

                        const leagueWinners =
                            divisionSeries
                                .filter(
                                    divisionSeries =>
                                        divisionSeries.league ===
                                        currentSeries.league &&
                                        divisionSeries.winner
                                )
                                .map(
                                    divisionSeries => {

                                        return (
                                            divisionSeries.teams ||
                                            []
                                        ).find(
                                            team =>
                                                team.id ===
                                                divisionSeries.winner
                                        );

                                    }
                                )
                                .filter(Boolean);

                        knownTeams =
                            leagueWinners.map(
                                team => ({
                                    ...team,
                                    wins: 0,
                                    losses: 0
                                })
                            );

                    }

                    /*
                     * World Series:
                     *
                     * The teams become known as soon as the ALCS
                     * and NLCS produce winners.
                     */

                    else if (
                        currentSeries.round ===
                        "worldSeries"
                    ) {

                        const leagueChampionship =
                            filteredLeagueChampionship ||
                            [];

                        const leagueWinners =
                            leagueChampionship
                                .filter(
                                    championshipSeries =>
                                        championshipSeries.winner
                                )
                                .map(
                                    championshipSeries => {

                                        return (
                                            championshipSeries.teams ||
                                            []
                                        ).find(
                                            team =>
                                                team.id ===
                                                championshipSeries.winner
                                        );

                                    }
                                )
                                .filter(Boolean);

                        knownTeams =
                            leagueWinners.map(
                                team => ({
                                    ...team,
                                    wins: 0,
                                    losses: 0
                                })
                            );

                    }
                    else {
                        knownTeams = [];
                    }
                    return {

                        ...currentSeries,

                        teams:
                            knownTeams,

                        winner:
                            null,

                        games: []

                    };

                }


                /*
                 * ----------------------------------------------------
                 * Recalculate the series using only games that had
                 * actually occurred by the requested date.
                 * ----------------------------------------------------
                 */

                const teams =
                    getSeriesTeams(
                        completedGames,
                        postseasonSeeds
                    );

                const winner =
                    getSeriesWinner(
                        teams,
                        currentSeries.gamesInSeries
                    );

                return {

                    ...currentSeries,

                    teams,

                    winner,

                    games:
                        completedGames

                };

            }
        );

    }


    /*
     * ------------------------------------------------------------
     * FILTER WILD CARD FIRST
     *
     * Division Series filtering needs the already-filtered Wild
     * Card results so that a completed WC winner can immediately
     * advance into the historical Division Series snapshot.
     * ------------------------------------------------------------
     */

    const filteredWildCard =
        filterSeries(
            bracket.wildCard
        );


    const filteredDivisionSeries =
        filterSeries(
            bracket.divisionSeries
        );


        const filteredLeagueChampionship =
        filterSeries(
            bracket.leagueChampionship
        );


    const filteredWorldSeries =
        filterSeries(
            bracket.worldSeries
        );


    return {

        ...bracket,

        wildCard:
            filteredWildCard,

        divisionSeries:
            filteredDivisionSeries,

        leagueChampionship:
            filteredLeagueChampionship,

        worldSeries:
            filteredWorldSeries

    };

}


// ============================================================
// SERIES NUMBER
// ============================================================

function getSeriesNumber(
    seriesId
) {
    const match =
        seriesId?.match(
            /_(\d+)$/
        );

    return match
        ? Number(match[1])
        : null;
}


// ============================================================
// SERIES TEAMS
// ============================================================
//
// A series may contain multiple games with the same two teams.
// We build the team objects once and calculate the current series
// record from the games themselves.
// ============================================================

function getSeriesTeams(
    games,
    postseasonSeeds = {}
) {
    const teams =
        new Map();

    games.forEach(
        game => {

            [
                game.teams?.away,
                game.teams?.home
            ]
                .filter(Boolean)
                .forEach(
                    teamData => {

                        const team =
                            teamData.team;

                        if (!team) {
                            return;
                        }

                        if (
                            !teams.has(
                                team.id
                            )
                        ) {
                            teams.set(
                                team.id,
                                {
                                    id:
                                        team.id,

                                    name:
                                        team.name,

                                    seed:
                                        postseasonSeeds[
                                            team.id
                                        ] || null,

                                    wins:
                                        0,

                                    losses:
                                        0
                                }
                            );
                        }

                        const normalizedTeam =
                            teams.get(
                                team.id
                            );

                        if (
                            teamData.isWinner
                        ) {
                            normalizedTeam.wins++;
                        }
                        else if (
                            game.status
                                ?.abstractGameState ===
                            "Final"
                        ) {
                            normalizedTeam.losses++;
                        }
                    }
                );
        }
    );

    return Array.from(
        teams.values()
    );
}


// ============================================================
// SERIES WINNER
// ============================================================

function getSeriesWinner(
    teams,
    gamesInSeries
) {
    if (
        !teams ||
        teams.length !== 2 ||
        !gamesInSeries
    ) {
        return null;
    }

    const sorted =
        [...teams].sort(
            (a, b) =>
                b.wins -
                a.wins
        );

    const winsNeeded =
        Math.floor(
            gamesInSeries / 2
        ) + 1;

    if (
        sorted[0].wins >=
        winsNeeded
    ) {
        return sorted[0].id;
    }

    return null;
}


// ============================================================
// BRACKET RELATIONSHIPS
// ============================================================
//
// These relationships describe the structure of the MLB bracket.
// They intentionally do NOT assume future team identities.
//
// 2025 MLB structure:
//
// AL:
//   F_1 + F_2 -> D_1 / D_2
//   D_1 + D_2 -> L_1
//
// NL:
//   F_3 + F_4 -> D_3 / D_4
//   D_3 + D_4 -> L_2
//
// World Series:
//   L_1 + L_2 -> W_1
//
// ============================================================

function addBracketRelationships(
    wildCard,
    divisionSeries,
    leagueChampionship,
    worldSeries
) {

    const findSeries =
        (
            collection,
            id
        ) =>
            collection.find(
                series =>
                    series.id === id
            );

    // --------------------------------------------------------
    // AL DIVISION SERIES
    // --------------------------------------------------------

    const alDivision =
        divisionSeries.filter(
            series =>
                series.league === "AL"
        );

    const alWildCard =
        wildCard.filter(
            series =>
                series.league === "AL"
        );

    alDivision.forEach(
        series => {

            series.feedsFrom =
                alWildCard.map(
                    wc =>
                        wc.id
                );

            alWildCard.forEach(
                wc => {

                    if (
                        !wc.feedsInto
                    ) {
                        wc.feedsInto =
                            [];
                    }

                    if (
                        !wc.feedsInto.includes(
                            series.id
                        )
                    ) {
                        wc.feedsInto.push(
                            series.id
                        );
                    }
                }
            );
        }
    );

    // --------------------------------------------------------
    // NL DIVISION SERIES
    // --------------------------------------------------------

    const nlDivision =
        divisionSeries.filter(
            series =>
                series.league === "NL"
        );

    const nlWildCard =
        wildCard.filter(
            series =>
                series.league === "NL"
        );

    nlDivision.forEach(
        series => {

            series.feedsFrom =
                nlWildCard.map(
                    wc =>
                        wc.id
                );

            nlWildCard.forEach(
                wc => {

                    if (
                        !wc.feedsInto
                    ) {
                        wc.feedsInto =
                            [];
                    }

                    if (
                        !wc.feedsInto.includes(
                            series.id
                        )
                    ) {
                        wc.feedsInto.push(
                            series.id
                        );
                    }
                }
            );
        }
    );

    // --------------------------------------------------------
    // LEAGUE CHAMPIONSHIP
    // --------------------------------------------------------

    leagueChampionship.forEach(
        series => {

            const division =
                divisionSeries.filter(
                    ds =>
                        ds.league ===
                        series.league
                );

            series.feedsFrom =
                division.map(
                    ds =>
                        ds.id
                );

            division.forEach(
                ds => {

                    if (
                        !ds.feedsInto
                    ) {
                        ds.feedsInto =
                            [];
                    }

                    if (
                        !ds.feedsInto.includes(
                            series.id
                        )
                    ) {
                        ds.feedsInto.push(
                            series.id
                        );
                    }
                }
            );
        }
    );

    // --------------------------------------------------------
    // WORLD SERIES
    // --------------------------------------------------------

    const worldSeriesEntry =
        worldSeries[0];

    if (
        worldSeriesEntry
    ) {

        worldSeriesEntry.feedsFrom =
            leagueChampionship.map(
                series =>
                    series.id
            );

        leagueChampionship.forEach(
            series => {

                if (
                    !series.feedsInto
                ) {
                    series.feedsInto =
                        [];
                }

                if (
                    !series.feedsInto.includes(
                        worldSeriesEntry.id
                    )
                ) {
                    series.feedsInto.push(
                        worldSeriesEntry.id
                    );
                }
            }
        );
    }
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
    getWildCardStandings,
    getPostseasonGames,
    getPostseasonSeries,
    getPostseasonSeeds,
    normalizePostseasonBracket,
    filterPostseasonBracketByDate
};