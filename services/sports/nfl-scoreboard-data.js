// ============================================================
// NFL SCOREBOARD DATA SERVICE
//
// DEVELOPMENT / LIVE DATA
//
// Responsibilities:
//
// - Load the requested NFL week from ESPN
// - Cache scoreboard data
// - Identify the two featured games
// - Return all remaining games
// - Build TEAM-SPECIFIC featured-game leaders
//   for:
//      passing
//      rushing
//      receiving
//
// IMPORTANT:
//
// ESPN's competition.leaders is GAME-LEVEL data.
// It does NOT provide one leader for each team.
//
// Featured-game leaders are therefore built from the ESPN
// game SUMMARY / BOXSCORE data, where player statistics are
// associated with their team.
//
// ============================================================

import fs from "fs/promises";
import path from "path";


// ============================================================
// CONFIGURATION
// ============================================================

const NFL_DEVELOPMENT = {

    enabled:
        false,

    season:
        2025,

    week:
        1

};


const NFL_API =
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";


const NFL_SUMMARY_API =
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary";


const CACHE_DIR =
    path.resolve(
        process.cwd(),
        "data/sports/nfl"
    );


const CACHE_MAX_AGE =
    5 * 60 * 1000;


// ============================================================
// CACHE HELPERS
// ============================================================

async function ensureCacheDir() {

    await fs.mkdir(
        CACHE_DIR,
        {
            recursive:
                true
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
            JSON.parse(
                raw
            );


        const cachedAt =
            new Date(
                cached.cachedAt
            )
                .getTime();


        const age =
            Date.now() -
            cachedAt;


        if (
            age >
            maxAge
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
                    new Date()
                        .toISOString(),

                data

            },
            null,
            2
        )
    );

}


// ============================================================
// FETCH
// ============================================================

async function fetchJson(
    url
) {

    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `NFL request failed: ${response.status} ${response.statusText}`
        );

    }


    return response.json();

}


// ============================================================
// DATE / TIME HELPERS
// ============================================================

function getEasternNow() {

    const now =
        new Date();


    const parts =
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
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    false

            }
        )
            .formatToParts(
                now
            );


    const values =
        {};


    parts.forEach(
        part => {

            values[
                part.type
            ] =
                part.value;

        }
    );


    return {

        year:
            Number(
                values.year
            ),

        month:
            Number(
                values.month
            ),

        day:
            Number(
                values.day
            ),

        hour:
            Number(
                values.hour
            ),

        minute:
            Number(
                values.minute
            ),

        second:
            Number(
                values.second
            )

    };

}


// ============================================================
// SEASON
// ============================================================

function getNFLSeason() {

    const eastern =
        getEasternNow();


    return eastern.year;

}


// ============================================================
// GAME STATUS HELPERS
// ============================================================

function getGameStartTime(
    game
) {

    const date =
        game?.date ||
        game?.competitions?.[0]?.date ||
        null;


    if (
        !date
    ) {

        return null;

    }


    const timestamp =
        new Date(
            date
        )
            .getTime();


    if (
        Number.isNaN(
            timestamp
        )
    ) {

        return null;

    }


    return timestamp;

}


function hasGameStarted(
    game
) {

    const startTime =
        getGameStartTime(
            game
        );


    if (
        startTime ===
        null
    ) {

        return false;

    }


    return (
        Date.now() >=
        startTime
    );

}


function isGameCompleted(
    game
) {

    const status =
        game
            ?.status
            ?.type;


    if (
        status?.completed
    ) {

        return true;

    }


    return (
        status?.state ===
        "post"
    );

}


// ============================================================
// WEEK HELPERS
// ============================================================

function getWeekNumber(
    data
) {

    const week =
        data
            ?.week
            ?.number;


    if (
        Number.isInteger(
            week
        )
    ) {

        return week;

    }


    return null;

}


// ============================================================
// LOAD ESPN WEEK
// ============================================================

async function getNFLWeek(
    season,
    week
) {

    const filename =
        `scoreboard-${season}-week-${week}.json`;


    const cached =
        await readCache(
            filename,
            CACHE_MAX_AGE
        );


    if (
        cached
    ) {
        return cached;
    }


    const params =
        new URLSearchParams({

            dates:
                String(
                    season
                ),

            seasontype:
                "2",

            week:
                String(
                    week
                )

        });


    const data =
        await fetchJson(
            `${NFL_API}?${params}`
        );


    await writeCache(
        filename,
        data
    );


    return data;

}


