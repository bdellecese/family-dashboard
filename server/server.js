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
    getWildCardStandings
} from "../services/sports/mlb-data.js";

import {
    getPerformanceEvents,
    recordPerformanceEvents,
    clearPerformanceEvents
} from "../services/performance/performance-server.js";

import rssData
    from "../services/rss/rss-data.js";

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

// =================================================
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
                "GET, POST, OPTIONS"
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


            // =================================================
            // ON THIS DAY SPORTS
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/on-this-day-sports"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const month =
                        requestUrl
                            .searchParams
                            .get("month");

                    const day =
                        requestUrl
                            .searchParams
                            .get("day");


                    if (
                        !month ||
                        !day
                    ) {

                        response.writeHead(
                            400,
                            {
                                "Content-Type":
                                    "application/json"
                            }
                        );

                        response.end(
                            JSON.stringify({
                                error:
                                    "month and day are required"
                            })
                        );

                        return;

                    }


                    const sourceUrl =
                        `https://on-this-day.com/cgi-bin/otd/sportsotd.pl?month=${encodeURIComponent(month)}&day=${encodeURIComponent(day)}`;


                    const sportsResponse =
                        await fetch(
                            sourceUrl
                        );


                    if (
                        !sportsResponse.ok
                    ) {

                        throw new Error(
                            `On This Day sports request returned ${sportsResponse.status}`
                        );

                    }


                    const body =
                        await sportsResponse.text();


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "text/html; charset=utf-8",
                            "Access-Control-Allow-Origin":
                                "*"
                        }
                    );


                    response.end(
                        body
                    );

                }

                catch (error) {

                    console.error(
                        "On This Day sports request failed:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json",
                            "Access-Control-Allow-Origin":
                                "*"
                        }
                    );


                    response.end(
                        JSON.stringify({
                            error:
                                error.message
                        })
                    );

                }


                return;

            }


            // =================================================
            // MLB SCOREBOARD
            // =================================================
            if (
                requestUrl.pathname ===
                    "/api/sports/mlb/scoreboard"
                &&
                request.method ===
                    "GET"
            ) {
                try {
                    const apiDate =
                        getYesterday();

                    const games =
                        await getSchedule(
                            apiDate
                        );

                    const featured = {};

                    const configuredTeams = [
                        {
                            key: "left",
                            teamId:
                                Number(
                                    requestUrl.searchParams.get(
                                        "leftTeamId"
                                    )
                                )
                        },
                        {
                            key: "right",
                            teamId:
                                Number(
                                    requestUrl.searchParams.get(
                                        "rightTeamId"
                                    )
                                )
                        }
                    ];
                    for (
                        const item of configuredTeams
                    ) {
                        if (
                            !item.teamId
                        ) {
                            continue;
                        }

                        const game =
                            games.find(
                                game =>
                                    game.teams.home.team.id ===
                                        item.teamId
                                    ||
                                    game.teams.away.team.id ===
                                        item.teamId
                            );

                        if (
                            !game
                        ) {
                            featured[item.key] =
                                null;

                            continue;
                        }

                        const feed =
                            await getGameFeed(
                                game.gamePk
                            );

                        const decisions =
                            feed.liveData?.decisions;

                        const season =
                            new Date().getFullYear();

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

                        featured[item.key] = {
                            game,
                            feed,
                            pitcherRecords
                        };
                    }

                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json",
                            "Access-Control-Allow-Origin":
                                "*"
                        }
                    );

                    response.end(
                        JSON.stringify({
                            date:
                                apiDate,
                            games,
                            featured
                        })
                    );
                }
                catch (error) {
                    console.error(
                        "MLB scoreboard error:",
                        error
                    );

                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json",
                            "Access-Control-Allow-Origin":
                                "*"
                        }
                    );

                    response.end(
                        JSON.stringify({
                            error:
                                error.message
                        })
                    );
                }

                return;
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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify(
                            data
                        )
                    );

                }

                catch (error) {

                    console.error(
                        "School lunch error:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

            }


            // =================================================
            // HEALTH CHECK
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/health"
            ) {

                response.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json"
                    }
                );


                response.end(
                    JSON.stringify({

                        status:
                            "ok"

                    })
                );


                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            photos

                        })
                    );

                }

                catch (error) {

                    console.error(
                        "iCloud photo API error:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                "Unable to load photos"

                        })
                    );

                }


                return;

            }


            // =================================================
            // =================================================

            if (
                requestUrl.pathname ===
                    "/api/on-this-day-sports"
                &&
                request.method ===
                    "GET"
            ) {

                try {

                    const month =
                        requestUrl
                            .searchParams
                            .get("month");

                    const day =
                        requestUrl
                            .searchParams
                            .get("day");


                    if (
                        !month ||
                        !day
                    ) {

                        response.writeHead(
                            400,
                            {
                                "Content-Type":
                                    "application/json"
                            }
                        );


                        response.end(
                            JSON.stringify({

                                error:
                                    "month and day are required"

                            })
                        );


                        return;

                    }


                    const sourceUrl =
                        `https://on-this-day.com/cgi-bin/otd/sportsotd.pl?month=${encodeURIComponent(month)}&day=${encodeURIComponent(day)}`;


                    const sportsResponse =
                        await fetch(
                            sourceUrl
                        );


                    if (
                        !sportsResponse.ok
                    ) {

                        throw new Error(
                            `On This Day sports request returned ${sportsResponse.status}`
                        );

                    }


                    const body =
                        await sportsResponse.text();


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "text/html; charset=utf-8"
                        }
                    );


                    response.end(
                        body
                    );

                }

                catch (error) {

                    console.error(
                        "On This Day sports request failed:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify(
                            status
                        )
                    );

                }

                catch (error) {

                    console.error(
                        "Sonos status error:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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

                catch (error) {

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

                response.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json"
                    }
                );

                response.end(
                    JSON.stringify(
                        status
                    )
                );

                return;
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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify(
                            calendars
                        )
                    );

                }

                catch (error) {

                    console.error(
                        "Google Calendar calendars error:",
                        error
                    );

                    if (
                        error.message ===
                        "Google Calendar authorization required. Reauthorize Google Calendar."
                    ) {

                        response.writeHead(
                            401,
                            {
                                "Content-Type":
                                    "application/json"
                            }
                        );

                        response.end(
                            JSON.stringify({

                                error:
                                    "authorization_required",

                                message:
                                    "Google Calendar authorization is required. Please reauthorize Google Calendar."

                            })
                        );

                        return;

                    }

                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );

                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }

                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify(
                            events
                        )
                    );

                }

                catch (error) {

                    console.error(
                        "Google Calendar events error:",
                        error
                    );

                    if (
                        error.message ===
                        "Google Calendar authorization required. Reauthorize Google Calendar."
                    ) {

                        response.writeHead(
                            401,
                            {
                                "Content-Type":
                                    "application/json"
                            }
                        );

                        response.end(
                            JSON.stringify({

                                error:
                                    "authorization_required",

                                message:
                                    "Google Calendar authorization is required. Please reauthorize Google Calendar."

                            })
                        );

                        return;

                    }

                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );

                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }

                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify(
                            data
                        )
                    );

                }

                catch (error) {

                    console.error(
                        "Todoist error:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify(
                            result
                        )
                    );

                }

                catch (error) {

                    console.error(
                        "Todoist complete task error:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            count:
                                performanceEvents.length,

                            events:
                                performanceEvents

                        })
                    );

                }

                catch (error) {

                    console.error(
                        "Performance data request failed:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            success:
                                true,

                            totalEvents:
                                count

                        })
                    );

                }

                catch (error) {

                    console.error(
                        "Performance data recording failed:",
                        error
                    );


                    response.writeHead(
                        400,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            success:
                                true

                        })
                    );

                }

                catch (error) {

                    console.error(
                        "Performance data clear failed:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            stories

                        })
                    );

                }

                catch (error) {

                    console.error(
                        "RSS API error:",
                        error
                    );


                    response.writeHead(
                        500,
                        {
                            "Content-Type":
                                "application/json"
                        }
                    );


                    response.end(
                        JSON.stringify({

                            error:
                                error.message

                        })
                    );

                }


                return;

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

            response.writeHead(
                404,
                {
                    "Content-Type":
                        "application/json"
                }
            );


            response.end(
                JSON.stringify({

                    error:
                        "Not found"

                })
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