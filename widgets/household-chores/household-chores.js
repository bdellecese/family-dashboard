/*
 * ============================================================
 * HOUSEHOLD CHORES
 * ============================================================
 *
 * Displays household chores from Todoist.
 *
 * Features:
 *
 *  - Sorted by due date
 *  - Tasks without due dates appear last
 *  - Friendly due-date display
 *  - "Today" and "Tomorrow" labels
 *  - Day-of-week labels for upcoming tasks
 *  - "Overdue" for past-due tasks
 *  - "No due date" for undated tasks
 *  - Recurring indicator inside due-date pill
 *  - Displays assignee when available
 *  - Interactive completion checkbox
 *  - Vertical scrolling for long task lists
 *  - Automatically refreshes every 5 minutes
 *
 * ============================================================
 */

import todoistData
    from "../../services/todoist/todoist-data.js";


const householdChores = {

    name:
        "household-chores",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML =
            "";


        /*
         * ====================================================
         * WIDGET
         * ====================================================
         */

        const widget =
            document.createElement("div");

        widget.className =
            "household-chores-widget";


        /*
         * ====================================================
         * HEADER
         * ====================================================
         */

        const header =
            document.createElement("div");

        header.className =
            "household-chores-widget__header";


        const title =
            document.createElement("div");

        title.className =
            "household-chores-widget__title";

        title.textContent =
            "Household Chores";


        header.appendChild(
            title
        );

        widget.appendChild(
            header
        );


        /*
         * ====================================================
         * TASK LIST
         * ====================================================
         */

        const list =
            document.createElement("div");

        list.className =
            "household-chores-widget__list";

        widget.appendChild(
            list
        );


        /*
         * ====================================================
         * RENDER TASKS
         * ====================================================
         */

        async function renderTasks() {

            let tasks = [];


            try {

                tasks =
                    await todoistData
                        .getHouseholdChores();

            }

            catch (error) {

                console.error(
                    "Failed to load household chores:",
                    error
                );

                return;

            }


            /*
             * =================================================
             * SORT TASKS
             *
             * Tasks with due dates are sorted chronologically.
             * Tasks without due dates appear at the bottom.
             * =================================================
             */

            tasks.sort(
                (a, b) => {

                    if (
                        !a.dueDate &&
                        !b.dueDate
                    ) {

                        return 0;

                    }


                    if (
                        !a.dueDate
                    ) {

                        return 1;

                    }


                    if (
                        !b.dueDate
                    ) {

                        return -1;

                    }


                    return (
                        new Date(a.dueDate) -
                        new Date(b.dueDate)
                    );

                }
            );


            /*
             * =================================================
             * CLEAR THE EXISTING TASK LIST
             * =================================================
             */

            list.innerHTML =
                "";


            /*
             * =================================================
             * EMPTY STATE
             * =================================================
             */

            if (
                tasks.length === 0
            ) {

                const empty =
                    document.createElement("div");

                empty.className =
                    "household-chores-widget__empty";

                empty.textContent =
                    "No household chores.";

                list.appendChild(
                    empty
                );

                return;

            }


            /*
             * =================================================
             * TASKS
             * =================================================
             */

            tasks.forEach(
                task => {

                    list.appendChild(
                        createTask(
                            task
                        )
                    );

                }
            );

        }


        /*
         * ====================================================
         * INITIAL LOAD
         * ====================================================
         */

        await renderTasks();


        /*
         * ====================================================
         * FIVE-MINUTE REFRESH
         *
         * Store the interval on the container so that the
         * screen manager can properly clear it when the
         * widget is destroyed.
         * ====================================================
         */

        if (
            container._householdChoresRefreshInterval
        ) {

            clearInterval(
                container._householdChoresRefreshInterval
            );

        }


        container._householdChoresRefreshInterval =
            setInterval(
                renderTasks,
                5 * 60 * 1000
            );


        /*
         * ====================================================
         * ADD WIDGET
         * ====================================================
         */

        container.appendChild(
            widget
        );

    },


    /*
     * ========================================================
     * DESTROY
     *
     * Called by screen-manager.js when the screen is removed.
     *
     * Clears the refresh interval so repeated screen rotations
     * do not create multiple Todoist polling timers.
     * ========================================================
     */

    async destroy(
        container
    ) {

        if (
            container._householdChoresRefreshInterval
        ) {

            clearInterval(
                container._householdChoresRefreshInterval
            );

            container._householdChoresRefreshInterval =
                null;

        }

    }

};


/*
 * ============================================================
 * FRIENDLY DUE DATE
 * ============================================================
 */