// ============================================================
// LOAD ESPN GAME SUMMARY
// ============================================================

async function getNFLGameSummary(
    eventId
) {

    if (
        !eventId
    ) {

        return null;

    }


    const filename =
        `summary-${eventId}.json`;


    const cached =
        await readCache(
            filename,
            CACHE_MAX_AGE
        );


    if (
        cached
    ) {
        return cached;
    }


    const params =
        new URLSearchParams({

            event:
                String(
                    eventId
                )

        });


    const data =
        await fetchJson(
            `${NFL_SUMMARY_API}?${params}`
        );


    await writeCache(
        filename,
        data
    );


    return data;

}


// ============================================================
// DETERMINE DISPLAY WEEK
// ============================================================

async function determineDisplayWeek(
    season
) {

    let currentWeek =
        1;


    for (
        let week = 1;
        week <= 18;
        week++
    ) {

        const data =
            await getNFLWeek(
                season,
                week
            );


        const events =
            data.events ||
            [];


        if (
            events.length === 0
        ) {

            break;

        }


        const sortedEvents =
            [...events]
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const aTime =
                            getGameStartTime(
                                a
                            ) ??
                            Number.MAX_SAFE_INTEGER;


                        const bTime =
                            getGameStartTime(
                                b
                            ) ??
                            Number.MAX_SAFE_INTEGER;


                        return (
                            aTime -
                            bTime
                        );

                    }
                );


        const firstGame =
            sortedEvents[0];


        if (
            hasGameStarted(
                firstGame
            )
        ) {

            currentWeek =
                week;

            continue;

        }


        break;

    }


    return currentWeek;

}


// ============================================================
// TEAM HELPERS
// ============================================================

function getTeam(
    competition,
    side
) {

    return (
        competition
            ?.competitors
            ?.find(
                competitor =>
                    competitor.homeAway ===
                    side
            )
            ?.team ||
        null
    );

}


function getTeamAbbreviation(
    team
) {

    return (
        team?.abbreviation ||
        team?.shortDisplayName ||
        team?.displayName ||
        team?.name ||
        "???"
    );

}


// ============================================================
// GAME NORMALIZATION
// ============================================================

function normalizeGame(
    event
) {

    const competition =
        event
            ?.competitions
            ?.[0];


    if (
        !competition
    ) {

        return null;

    }


    const awayCompetitor =
        competition
            ?.competitors
            ?.find(
                competitor =>
                    competitor.homeAway ===
                    "away"
            );


    const homeCompetitor =
        competition
            ?.competitors
            ?.find(
                competitor =>
                    competitor.homeAway ===
                    "home"
            );


    if (
        !awayCompetitor ||
        !homeCompetitor
    ) {

        return null;

    }


    const awayTeam =
        awayCompetitor.team ||
        {};


    const homeTeam =
        homeCompetitor.team ||
        {};


    function normalizeQuarters(
        competitor
    ) {

        return (
            competitor
                ?.linescores
                ?.map(
                    line =>
                        line.value
                ) ||
            []
        );

    }


    return {

        id:
            event.id,

        date:
            event.date ||
            competition.date ||
            null,

        name:
            event.name ||
            `${getTeamAbbreviation(awayTeam)} at ${getTeamAbbreviation(homeTeam)}`,

        shortName:
            event.shortName ||
            `${getTeamAbbreviation(awayTeam)} @ ${getTeamAbbreviation(homeTeam)}`,

        status:
            event.status ||
            competition.status ||
            null,

        venue:
            competition.venue ||
            null,

        broadcast:
            competition.broadcasts
                ?.map(
                    broadcast =>
                        broadcast.names
                            ?.join(
                                ", "
                            )
                )
                .filter(
                    Boolean
                )
                .join(
                    ", "
                ) ||
            null,

        away: {

            id:
                awayTeam.id ||
                awayCompetitor.id ||
                null,

            abbreviation:
                getTeamAbbreviation(
                    awayTeam
                ),

            name:
                awayTeam.displayName ||
                awayTeam.name ||
                getTeamAbbreviation(
                    awayTeam
                ),

            shortName:
                awayTeam.shortDisplayName ||
                awayTeam.name ||
                getTeamAbbreviation(
                    awayTeam
                ),

            logo:
                awayTeam.logo ||
                awayTeam.logos?.[0]?.href ||
                null,

            score:
                awayCompetitor.score ??
                null,

            record:
                awayCompetitor.records?.[0]?.summary ||
                null,

            quarters:
                normalizeQuarters(
                    awayCompetitor
                ),

            leaders: {

                passing:
                    null,

                rushing:
                    null,

                receiving:
                    null

            }

        },

        home: {

            id:
                homeTeam.id ||
                homeCompetitor.id ||
                null,

            abbreviation:
                getTeamAbbreviation(
                    homeTeam
                ),

            name:
                homeTeam.displayName ||
                homeTeam.name ||
                getTeamAbbreviation(
                    homeTeam
                ),

            shortName:
                homeTeam.shortDisplayName ||
                homeTeam.name ||
                getTeamAbbreviation(
                    homeTeam
                ),

            logo:
                homeTeam.logo ||
                homeTeam.logos?.[0]?.href ||
                null,

            score:
                homeCompetitor.score ??
                null,

            record:
                homeCompetitor.records?.[0]?.summary ||
                null,

            quarters:
                normalizeQuarters(
                    homeCompetitor
                ),

            leaders: {

                passing:
                    null,

                rushing:
                    null,

                receiving:
                    null

            }

        }

    };

}


