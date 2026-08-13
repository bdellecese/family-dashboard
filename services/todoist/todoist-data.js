/*
 * ============================================================
 * TODOIST DATA SERVICE
 * ============================================================
 *
 * Provides Todoist data to the dashboard.
 *
 * Responsibilities:
 *
 *   - Load household chores from the dashboard server
 *   - Complete tasks through the dashboard server
 *
 * The widget should not make Todoist API calls directly.
 *
 * ============================================================
 */


const todoistData = {

    /*
     * ========================================================
     * GET HOUSEHOLD CHORES
     * ========================================================
     */

    async getHouseholdChores() {

        const response =
            await fetch(
                "/api/todoist/tasks"
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `Todoist server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        return (
            data.results ||
            []
        );

    },


    /*
     * ========================================================
     * COMPLETE TASK
     * ========================================================
     */

    async completeTask(
        taskId
    ) {

        if (
            !taskId
        ) {

            throw new Error(
                "Todoist task ID is required."
            );

        }


        const response =
            await fetch(
                `/api/todoist/tasks/${encodeURIComponent(taskId)}/complete`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        if (
            !response.ok
        ) {

            const data =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                data.error ||
                `Todoist server returned ${response.status}`
            );

        }


        return (
            await response.json()
        );

    }

};


export default todoistData;