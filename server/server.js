// ============================================================
// FAMILY DASHBOARD SERVER
// ============================================================

import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { TODOIST } from "../config/todoist.js";

import {
    getGoogleCalendarAuthUrl,
    exchangeGoogleCode,
    getCalendars,
    getEventsForRange,
    getGoogleCalendarAuthorizationStatus
} from "../services/google-calendar/google-calendar-server.js";

import icloudPhotoData
    from "../services/photos/icloud-photo-data.js";

import {
    getStatus
} from "../services/sonos/sonos-data.js";

import schoolLunchData
    from "../services/school-lunch/school-lunch-data.js";

import {
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
} from "../services/sports/mlb-data.js";

import {
    getNFLStandings,
    normalizeStandings
} from "../services/sports/nfl-data.js";

import {
    getNFLScoreboard
} from "../services/sports/nfl-scoreboard-data.js";

import {
    getPerformanceEvents,
    recordPerformanceEvents,
    clearPerformanceEvents
} from "../services/performance/performance-server.js";

import rssData
    from "../services/rss/rss-data.js";

import {
    getCommute
} from "../services/commute/commute-server.js";


const HOST = "0.0.0.0";
const PORT = 3000;


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

const ROOT_DIR =
    path.resolve(
        __dirname,
        ".."
    );


// ============================================================
// JSON RESPONSE HELPER
// ============================================================

function sendJson(
    response,
    statusCode,
    data
) {

    response.writeHead(
        statusCode,
        {
            "Content-Type":
                "application/json; charset=utf-8",

            "Access-Control-Allow-Origin":
                "*"
        }
    );

    response.end(
        JSON.stringify(
            data
        )
    );

}


// ============================================================
// TODOIST HELPERS
// ============================================================

async function todoistSync(
    resourceTypes
) {

    if (!TODOIST.token) {

        throw new Error(
            "Todoist API token is not configured."
        );

    }


    const todoistResponse =
        await fetch(
            "https://api.todoist.com/api/v1/sync",
            {
                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${TODOIST.token}`,

                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    "Accept":
                        "application/json"

                },

                body:
                    new URLSearchParams({

                        sync_token:
                            "*",

                        resource_types:
                            JSON.stringify(
                                resourceTypes
                            )

                    })

            }
        );


    const data =
        await todoistResponse.json();


    if (
        !todoistResponse.ok
    ) {

        throw new Error(
            `Todoist Sync API returned ${todoistResponse.status}: ${JSON.stringify(data)}`
        );

    }


    return data;

}


// ============================================================
// TODOIST FILTER
// ============================================================

async function getTodoistFilter(
    filterName
) {

    const data =
        await todoistSync(
            ["filters"]
        );


    const filters =
        data.filters || [];


    const filter =
        filters.find(
            item =>
                !item.is_deleted &&
                item.name === filterName
        );


    if (!filter) {

        throw new Error(
            `Todoist filter "${filterName}" was not found.`
        );

    }


    return filter;

}


// ============================================================
// TODOIST PROJECT COLLABORATORS
// ============================================================

async function getTodoistCollaborators(
    projectId
) {

    const todoistResponse =
        await fetch(
            `https://api.todoist.com/api/v1/projects/${projectId}/collaborators`,
            {
                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${TODOIST.token}`,

                    "Accept":
                        "application/json"

                }

            }
        );


    const data =
        await todoistResponse.json();


    if (
        !todoistResponse.ok
    ) {

        throw new Error(
            `Todoist collaborators API returned ${todoistResponse.status}: ${JSON.stringify(data)}`
        );

    }


    return data.results || [];

}


// ============================================================
// ASSIGNEE LOOKUP
// ============================================================

function getAssigneeName(
    taskItem,
    collaboratorLookup
) {

    const assigneeId =
        taskItem.responsible_uid;


    if (!assigneeId) {

        return null;

    }


    const collaborator =
        collaboratorLookup.get(
            String(assigneeId)
        );


    if (!collaborator) {

        return null;

    }


    return (
        collaborator.name ||
        collaborator.full_name ||
        collaborator.email ||
        null
    );

}


// ============================================================
// NORMALIZE TASK
// ============================================================

function normalizeTask(
    task,
    taskItem,
    collaboratorLookup
) {

    return {

        id:
            task.id,

        content:
            task.content,

        description:
            task.description || "",

        checked:
            Boolean(
                task.checked
            ),

        dueDate:
            task.due?.date || null,

        dueString:
            task.due?.string || null,

        isRecurring:
            Boolean(
                task.due?.is_recurring
            ),

        assignee:
            getAssigneeName(
                taskItem,
                collaboratorLookup
            )

    };

}


// ============================================================
// GET TODOIST TASKS
// ============================================================

async function getTodoistTasks(
    filterOverride = null
) {

    let query;


    if (filterOverride) {

        query =
            filterOverride;

    }

    else {

        const filter =
            await getTodoistFilter(
                TODOIST.filterName
            );


        query =
            filter.query;

    }


    const url =
        new URL(
            "https://api.todoist.com/api/v1/tasks/filter"
        );


    url.searchParams.set(
        "query",
        query
    );


    const todoistResponse =
        await fetch(
            url,
            {
                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${TODOIST.token}`,

                    "Accept":
                        "application/json"

                }

            }
        );


    const taskData =
        await todoistResponse.json();


    if (
        !todoistResponse.ok
    ) {

        throw new Error(
            `Todoist task API returned ${todoistResponse.status}: ${JSON.stringify(taskData)}`
        );

    }


    const syncData =
        await todoistSync(
            ["items"]
        );


    const items =
        syncData.items || [];


    const itemLookup =
        new Map();


    for (
        const item of items
    ) {

        if (item.id) {

            itemLookup.set(
                String(item.id),
                item
            );

        }

    }


    const projectIds =
        [
            ...new Set(
                (taskData.results || [])
                    .map(
                        task =>
                            task.project_id
                    )
                    .filter(
                        Boolean
                    )
            )
        ];


    const collaboratorLookup =
        new Map();


    for (
        const projectId of projectIds
    ) {

        const collaborators =
            await getTodoistCollaborators(
                projectId
            );


        for (
            const collaborator of collaborators
        ) {

            if (
                collaborator.id
            ) {

                collaboratorLookup.set(
                    String(
                        collaborator.id
                    ),
                    collaborator
                );

            }

        }

    }


    const tasks =
        (taskData.results || [])
            .map(
                task => {

                    const taskItem =
                        itemLookup.get(
                            String(task.id)
                        );


                    return normalizeTask(
                        task,
                        taskItem || {},
                        collaboratorLookup
                    );

                }
            );


    return {

        results:
            tasks,

        next_cursor:
            taskData.next_cursor || null

    };

}