// ============================================================
// LEADER STAT EXTRACTION
// ============================================================
//
// ESPN summary structure:
//
// statistic = {
//
//     name: "passing",
//
//     keys: [
//         "completions/passingAttempts",
//         "passingYards",
//         "yardsPerPassAttempt",
//         "passingTouchdowns",
//         "interceptions",
//         ...
//     ],
//
//     athletes: [
//
//         {
//
//             athlete: {...},
//
//             stats: [
//
//                 "24/34",
//                 "362",
//                 "10.6",
//                 "1",
//                 "1",
//                 ...
//
//             ]
//
//         }
//
//     ]
//
// }
//
// The critical point is:
//
//     statistic.keys[i]
//         corresponds to
//     athlete.stats[i]
//
// We use that mapping instead of trying to infer fields
// from ESPN's display strings.
//
// ============================================================

function buildStatMap(
    statistic,
    athleteEntry
) {

    const keys =
        Array.isArray(
            statistic?.keys
        )
            ? statistic.keys
            : [];


    const stats =
        Array.isArray(
            athleteEntry?.stats
        )
            ? athleteEntry.stats
            : [];


    const map =
        {};


    keys.forEach(
        (
            key,
            index
        ) => {

            map[
                String(
                    key
                )
                    .toLowerCase()
            ] =
                stats[index];

        }
    );


    return map;

}


// ============================================================
// STAT LOOKUP
// ============================================================

function getMappedStat(
    statMap,
    possibleNames
) {

    for (
        const name of possibleNames
    ) {

        const normalized =
            String(
                name
            )
                .toLowerCase();


        if (
            statMap[
                normalized
            ] !==
            undefined
        ) {

            return statMap[
                normalized
            ];

        }

    }


    return null;

}


// ============================================================
// LEADER NORMALIZATION
// ============================================================
//
// Desired display:
//
// PASSING
//     24/34, 362, 1-1
//
// RUSHING
//     19, 38, 1
//
// RECEIVING
//     5-8, 103, 0
//
// ============================================================

