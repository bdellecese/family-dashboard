/*
 * ============================================================
 * TODOIST SERVER
 * ============================================================
 *
 * Server-side Todoist API access.
 *
 * Keeps the Todoist API token off the browser.
 *
 * Supports:
 *
 * - Get tasks using a Todoist filter
 * - Complete a task
 * - Reopen a task
 *
 * The filter is supplied by the caller so this service can
 * support multiple Todoist widgets.
 * ============================================================
 */

const TODOIST_API_URL =
    "https://api.todoist.com/api/v1";


/*
 * ============================================================
 * TODOIST API TOKEN
 * ============================================================
 *
 * The token should be supplied through an environment variable.
 *
 * Example:
 *
 * TODOIST_API_TOKEN=your-token-here
 *
 * Do NOT put the actual token in this file.
 * ============================================================
 */

const TODOIST_API_TOKEN =
    process.env.TODOIST_API_TOKEN;


if (!TODOIST_API_TOKEN) {

    console.warn(
        "TODOIST_API_TOKEN is not configured."
    );

}


/*
 * ============================================================
 * API REQUEST
 * ============================================================
 */

async function todoistRequest(
    endpoint,
    options = {}
) {

    if (!TODOIST_API_TOKEN) {

        throw new Error(
            "TODOIST_API_TOKEN is not configured."
        );

    }


    const response =
        await fetch(
            `${TODOIST_API_URL}${endpoint}`,
            {

                ...options,

                headers: {

                    "Authorization":
                        `Bearer ${TODOIST_API_TOKEN}`,

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                }

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            `Todoist API request failed: ${response.status} ${errorText}`
        );

    }


    /*
     * Some successful requests may not
     * contain a response body.
     */

    if (
        response.status === 204
    ) {

        return null;

    }


    return response.json();

}


/*
 * ============================================================
 * GET TASKS BY FILTER
 * ============================================================
 *
 * Example filter:
 *
 * (#Finances | #Household | #Honey-do list)
 * & due before: next week
 *
 * The filter is intentionally supplied by the caller.
 *
 * This keeps the service reusable for other widgets.
 * ============================================================
 */

async function getTasksByFilter(
    filter
) {

    if (
        !filter ||
        typeof filter !== "string"
    ) {

        throw new Error(
            "A Todoist filter is required."
        );

    }


    const tasks = [];

    let cursor = null;


    /*
     * Todoist supports cursor-based pagination.
     */

    do {

        const params =
            new URLSearchParams();


        params.set(
            "query",
            filter
        );


        if (cursor) {

            params.set(
                "cursor",
                cursor
            );

        }


        const data =
            await todoistRequest(
                `/tasks/filter?${params.toString()}`
            );


        if (
            Array.isArray(
                data?.results
            )
        ) {

            tasks.push(
                ...data.results
            );

        }


        cursor =
            data?.next_cursor || null;


    } while (
        cursor
    );


    return tasks;

}


/*
 * ============================================================
 * COMPLETE TASK
 * ============================================================
 */

async function completeTask(
    taskId
) {

    if (
        !taskId
    ) {

        throw new Error(
            "A Todoist task ID is required."
        );

    }


    return todoistRequest(
        `/tasks/${encodeURIComponent(taskId)}/close`,
        {

            method:
                "POST"

        }
    );

}


/*
 * ============================================================
 * REOPEN TASK
 * ============================================================
 */

async function reopenTask(
    taskId
) {

    if (
        !taskId
    ) {

        throw new Error(
            "A Todoist task ID is required."
        );

    }


    return todoistRequest(
        `/tasks/${encodeURIComponent(taskId)}/reopen`,
        {

            method:
                "POST"

        }
    );

}


/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export {

    getTasksByFilter,

    completeTask,

    reopenTask

};