// ============================================================
// COMPLETE TODOIST TASK
// ============================================================

async function completeTodoistTask(
    taskId
) {

    if (!taskId) {

        throw new Error(
            "Task ID is required."
        );

    }


    const todoistResponse =
        await fetch(
            `https://api.todoist.com/api/v1/tasks/${encodeURIComponent(taskId)}/close`,
            {
                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${TODOIST.token}`,

                    "Accept":
                        "application/json"

                }

            }
        );


    if (
        !todoistResponse.ok
    ) {

        const body =
            await todoistResponse.text();


        throw new Error(
            `Todoist complete task API returned ${todoistResponse.status}: ${body}`
        );

    }


    return {

        success:
            true,

        taskId:
            taskId

    };

}


// ============================================================
// STATIC FILE SERVER
// ============================================================

function serveStaticFile(
    requestUrl,
    response
) {

    let requestedPath =
        decodeURIComponent(
            requestUrl.pathname
        );


    if (
        requestedPath === "/" ||
        requestedPath === ""
    ) {

        requestedPath =
            "/index.html";

    }


    const filePath =
        path.resolve(
            ROOT_DIR,
            "." + requestedPath
        );


    if (
        !filePath.startsWith(
            ROOT_DIR + path.sep
        )
    ) {

        response.writeHead(
            403,
            {
                "Content-Type":
                    "text/plain"
            }
        );


        response.end(
            "Forbidden"
        );


        return true;

    }


    if (
        !fs.existsSync(
            filePath
        ) ||
        !fs.statSync(
            filePath
        ).isFile()
    ) {

        return false;

    }


    const extension =
        path.extname(
            filePath
        ).toLowerCase();


    const contentTypes = {

        ".html":
            "text/html; charset=utf-8",

        ".js":
            "application/javascript; charset=utf-8",

        ".css":
            "text/css; charset=utf-8",

        ".json":
            "application/json; charset=utf-8",

        ".png":
            "image/png",

        ".jpg":
            "image/jpeg",

        ".jpeg":
            "image/jpeg",

        ".svg":
            "image/svg+xml",

        ".ico":
            "image/x-icon"

    };


    response.writeHead(
        200,
        {
            "Content-Type":
                contentTypes[extension] ||
                "application/octet-stream"
        }
    );


    response.end(
        fs.readFileSync(
            filePath
        )
    );


    return true;

}


// ============================================================
// MLB TEAM ABBREVIATIONS
// ============================================================
//
// MLB team IDs are converted server-side so the browser can
// continue using simple abbreviations such as BOS/STL.
//
// ============================================================

const TEAM_ABBR = {

    108: "LAA",
    109: "ARI",
    110: "BAL",
    111: "BOS",
    112: "CHC",
    113: "CIN",
    114: "CLE",
    115: "COL",
    116: "DET",
    117: "HOU",
    118: "KC",
    119: "LAD",
    120: "WSH",
    133: "ATH",
    134: "PIT",
    135: "SD",
    136: "SEA",
    137: "SF",
    138: "STL",
    139: "TB",
    140: "TEX",
    141: "TOR",
    142: "MIN",
    143: "PHI",
    144: "ATL",
    145: "CWS",
    146: "MIA",
    147: "NYY",
    158: "MIL"

};


// ============================================================
// MLB TEAM ABBREVIATION HELPER
// ============================================================

function getTeamAbbreviation(
    team
) {

    if (
        !team
    ) {

        return "";

    }


    return (
        TEAM_ABBR[team.id] ||
        team.abbreviation ||
        team.teamName ||
        team.name ||
        ""
    )
        .toUpperCase();

}


// ============================================================
// MLB POSTSEASON TEAM CODE
// ============================================================
//
// Returns the short MLB abbreviation used by the dashboard.
//
// ============================================================

function getPostseasonTeamCode(
    team
) {

    if (
        !team
    ) {

        return "";

    }


    return getTeamAbbreviation({
        id:
            team.id,

        name:
            team.name
    }) ||
    (
        team.name ||
        ""
    )
        .toUpperCase();

}


// ============================================================
// MLB POSTSEASON SERIES STATUS
// ============================================================
//
// Determines the current state of the series containing a game.
//
// Examples:
//
//     BOS LEADS 2-1
//     BOS WINS 3-1
//     TIED 2-2
//
// ============================================================

function getSeriesStatusForGame(
    game,
    bracket,
    apiDate
) {

    if (
        !game ||
        !bracket
    ) {

        return "";

    }


    const gameType =
        game.gameType;


    const round =
        gameType === "F"
            ? bracket.wildCard
            : gameType === "D"
                ? bracket.divisionSeries
                : gameType === "L"
                    ? bracket.leagueChampionship
                    : gameType === "W"
                        ? bracket.worldSeries
                        : [];


    if (
        !round ||
        !round.length
    ) {

        return "";

    }


    const series =
        round.find(
            entry =>
                entry.games?.some(
                    seriesGame =>
                        seriesGame.gamePk ===
                        game.gamePk
                )
        );


    if (
        !series ||
        !series.teams ||
        series.teams.length !== 2
    ) {

        return "";

    }


    const teams =
        series.teams;


    const teamA =
        teams[0];


    const teamB =
        teams[1];


    if (
        !teamA ||
        !teamB
    ) {

        return "";

    }


    // --------------------------------------------------------
    // Calculate the series record AS OF THIS GAME.
    //
    // Do NOT use teamA.wins / teamB.wins because those may
    // represent the eventual completed series.
    //
    // Use seriesGameNumber so a future game cannot affect the
    // series status of an earlier game.
    // --------------------------------------------------------

    const currentSeriesGame =
        series.games?.find(
            seriesGame =>
                seriesGame.gamePk ===
                game.gamePk
        );


    if (
        !currentSeriesGame
    ) {

        return "";

    }


    const currentSeriesGameNumber =
        currentSeriesGame.seriesGameNumber;


    const completedGames =
        (series.games || [])
            .filter(
                seriesGame =>
                    seriesGame.seriesGameNumber <=
                    currentSeriesGameNumber
            )
            .filter(
                seriesGame =>
                    seriesGame.status?.abstractGameState ===
                    "Final"
            );


    let teamAWins = 0;
    let teamBWins = 0;


    completedGames.forEach(
        seriesGame => {

            const awayTeam =
                seriesGame.teams?.away;


            const homeTeam =
                seriesGame.teams?.home;


            if (
                awayTeam?.isWinner
            ) {

                if (
                    awayTeam.team?.id ===
                    teamA.id
                ) {

                    teamAWins++;

                }
                else if (
                    awayTeam.team?.id ===
                    teamB.id
                ) {

                    teamBWins++;

                }

            }


            if (
                homeTeam?.isWinner
            ) {

                if (
                    homeTeam.team?.id ===
                    teamA.id
                ) {

                    teamAWins++;

                }
                else if (
                    homeTeam.team?.id ===
                    teamB.id
                ) {

                    teamBWins++;

                }

            }

        }
    );


    // --------------------------------------------------------
    // No completed games yet.
    // --------------------------------------------------------

    if (
        teamAWins === 0 &&
        teamBWins === 0
    ) {

        return "";

    }


    // --------------------------------------------------------
    // Series tied.
    // --------------------------------------------------------

    if (
        teamAWins ===
        teamBWins
    ) {

        return (
            `TIED ${teamAWins}-${teamBWins}`
        );

    }


    const leader =
        teamAWins >
        teamBWins
            ? teamA
            : teamB;


    const trailing =
        teamAWins >
        teamBWins
            ? teamB
            : teamA;


    const leaderWins =
        Math.max(
            teamAWins,
            teamBWins
        );


    const trailingWins =
        Math.min(
            teamAWins,
            teamBWins
        );


    // --------------------------------------------------------
    // Determine whether the series is complete.
    //
    // Wild Card: best of 3  -> 2 wins
    // Division:  best of 5  -> 3 wins
    // LCS:       best of 7  -> 4 wins
    // World:     best of 7  -> 4 wins
    // --------------------------------------------------------

    const seriesComplete =
        leaderWins >=
        (
            gameType === "F"
                ? 2
                : gameType === "D"
                    ? 3
                    : 4
        );


    const leaderName =
        getPostseasonTeamCode(
            leader
        );


    if (
        seriesComplete
    ) {

        return (
            `${leaderName} WINS ` +
            `${leaderWins}-${trailingWins}`
        );

    }


    return (
        `${leaderName} LEADS ` +
        `${leaderWins}-${trailingWins}`
    );

}


// ============================================================
// HTTP SERVER
// ============================================================

const server =
    http.createServer(
        async (
            request,
            response
        ) => {

            response.setHeader(
                "Access-Control-Allow-Origin",
                "*"
            );


            response.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, DELETE, OPTIONS"
            );


            response.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization"
            );


            if (
                request.method ===
                "OPTIONS"
            ) {

                response.writeHead(
                    204
                );

                response.end();

                return;

            }


            const requestUrl =
                new URL(
                    request.url,
                    `http://${HOST}:${PORT}`
                );


            // =============================================================
            // MLB SCOREBOARD
            // =============================================================

            if (
                requestUrl.pathname ===
                    "/api/sports/mlb/scoreboard"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    // -----------------------------------------------------
                    // Determine MLB date.
                    //
                    // Production:
                    //     yesterday
                    //
                    // Testing:
                    //     ?date=YYYY-MM-DD
                    // -----------------------------------------------------

                    const apiDate =
                        requestUrl.searchParams.get("date") ||
                        getYesterday();


                    if (
                        !/^\d{4}-\d{2}-\d{2}$/.test(
                            apiDate
                        )
                    ) {

                        return sendJson(
                            response,
                            400,
                            {
                                error:
                                    "Invalid date. Expected YYYY-MM-DD."
                            }
                        );

                    }


                    // -----------------------------------------------------
                    // Load games.
                    // -----------------------------------------------------

                    const games =
                        await getSchedule(
                            apiDate
                        );


                    // -----------------------------------------------------
                    // Determine whether the date contains postseason games
                    //
                    // Postseason does not use favorite teams.
                    // Each postseason game becomes a featured card.
                    // -----------------------------------------------------

                    const postseasonGames =
                        games.filter(
                            game =>
                                ["F", "D", "L", "W"].includes(
                                    game.gameType
                                )
                        );

                    if (
                        postseasonGames.length > 0
                    ) {

                        // -------------------------------------------------
                        // Load the postseason bracket so that each game
                        // can receive current series status.
                        // -------------------------------------------------

                        const season =
                            Number(
                                apiDate.slice(
                                    0,
                                    4
                                )
                            );


                        let bracket =
                            null;


                        try {

                            const postseasonData =
                                await getPostseasonSeries(
                                    season
                                );

                            const postseasonSeeds =
                                await getPostseasonSeeds(
                                    season
                                );

                                bracket =
                                normalizePostseasonBracket(
                                    postseasonData,
                                    postseasonSeeds
                                );

                        }

                        catch (
                            bracketError
                        ) {

                            console.error(
                                "MLB postseason bracket error:",
                                bracketError
                            );

                        }


                        const postseasonFeatured =
                            [];


                        for (
                            const game of postseasonGames.slice(
                                0,
                                4
                            )
                        ) {

                            const feed =
                                await getGameFeed(
                                    game.gamePk
                                );


                            const decisions =
                                feed.liveData?.decisions;


                            const pitcherRecords =
                                {};


                            if (
                                decisions?.winner?.id
                            ) {

                                pitcherRecords[
                                    decisions.winner.id
                                ] =
                                    await getPitcherRecord(
                                        decisions.winner.id,
                                        season
                                    );

                            }


                            if (
                                decisions?.loser?.id
                            ) {

                                pitcherRecords[
                                    decisions.loser.id
                                ] =
                                    await getPitcherRecord(
                                        decisions.loser.id,
                                        season
                                    );

                            }


                            if (
                                decisions?.save?.id
                            ) {

                                pitcherRecords[
                                    decisions.save.id
                                ] =
                                    await getPitcherRecord(
                                        decisions.save.id,
                                        season
                                    );

                            }


                            postseasonFeatured.push({

                                game,

                                feed,

                                pitcherRecords,

                                seriesStatus:
                                    getSeriesStatusForGame(
                                        game,
                                        bracket,
                                        apiDate
                                    )

                            });

                        }


                        return sendJson(
                            response,
                            200,
                            {

                                date:
                                    apiDate,

                                games,

                                postseason:
                                    true,

                                postseasonGames:
                                    postseasonFeatured

                            }
                        );

                    }


                    // -----------------------------------------------------
                    // Read configured favorite teams.
                    //
                    // Example:
                    //
                    //     primaryTeam=BOS
                    //     secondaryTeam=STL
                    //
                    // -----------------------------------------------------

                    const primaryTeam =
                        (
                            requestUrl.searchParams.get(
                                "primaryTeam"
                            ) ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    const secondaryTeam =
                        (
                            requestUrl.searchParams.get(
                                "secondaryTeam"
                            ) ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    // -----------------------------------------------------
                    // Find the game containing a configured team.
                    // -----------------------------------------------------

                    function findTeamGame(
                        teamCode
                    ) {

                        if (
                            !teamCode
                        ) {

                            return null;

                        }


                        return (
                            games.find(
                                game => {

                                    const awayCode =
                                        getTeamAbbreviation(
                                            game.teams?.away?.team
                                        );


                                    const homeCode =
                                        getTeamAbbreviation(
                                            game.teams?.home?.team
                                        );


                                    return (
                                        awayCode ===
                                            teamCode ||
                                        homeCode ===
                                            teamCode
                                    );

                                }
                            ) ||
                            null
                        );

                    }


                    // -----------------------------------------------------
                    // Build featured game data.
                    // -----------------------------------------------------

                    async function buildFeaturedGame(
                        teamCode
                    ) {

                        if (
                            !teamCode
                        ) {

                            return null;

                        }


                        const game =
                            findTeamGame(
                                teamCode
                            );


                        if (
                            !game
                        ) {

                            return null;

                        }


                        const feed =
                            await getGameFeed(
                                game.gamePk
                            );


                        const decisions =
                            feed.liveData?.decisions;


                        const season =
                            Number(
                                apiDate.slice(
                                    0,
                                    4
                                )
                            );


                        const pitcherRecords =
                            {};


                        if (
                            decisions?.winner?.id
                        ) {

                            pitcherRecords[
                                decisions.winner.id
                            ] =
                                await getPitcherRecord(
                                    decisions.winner.id,
                                    season
                                );

                        }


                        if (
                            decisions?.loser?.id
                        ) {

                            pitcherRecords[
                                decisions.loser.id
                            ] =
                                await getPitcherRecord(
                                    decisions.loser.id,
                                    season
                                );

                        }


                        if (
                            decisions?.save?.id
                        ) {

                            pitcherRecords[
                                decisions.save.id
                            ] =
                                await getPitcherRecord(
                                    decisions.save.id,
                                    season
                                );

                        }


                        return {

                            game,

                            feed,

                            pitcherRecords

                        };

                    }


                    // -----------------------------------------------------
                    // Resolve both configured favorites.
                    //
                    // IMPORTANT:
                    //
                    // These names are expected by mlb-scoreboard.js:
                    //
                    //     featured.primary
                    //     featured.secondary
                    // -----------------------------------------------------

                    const featured = {

                        primary:
                            await buildFeaturedGame(
                                primaryTeam
                            ),

                        secondary:
                            await buildFeaturedGame(
                                secondaryTeam
                            )

                    };


                    return sendJson(
                        response,
                        200,
                        {

                            date:
                                apiDate,

                            games,

                            featured

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "MLB scoreboard error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }

            // =================================================
            // MLB POSTSEASON
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/sports/mlb/postseason"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const apiDate =
                        requestUrl.searchParams.get("date") ||
                        getYesterday();


                    if (
                        !/^\d{4}-\d{2}-\d{2}$/.test(
                            apiDate
                        )
                    ) {

                        return sendJson(
                            response,
                            400,
                            {
                                error:
                                    "Invalid date. Expected YYYY-MM-DD."
                            }
                        );

                    }

                    const season =
                        Number(
                            requestUrl.searchParams.get(
                                "season"
                            )
                        ) ||
                        Number(
                            apiDate.slice(
                                0,
                                4
                            )
                        );


                    // -------------------------------------------------
                    // Postseason bracket
                    // -------------------------------------------------

                    const postseasonData =
                        await getPostseasonSeries(
                            season
                        );

                    const postseasonSeeds =
                        await getPostseasonSeeds(
                            season
                        );

                    const bracket =
                        filterPostseasonBracketByDate(
                            normalizePostseasonBracket(
                                postseasonData,
                                postseasonSeeds
                            ),
                            apiDate,
                            postseasonSeeds
                        );

                    // -------------------------------------------------
                    // Postseason games for requested date
                    // -------------------------------------------------

                    const games =
                        await getPostseasonGames(
                            season,
                            apiDate
                        );


                    const gameFeeds =
                        [];


                    for (
                        const game of games
                    ) {

                        const feed =
                            await getGameFeed(
                                game.gamePk
                            );


                        gameFeeds.push({

                            game,

                            feed,

                            seriesStatus:
                                getSeriesStatusForGame(
                                    game,
                                    bracket
                                )

                        });

                    }


                    // -------------------------------------------------
                    // Response
                    // -------------------------------------------------

                    return sendJson(
                        response,
                        200,
                        {

                            season,

                            date:
                                apiDate,

                            games:
                                gameFeeds,

                            bracket

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "MLB postseason error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }

            // =================================================
            // NFL SCOREBOARD
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/sports/nfl/scoreboard"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const featured = {

                        left: {

                            team:
                                requestUrl
                                    .searchParams
                                    .get(
                                        "leftTeam"
                                    )

                        },

                        right: {

                            team:
                                requestUrl
                                    .searchParams
                                    .get(
                                        "rightTeam"
                                    )

                        }

                    };


                    const scoreboard =
                        await getNFLScoreboard(
                            {
                                featured
                            }
                        );


                    return sendJson(
                        response,
                        200,
                        scoreboard
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "NFL scoreboard error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // NFL STANDINGS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/sports/nfl/standings"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const data =
                        await getNFLStandings();


                    const standings =
                        normalizeStandings(
                            data
                        );


                    return sendJson(
                        response,
                        200,
                        {

                            season:
                                new Date().getFullYear(),

                            standings

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "NFL standings error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // SCHOOL LUNCH
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/school-lunch"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const weekStart =
                        requestUrl
                            .searchParams
                            .get(
                                "weekStart"
                            );


                    const monday =
                        weekStart
                            ? new Date(
                                `${weekStart}T00:00:00`
                            )
                            : new Date();


                    const data =
                        await schoolLunchData
                            .getWeeklyMenu(
                                monday
                            );


                    return sendJson(
                        response,
                        200,
                        data
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "School lunch error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // COMMUTE
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/commute"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const commute =
                        await getCommute();


                    return sendJson(
                        response,
                        200,
                        commute
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Commute error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // HEALTH CHECK
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/health"
            ) {

                return sendJson(
                    response,
                    200,
                    {

                        status:
                            "ok"

                    }
                );

            }


            // =================================================
            // ICLOUD PHOTOS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/photos"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const albumUrl =
                        requestUrl
                            .searchParams
                            .get(
                                "albumUrl"
                            ) ||
                        undefined;


                    const photoCount =
                        Number(
                            requestUrl
                                .searchParams
                                .get(
                                    "photoCount"
                                )
                        ) ||
                        undefined;


                    const photos =
                        await icloudPhotoData.getPhotos(
                            albumUrl,
                            photoCount
                        );


                    return sendJson(
                        response,
                        200,
                        {

                            photos

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "iCloud photo API error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                "Unable to load photos"

                        }
                    );

                }

            }


            // =================================================
            // SONOS STATUS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/sonos"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const speaker =
                        requestUrl
                            .searchParams
                            .get(
                                "speaker"
                            );


                    if (
                        !speaker
                    ) {

                        throw new Error(
                            "speaker is required."
                        );

                    }


                    const status =
                        await getStatus(
                            speaker
                        );


                    return sendJson(
                        response,
                        200,
                        status
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Sonos status error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // GOOGLE CALENDAR OAUTH
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/google-calendar/auth"
                &&
                request.method ===
                    "GET"
            ) {

                const authUrl =
                    getGoogleCalendarAuthUrl();


                response.writeHead(
                    302,
                    {
                        Location:
                            authUrl
                    }
                );


                response.end();

                return;

            }


            // =================================================
            // GOOGLE CALENDAR OAUTH CALLBACK
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/google-calendar/callback"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const code =
                        requestUrl
                            .searchParams
                            .get(
                                "code"
                            );


                    const error =
                        requestUrl
                            .searchParams
                            .get(
                                "error"
                            );


                    if (
                        error
                    ) {

                        throw new Error(
                            `Google OAuth authorization failed: ${error}`
                        );

                    }


                    if (
                        !code
                    ) {

                        throw new Error(
                            "Google OAuth callback did not contain an authorization code."
                        );

                    }


                    await exchangeGoogleCode(
                        code
                    );


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "text/html; charset=utf-8"
                        }
                    );


                    response.end(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Google Calendar Authorized</title>
</head>
<body>
    <h1>Google Calendar authorized</h1>
    <p>You can close this window and return to the Family Dashboard.</p>
</body>
</html>
                    `);

                }

                catch (
                    error
                ) {

                    console.error(
                        "Google Calendar OAuth error:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "text/plain; charset=utf-8"
                        }
                    );


                    response.end(
                        `Google Calendar authorization failed:\n\n${error.message}`
                    );

                }


                return;

            }


            // =================================================
            // GOOGLE CALENDAR AUTHORIZATION STATUS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/google-calendar/status"
                &&
                request.method ===
                    "GET"
            ) {

                const status =
                    getGoogleCalendarAuthorizationStatus();


                return sendJson(
                    response,
                    200,
                    status
                );

            }


            // =================================================
            // GOOGLE CALENDARS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/google-calendar/calendars"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const calendars =
                        await getCalendars();


                    return sendJson(
                        response,
                        200,
                        calendars
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Google Calendar calendars error:",
                        error
                    );


                    if (
                        error.message ===
                        "Google Calendar authorization required. Reauthorize Google Calendar."
                    ) {

                        return sendJson(
                            response,
                            401,
                            {

                                error:
                                    "authorization_required",

                                message:
                                    "Google Calendar authorization is required. Please reauthorize Google Calendar."

                            }
                        );

                    }


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // GOOGLE CALENDAR EVENTS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/google-calendar/events"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const calendarId =
                        requestUrl
                            .searchParams
                            .get(
                                "calendarId"
                            );


                    const start =
                        requestUrl
                            .searchParams
                            .get(
                                "start"
                            );


                    const end =
                        requestUrl
                            .searchParams
                            .get(
                                "end"
                            );


                    if (
                        !calendarId ||
                        !start ||
                        !end
                    ) {

                        throw new Error(
                            "calendarId, start, and end are required."
                        );

                    }


                    const events =
                        await getEventsForRange(
                            calendarId,
                            new Date(start),
                            new Date(end)
                        );


                    return sendJson(
                        response,
                        200,
                        events
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Google Calendar events error:",
                        error
                    );


                    if (
                        error.message ===
                        "Google Calendar authorization required. Reauthorize Google Calendar."
                    ) {

                        return sendJson(
                            response,
                            401,
                            {

                                error:
                                    "authorization_required",

                                message:
                                    "Google Calendar authorization is required. Please reauthorize Google Calendar."

                            }
                        );

                    }


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // TODOIST TASKS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/todoist/tasks"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const filter =
                        requestUrl
                            .searchParams
                            .get(
                                "filter"
                            );


                    const data =
                        await getTodoistTasks(
                            filter
                        );


                    return sendJson(
                        response,
                        200,
                        data
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Todoist error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // COMPLETE TODOIST TASK
            // =================================================

            if (
                requestUrl.pathname.startsWith(
                    "/api/todoist/tasks/"
                )
                &&
                requestUrl.pathname.endsWith(
                    "/complete"
                )
                &&
                request.method ===
                    "POST"
            ) {

                try {

                    const pathParts =
                        requestUrl
                            .pathname
                            .split("/");


                    const taskId =
                        pathParts[4];


                    const result =
                        await completeTodoistTask(
                            taskId
                        );


                    return sendJson(
                        response,
                        200,
                        result
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Todoist complete task error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // ============================================================
            // PERFORMANCE DATA
            // ============================================================

            if (
                requestUrl.pathname ===
                    "/api/performance"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const limit =
                        requestUrl
                            .searchParams
                            .get(
                                "limit"
                            );


                    const performanceEvents =
                        getPerformanceEvents(
                            limit
                        );


                    return sendJson(
                        response,
                        200,
                        {

                            count:
                                performanceEvents.length,

                            events:
                                performanceEvents

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Performance data request failed:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // ============================================================
            // RECORD PERFORMANCE DATA
            // ============================================================

            if (
                requestUrl.pathname ===
                    "/api/performance"
                &&
                request.method ===
                    "POST"
            ) {

                try {

                    let body =
                        "";


                    for await (
                        const chunk of
                        request
                    ) {

                        body +=
                            chunk.toString();

                    }


                    const parsed =
                        JSON.parse(
                            body
                        );


                    const incomingEvents =
                        parsed.events;


                    if (
                        !Array.isArray(
                            incomingEvents
                        )
                    ) {

                        throw new Error(
                            "Request must contain an events array."
                        );

                    }


                    const count =
                        recordPerformanceEvents(
                            incomingEvents
                        );


                    return sendJson(
                        response,
                        200,
                        {

                            success:
                                true,

                            totalEvents:
                                count

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Performance data recording failed:",
                        error
                    );


                    return sendJson(
                        response,
                        400,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // ============================================================
            // CLEAR PERFORMANCE DATA
            // ============================================================

            if (
                requestUrl.pathname ===
                    "/api/performance"
                &&
                request.method ===
                    "DELETE"
            ) {

                try {

                    clearPerformanceEvents();


                    return sendJson(
                        response,
                        200,
                        {

                            success:
                                true

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "Performance data clear failed:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // RSS FEED
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/rss"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const feedUrl =
                        requestUrl
                            .searchParams
                            .get(
                                "url"
                            );


                    if (
                        !feedUrl
                    ) {

                        throw new Error(
                            "RSS feed URL is required."
                        );

                    }


                    const stories =
                        await rssData.getFeed(
                            feedUrl
                        );


                    return sendJson(
                        response,
                        200,
                        {

                            stories

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "RSS API error:",
                        error
                    );


                    return sendJson(
                        response,
                        500,
                        {

                            error:
                                error.message

                        }
                    );

                }

            }


            // =================================================
            // STATIC DASHBOARD FILES
            // =================================================

            if (
                request.method ===
                "GET"
            ) {

                const served =
                    serveStaticFile(
                        requestUrl,
                        response
                    );


                if (
                    served
                ) {

                    return;

                }

            }


            // =================================================
            // 404
            // =================================================

            return sendJson(
                response,
                404,
                {

                    error:
                        "Not found"

                }
            );

        }
    );


// ============================================================
// START SERVER
// ============================================================

server.listen(
    PORT,
    HOST,
    () => {

        console.log(
            `Dashboard server running at http://${HOST}:${PORT}`
        );

    }
);