function normalizeSummaryLeader(
    statistic,
    athleteEntry,
    type
) {

    if (
        !athleteEntry
    ) {

        return null;

    }


    const athlete =
        athleteEntry?.athlete ||
        {};


    const name =
        athlete.displayName ||
        athlete.fullName ||
        athlete.shortName ||
        "—";


    const statMap =
        buildStatMap(
            statistic,
            athleteEntry
        );


    // --------------------------------------------------------
    // PASSING
    // --------------------------------------------------------

    if (
        type ===
        "passing"
    ) {

        const completionAttempts =
            getMappedStat(
                statMap,
                [
                    "completions/passingAttempts",
                    "completionAttempts",
                    "C/ATT"
                ]
            );


        const yards =
            getMappedStat(
                statMap,
                [
                    "passingYards",
                    "yards",
                    "YDS"
                ]
            );


        const touchdowns =
            getMappedStat(
                statMap,
                [
                    "passingTouchdowns",
                    "touchdowns",
                    "TD"
                ]
            );


        const interceptions =
            getMappedStat(
                statMap,
                [
                    "interceptions",
                    "INT"
                ]
            );


        return {

            name,

            displayValue:

                `${completionAttempts ?? "—"}, ` +

                `${yards ?? "—"}, ` +

                `${touchdowns ?? 0}-${interceptions ?? 0}`

        };

    }


    // --------------------------------------------------------
    // RUSHING
    // --------------------------------------------------------

    if (
        type ===
        "rushing"
    ) {

        const attempts =
            getMappedStat(
                statMap,
                [
                    "rushingAttempts",
                    "attempts",
                    "carries",
                    "CAR",
                    "ATT"
                ]
            );


        const yards =
            getMappedStat(
                statMap,
                [
                    "rushingYards",
                    "yards",
                    "YDS"
                ]
            );


        const touchdowns =
            getMappedStat(
                statMap,
                [
                    "rushingTouchdowns",
                    "touchdowns",
                    "TD"
                ]
            );


        return {

            name,

            displayValue:

                `${attempts ?? "—"}, ` +

                `${yards ?? "—"}, ` +

                `${touchdowns ?? 0}`

        };

    }


    // --------------------------------------------------------
    // RECEIVING
    // --------------------------------------------------------

    if (
        type ===
        "receiving"
    ) {

        const receptions =
            getMappedStat(
                statMap,
                [
                    "receptions",
                    "REC"
                ]
            );


        const targets =
            getMappedStat(
                statMap,
                [
                    "targets",
                    "TGT"
                ]
            );


        const yards =
            getMappedStat(
                statMap,
                [
                    "receivingYards",
                    "yards",
                    "YDS"
                ]
            );


        const touchdowns =
            getMappedStat(
                statMap,
                [
                    "receivingTouchdowns",
                    "touchdowns",
                    "TD"
                ]
            );


        return {

            name,

            displayValue:

                `${receptions ?? "—"}-${targets ?? "—"}, ` +

                `${yards ?? "—"}, ` +

                `${touchdowns ?? 0}`

        };

    }


    return {

        name,

        displayValue:
            "—"

    };

}


// ============================================================
// DETERMINE LEADER VALUE
// ============================================================
//
// ESPN returns athletes ordered by the statistic, but we
// explicitly compare the first relevant numeric stat so that
// the correct leader is selected.
//
// ============================================================

function getLeaderSortValue(
    statistic,
    athleteEntry,
    type
) {

    const statMap =
        buildStatMap(
            statistic,
            athleteEntry
        );


    let value =
        null;


    if (
        type ===
        "passing"
    ) {

        const completionAttempts =
            getMappedStat(
                statMap,
                [
                    "completions/passingAttempts"
                ]
            );


        if (
            completionAttempts
        ) {

            const match =
                String(
                    completionAttempts
                )
                    .match(
                        /^(\d+)\s*\/\s*(\d+)$/
                    );


            if (
                match
            ) {

                value =
                    Number(
                        getMappedStat(
                            statMap,
                            [
                                "passingYards"
                            ]
                        )
                    );

            }

        }

    }


    else if (
        type ===
        "rushing"
    ) {

        value =
            Number(
                getMappedStat(
                    statMap,
                    [
                        "rushingYards"
                    ]
                )
            );

    }


    else if (
        type ===
        "receiving"
    ) {

        value =
            Number(
                getMappedStat(
                    statMap,
                    [
                        "receivingYards"
                    ]
                )
            );

    }


    if (
        !Number.isFinite(
            value
        )
    ) {

        return 0;

    }


    return value;

}


// ============================================================
// TEAM LEADERS FROM SUMMARY
// ============================================================
//
// Finds the boxscore group for the requested team and then
// finds the passing/rushing/receiving statistic groups.
//
// ============================================================

