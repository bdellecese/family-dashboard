// ============================================================
// FAMILY DASHBOARD SERVER
// ============================================================

import http from "http";
import { URL } from "url";

import { TODOIST } from "../config/todoist.js";

import {
    getGoogleCalendarAuthUrl,
    exchangeGoogleCode,
    getCalendars,
    getEventsForRange
} from "../services/google-calendar/google-calendar-server.js";

const HOST = "0.0.0.0";

const PORT = 3000;


// ============================================================
// TODOIST HELPERS
// ============================================================

async function todoistSync(resourceTypes) {

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

                body: new URLSearchParams({
                    sync_token: "*",

                    resource_types:
                        JSON.stringify(resourceTypes)
                })
            }
        );


    const data =
        await todoistResponse.json();


    if (!todoistResponse.ok) {

        throw new Error(
            `Todoist Sync API returned ${todoistResponse.status}: ${JSON.stringify(data)}`
        );
    }


    return data;
}


// ============================================================
// TODOIST FILTER
// ============================================================

async function getTodoistFilter(filterName) {

    const data =
        await todoistSync(["filters"]);


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

async function getTodoistCollaborators(projectId) {

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


    if (!todoistResponse.ok) {

        throw new Error(
            `Todoist collaborators API returned ${todoistResponse.status}: ${JSON.stringify(data)}`
        );
    }


    return data.results || [];
}


// ============================================================
// COLLABORATOR LOOKUP
// ============================================================

function buildCollaboratorLookup(
    collaborators
) {

    const lookup =
        new Map();


    for (
        const collaborator of collaborators
    ) {

        if (
            collaborator.id
        ) {

            lookup.set(
                String(collaborator.id),
                collaborator
            );
        }
    }


    return lookup;
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
            Boolean(task.checked),

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


    // --------------------------------------------------------
    // GET FILTER QUERY
    // --------------------------------------------------------

    if (
        filterOverride
    ) {

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


        console.log(
            `Todoist filter: ${filter.name}`
        );


        console.log(
            `Todoist query: ${filter.query}`
        );
    }


    // --------------------------------------------------------
    // GET FILTERED TASKS
    // --------------------------------------------------------

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


    if (!todoistResponse.ok) {

        throw new Error(
            `Todoist task API returned ${todoistResponse.status}: ${JSON.stringify(taskData)}`
        );
    }


    // --------------------------------------------------------
    // GET RAW TODOIST ITEMS
    //
    // The Sync API contains responsible_uid.
    // --------------------------------------------------------

    const syncData =
        await todoistSync(["items"]);


    const items =
        syncData.items || [];


    // --------------------------------------------------------
    // BUILD ITEM LOOKUP
    // --------------------------------------------------------

    const itemLookup =
        new Map();


    for (
        const item of items
    ) {

        if (
            item.id
        ) {

            itemLookup.set(
                String(item.id),
                item
            );
        }
    }


    // --------------------------------------------------------
    // GET PROJECT COLLABORATORS
    //
    // The project ID comes from the filtered task.
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // NORMALIZE TASKS
    // --------------------------------------------------------

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


    if (!todoistResponse.ok) {

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
// HTTP SERVER
// ============================================================

const server =
    http.createServer(
        async (
            request,
            response
        ) => {

            // ------------------------------------------------
            // CORS
            // ------------------------------------------------

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


            // ------------------------------------------------
            // CORS PREFLIGHT
            // ------------------------------------------------

            if (
                request.method ===
                "OPTIONS"
            ) {

                response.writeHead(204);
                response.end();

                return;
            }


            // ------------------------------------------------
            // PARSE URL
            // ------------------------------------------------

            const requestUrl =
                new URL(
                    request.url,
                    `http://${HOST}:${PORT}`
                );


            // ------------------------------------------------
            // HEALTH CHECK
            // ------------------------------------------------

            if (
                requestUrl.pathname ===
                "/"
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
                        status: "ok"
                    })
                );


                return;
            }


            // ------------------------------------------------
            // GOOGLE CALENDAR OAUTH
            // ------------------------------------------------

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


            // ------------------------------------------------
            // GOOGLE CALENDAR OAUTH CALLBACK
            // ------------------------------------------------

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
                            .get("code");

                    const error =
                        requestUrl
                            .searchParams
                            .get("error");


                    if (error) {

                        throw new Error(
                            `Google OAuth authorization failed: ${error}`
                        );

                    }


                    if (!code) {

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


            // ------------------------------------------------
            // TODOIST TASKS
            // ------------------------------------------------

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
                            .get("filter");


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
                        JSON.stringify(data)
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


            // ------------------------------------------------
            // COMPLETE TODOIST TASK
            // ------------------------------------------------

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
                        JSON.stringify(result)
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


            // ------------------------------------------------
            // 404
            // ------------------------------------------------

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