function getFriendlyDueDate(
    dueDate
) {

    /*
     * No due date.
     */

    if (
        !dueDate
    ) {

        return "No due date";

    }


    /*
     * Todoist returns dates as YYYY-MM-DD.
     *
     * Construct the date using local time so the browser
     * does not shift the date because of UTC conversion.
     */

    const parts =
        dueDate.split("-");


    const year =
        Number(
            parts[0]
        );

    const month =
        Number(
            parts[1]
        );

    const day =
        Number(
            parts[2]
        );


    const due =
        new Date(
            year,
            month - 1,
            day
        );


    /*
     * Today's date.
     */

    const now =
        new Date();

    now.setHours(
        0,
        0,
        0,
        0
    );


    /*
     * Difference in days.
     */

    const difference =
        Math.round(
            (
                due.getTime() -
                now.getTime()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    /*
     * OVERDUE
     */

    if (
        difference < 0
    ) {

        return "Overdue";

    }


    /*
     * TODAY
     */

    if (
        difference === 0
    ) {

        return "Today";

    }


    /*
     * TOMORROW
     */

    if (
        difference === 1
    ) {

        return "Tomorrow";

    }


    /*
     * DAY OF WEEK
     */

    return due.toLocaleDateString(
        "en-US",
        {
            weekday:
                "long"
        }
    );

}


/*
 * ============================================================
 * CREATE TASK
 * ============================================================
 */

function createTask(
    task
) {

    const item =
        document.createElement("div");

    item.className =
        "household-chores-widget__task";


    /*
     * ========================================================
     * CHECKBOX
     * ========================================================
     */

    const checkbox =
        document.createElement("button");

    checkbox.type =
        "button";

    checkbox.className =
        "household-chores-widget__checkbox";

    checkbox.setAttribute(
        "aria-label",
        `Complete ${task.content}`
    );


    checkbox.innerHTML =
        '<i class="fal fa-square"></i>';


    /*
     * ========================================================
     * COMPLETE TASK
     * ========================================================
     */

    checkbox.addEventListener(
        "click",
        async () => {

            checkbox.disabled =
                true;

            checkbox.innerHTML =
                '<i class="fal fa-spinner fa-spin"></i>';


            try {

                await todoistData
                    .completeTask(
                        task.id
                    );


                item.classList.add(
                    "household-chores-widget__task--completed"
                );


                checkbox.innerHTML =
                    '<i class="fal fa-check-square"></i>';

            }

            catch (error) {

                console.error(
                    "Failed to complete Todoist task:",
                    error
                );


                checkbox.disabled =
                    false;

                checkbox.innerHTML =
                    '<i class="fal fa-square"></i>';

            }

        }
    );


    /*
     * ========================================================
     * TASK CONTENT
     * ========================================================
     */

    const content =
        document.createElement("div");

    content.className =
        "household-chores-widget__task-content";


    /*
     * ========================================================
     * TASK TITLE ROW
     * ========================================================
     */

    const titleRow =
        document.createElement("div");

    titleRow.className =
        "household-chores-widget__task-title-row";


    /*
     * ========================================================
     * TASK TITLE
     * ========================================================
 */

    const title =
        document.createElement("span");

    title.className =
        "household-chores-widget__task-title";

    title.textContent =
        task.content;


    titleRow.appendChild(
        title
    );


    /*
     * ========================================================
     * DUE DATE PILL
     * ========================================================
     */

    const duePill =
        document.createElement("span");

    duePill.className =
        "household-chores-widget__due-pill";


    /*
     * ========================================================
     * CALENDAR ICON
     * ========================================================
     */

    const calendarIcon =
        document.createElement("i");

    calendarIcon.className =
        "far fa-calendar";


    duePill.appendChild(
        calendarIcon
    );


    /*
     * ========================================================
     * FRIENDLY DUE DATE
     * ========================================================
     */

    const dueText =
        document.createElement("span");

    const friendlyDueDate =
        getFriendlyDueDate(
            task.dueDate
        );

    dueText.textContent =
        friendlyDueDate;


    duePill.appendChild(
        dueText
    );


    /*
     * ========================================================
     * RECURRING ICON
     * ========================================================
     */

    if (
        task.isRecurring
    ) {

        const recurringIcon =
            document.createElement("i");

        recurringIcon.className =
            "fas fa-sync-alt";

        recurringIcon.setAttribute(
            "aria-label",
            "Recurring task"
        );


        duePill.appendChild(
            recurringIcon
        );

    }


    /*
     * ========================================================
     * OVERDUE STYLING
     * ========================================================
     */

    if (
        friendlyDueDate ===
        "Overdue"
    ) {

        duePill.classList.add(
            "household-chores-widget__due-pill--overdue"
        );

    }


    titleRow.appendChild(
        duePill
    );


    /*
     * ========================================================
     * ASSIGNEE
     * ========================================================
     */

    if (
        task.assignee
    ) {

        const assignee =
            document.createElement("span");

        assignee.className =
            "household-chores-widget__assignee";

        assignee.textContent =
            task.assignee;


        titleRow.appendChild(
            assignee
        );

    }


    content.appendChild(
        titleRow
    );


    /*
     * ========================================================
     * BUILD TASK
     * ========================================================
     */

    item.appendChild(
        checkbox
    );

    item.appendChild(
        content
    );


    return item;

}


export default householdChores;