function getTeamLeadersFromSummary(
    summary,
    teamId
) {

    const result = {
        passing: null,
        rushing: null,
        receiving: null
    };

    if (
        !summary ||
        !teamId
    ) {
        return result;
    }

    const players =
        summary
            ?.boxscore
            ?.players ||
        [];

    const targetTeamId =
        String(teamId);

    const teamGroups =
        players.filter(
            group =>
                getTeamId(group?.team) ===
                targetTeamId
        );

    for (
        const group of teamGroups
    ) {

        const statistics =
            group?.statistics ||
            [];

        for (
            const statistic of statistics
        ) {

            const category =
                String(
                    statistic?.name ||
                    ""
                ).toLowerCase();

            if (
                category !== "passing" &&
                category !== "rushing" &&
                category !== "receiving"
            ) {
                continue;
            }

            const athletes =
                statistic?.athletes ||
                [];

            if (
                !Array.isArray(athletes) ||
                athletes.length === 0
            ) {
                continue;
            }

            /*
             * --------------------------------------------------
             * ESPN gives us:
             *
             * statistic.keys
             * statistic.labels
             *
             * athlete.stats
             *
             * Example:
             *
             * keys:
             *   completions/passingAttempts
             *   passingYards
             *   yardsPerPassAttempt
             *   passingTouchdowns
             *   interceptions
             *
             * stats:
             *   24/34
             *   362
             *   10.6
             *   1
             *   1
             *
             * Build a key/value map so we know exactly what
             * each number represents.
             * --------------------------------------------------
             */

            const keys =
                statistic?.keys ||
                [];

            const labels =
                statistic?.labels ||
                [];

            /*
             * ESPN normally puts the leader first, but sort
             * using the first numeric/stat value when possible.
             */

            const leaderEntry =
                athletes[0];

            if (
                !leaderEntry
            ) {
                continue;
            }

            const athlete =
                leaderEntry?.athlete ||
                {};

            const stats =
                leaderEntry?.stats ||
                [];

            const statMap = {};

            keys.forEach(
                (
                    key,
                    index
                ) => {

                    statMap[
                        String(key).toLowerCase()
                    ] =
                        stats[index];

                }
            );

            /*
             * Also map the human-readable labels.
             */

            labels.forEach(
                (
                    label,
                    index
                ) => {

                    statMap[
                        String(label).toLowerCase()
                    ] =
                        stats[index];

                }
            );

            const name =
                athlete.displayName ||
                athlete.fullName ||
                athlete.shortName ||
                "—";

            /*
             * --------------------------------------------------
             * PASSING
             *
             * Desired:
             *
             * C/ATT 24/39
             * YDS 258
             * TD-INT 1-0
             * --------------------------------------------------
             */

            if (
                category === "passing"
            ) {

                const completionAttempts =
                    statMap[
                        "completions/passingattempts"
                    ] ??
                    statMap["c/att"] ??
                    "—";

                const yards =
                    statMap[
                        "passingyards"
                    ] ??
                    statMap["yds"] ??
                    "—";

                const touchdowns =
                    statMap[
                        "passingtouchdowns"
                    ] ??
                    statMap["td"] ??
                    "0";

                const interceptions =
                    statMap[
                        "interceptions"
                    ] ??
                    statMap["int"] ??
                    "0";


                // PASSING
                result.passing = {
                    name,
                    displayValue:
                        `${completionAttempts} COMP/ATT | ` +
                        `${yards} YDS | ` +
                        `${touchdowns}-${interceptions} TD-INT`
                };

                continue;
            }

            /*
             * --------------------------------------------------
             * RUSHING
             *
             * Desired:
             *
             * CAR 6
             * YDS 57
             * TD 1
             * --------------------------------------------------
             */

            if (
                category === "rushing"
            ) {

                const attempts =
                    statMap[
                        "rushingattempts"
                    ] ??
                    statMap["car"] ??
                    statMap["att"] ??
                    "—";

                const yards =
                    statMap[
                        "rushingyards"
                    ] ??
                    statMap["yds"] ??
                    "—";

                const touchdowns =
                    statMap[
                        "rushingtouchdowns"
                    ] ??
                    statMap["td"] ??
                    "0";

                // RUSHING
                result.rushing = {
                    name,
                    displayValue:
                        `${attempts} CAR | ` +
                        `${yards} YDS | ` +
                        `${touchdowns} TD`
                };

                continue;
            }

            /*
             * --------------------------------------------------
             * RECEIVING
             *
             * Desired:
             *
             * REC-TGT 10-16
             * YDS 99
             * TD 0
             *
             * IMPORTANT:
             *
             * targets must come from the GAME statistic
             * group, NOT season totals.
             * --------------------------------------------------
             */

            if (
                category === "receiving"
            ) {

                const receptions =
                    statMap[
                        "receptions"
                    ] ??
                    statMap["rec"] ??
                    "—";

                const targets =
                    statMap[
                        "targets"
                    ] ??
                    statMap["tgt"] ??
                    statMap["tgts"] ??
                    "—";

                const yards =
                    statMap[
                        "receivingyards"
                    ] ??
                    statMap["yds"] ??
                    "—";

                const touchdowns =
                    statMap[
                        "receivingtouchdowns"
                    ] ??
                    statMap["td"] ??
                    "0";

                // RECEIVING
                result.receiving = {
                    name,
                    displayValue:
                        `${receptions}-${targets} REC-TGT | ` +
                        `${yards} YDS | ` +
                        `${touchdowns} TD`
                };

                continue;
            }
        }
    }

    return result;
}


// ============================================================
// FALLBACK TEAM LEADER PARSER
// ============================================================
//
// Kept as a safety net for slight ESPN response variations.
//
// ============================================================

function getTeamLeadersFromSummaryFallback(
    summary,
    teamId
) {

    const result = {

        passing:
            null,

        rushing:
            null,

        receiving:
            null

    };


    const players =
        summary
            ?.boxscore
            ?.players ||
        [];


    const targetTeamId =
        String(
            teamId
        );


    for (
        const group of players
    ) {

        if (
            getTeamId(
                group?.team
            ) !==
            targetTeamId
        ) {

            continue;

        }


        const statistics =
            group?.statistics ||
            [];


        for (
            const statistic of statistics
        ) {

            const category =
                String(
                    statistic?.name ||
                    ""
                )
                    .toLowerCase();


            if (
                ![
                    "passing",
                    "rushing",
                    "receiving"
                ]
                    .includes(
                        category
                    )
            ) {

                continue;

            }


            if (
                result[
                    category
                ]
            ) {

                continue;

            }


            const athletes =
                statistic?.athletes ||
                [];


            if (
                !athletes.length
            ) {

                continue;

            }


            const leaderEntry =
                athletes[0];


            result[
                category
            ] =
                normalizeSummaryLeader(
                    statistic,
                    leaderEntry,
                    category
                );

        }

    }


    return result;

}


// ============================================================
// FIND TEAM ID
// ============================================================

function getTeamId(
    team
) {

    return String(

        team?.id ??
        team?.team?.id ??
        ""

    );

}


// ============================================================
// POPULATE FEATURED LEADERS
// ============================================================

async function populateFeaturedLeaders(
    game
) {

    if (
        !game ||
        !game.id
    ) {

        return game;

    }


    try {

        const summary =
            await getNFLGameSummary(
                game.id
            );


        if (
            !summary
        ) {

            console.warn(
                `NFL featured leaders: no summary returned for ${game.id}`
            );


            return game;

        }


        const awayTeamId =
            getTeamId(
                game.away
            );


        const homeTeamId =
            getTeamId(
                game.home
            );


        let awayLeaders =
            getTeamLeadersFromSummary(
                summary,
                awayTeamId
            );


        let homeLeaders =
            getTeamLeadersFromSummary(
                summary,
                homeTeamId
            );


        const fallbackAway =
            getTeamLeadersFromSummaryFallback(
                summary,
                awayTeamId
            );


        const fallbackHome =
            getTeamLeadersFromSummaryFallback(
                summary,
                homeTeamId
            );


        for (
            const category of [
                "passing",
                "rushing",
                "receiving"
            ]
        ) {

            if (
                !awayLeaders[category] &&
                fallbackAway[category]
            ) {

                awayLeaders[category] =
                    fallbackAway[category];

            }


            if (
                !homeLeaders[category] &&
                fallbackHome[category]
            ) {

                homeLeaders[category] =
                    fallbackHome[category];

            }

        }


        game.away.leaders =
            awayLeaders;


        game.home.leaders =
            homeLeaders;


        return game;

    }

    catch (
        error
    ) {

        console.error(
            `Unable to load NFL featured leaders for ${game.id}:`,
            error
        );


        return game;

    }

}


// ============================================================
// BUILD SCOREBOARD FOR A SPECIFIC WEEK
// ============================================================

async function getNFLScoreboardForWeek(
    season,
    week,
    config = {}
) {

    const data =
        await getNFLWeek(
            season,
            week
        );


    const events =
        data.events ||
        [];


    const games =
        events
            .map(
                normalizeGame
            )
            .filter(
                Boolean
            );


    const featuredConfig =
        config.featured ||
        {};


    const findFeatured =
        featured => {

            const team =
                featured?.team ||
                featured?.abbreviation ||
                null;


            if (
                !team
            ) {

                return null;

            }


            const normalizedTeam =
                String(
                    team
                )
                    .toUpperCase();


            return (

                games.find(
                    game =>

                        game.away.abbreviation
                            ?.toUpperCase() ===
                        normalizedTeam ||

                        game.home.abbreviation
                            ?.toUpperCase() ===
                        normalizedTeam
                ) ||

                null

            );

        };


    // ========================================================
    // DEVELOPMENT DEFAULTS
    // ========================================================

    const developmentDefaults = {

        left:
            {
                team:
                    "NE"
            },

        right:
            {
                team:
                    "KC"
            }

    };


    const effectiveFeaturedConfig =

        NFL_DEVELOPMENT.enabled

            ? {

                left:
                    featuredConfig.left ||
                    developmentDefaults.left,

                right:
                    featuredConfig.right ||
                    developmentDefaults.right

            }

            : featuredConfig;


    let leftGame =
        findFeatured(
            effectiveFeaturedConfig.left
        );


    let rightGame =
        findFeatured(
            effectiveFeaturedConfig.right
        );


    // ========================================================
    // LOAD DETAILED LEADERS
    // ========================================================

    if (
        leftGame
    ) {

        leftGame =
            await populateFeaturedLeaders(
                leftGame
            );

    }


    if (
        rightGame
    ) {

        if (
            !leftGame ||
            rightGame.id !==
            leftGame.id
        ) {

            rightGame =
                await populateFeaturedLeaders(
                    rightGame
                );

        }

        else {

            rightGame =
                leftGame;

        }

    }


    const featured = {

        left: {

            game:
                leftGame

        },

        right: {

            game:
                rightGame

        }

    };


    const featuredIds =
        new Set(

            [

                featured.left.game?.id,

                featured.right.game?.id

            ]
                .filter(
                    Boolean
                )

        );


    const otherGames =
        games.filter(
            game =>
                !featuredIds.has(
                    game.id
                )
        );


    return {

        season,

        week,

        weekLabel:
            `WEEK ${week}`,

        games:
            otherGames,

        featured

    };

}


// ============================================================
// REAL / LIVE SCOREBOARD
// ============================================================

async function getRealNFLScoreboard(
    config = {}
) {

    const season =
        getNFLSeason();


    const week =
        await determineDisplayWeek(
            season
        );


    return getNFLScoreboardForWeek(
        season,
        week,
        config
    );

}


// ============================================================
// PUBLIC SCOREBOARD API
// ============================================================

async function getNFLScoreboard(
    config = {}
) {

    if (
        NFL_DEVELOPMENT.enabled
    ) {

        console.log(
            `NFL development mode enabled: ${NFL_DEVELOPMENT.season} Week ${NFL_DEVELOPMENT.week}`
        );


        return getNFLScoreboardForWeek(
            NFL_DEVELOPMENT.season,
            NFL_DEVELOPMENT.week,
            config
        );

    }


    return getRealNFLScoreboard(
        config
    );

}


// ============================================================
// EXPORTS
// ============================================================

export {

    getNFLScoreboard,

    determineDisplayWeek,

    getNFLWeek,

    normalizeGame

};