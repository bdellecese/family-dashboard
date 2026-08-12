/*
 * ============================================================
 * SCHOOL LUNCH
 * ============================================================
 *
 * Displays the weekly school lunch menu.
 *
 * V2:
 *
 * - Single combined table
 * - School names as first column
 * - Monday-Friday columns
 * - Elementary / Middle
 * - Wachusett Regional High School
 * - Highlights today
 * - No student names
 * - No buy/bring tracking
 *
 * ============================================================
 */

import schoolLunchData
    from "../../services/school-lunch/school-lunch-data.js";


const schoolLunch = {

    name:
        "school-lunch",


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
            "school-lunch-widget";


        /*
         * ====================================================
         * HEADER
         * ====================================================
         */

        const header =
            document.createElement("div");

        header.className =
            "school-lunch-widget__header";


        const title =
            document.createElement("div");

        title.className =
            "school-lunch-widget__title";

        title.textContent =
            "School Lunch";


        header.appendChild(
            title
        );


        widget.appendChild(
            header
        );


        /*
         * ====================================================
         * MENU
         * ====================================================
         */

        const menu =
            document.createElement("div");

        menu.className =
            "school-lunch-widget__menu";


        widget.appendChild(
            menu
        );


        /*
         * ====================================================
         * TEST WEEK
         *
         * June 15, 2026
         *
         * Switch back to current week once
         * visual design is finalized.
         * ====================================================
         */

        const monday =
            new Date(
                2026,
                5,
                15
            );


        let data;


        try {

            data =
                await schoolLunchData
                    .getWeeklyMenu(
                        monday
                    );

        }

        catch (error) {

            console.error(
                "Failed to load school lunch menu:",
                error
            );


            renderMessage(
                menu,
                "Unable to load school lunch menu."
            );


            container.appendChild(
                widget
            );

            return;

        }


        /*
         * ====================================================
         * UNAVAILABLE
         * ====================================================
         */

        if (
            !data ||
            !data.available
        ) {

            renderMessage(
                menu,
                data?.message ||
                "School lunch menu not yet available."
            );


            container.appendChild(
                widget
            );

            return;

        }


        /*
         * ====================================================
         * WEEK LABEL
         * ====================================================
         */

        const week =
            document.createElement("div");

        week.className =
            "school-lunch-widget__week";

        week.textContent =
            formatWeekLabel(
                data.days
            );


        menu.appendChild(
            week
        );


        /*
         * ====================================================
         * TABLE
         * ====================================================
         */

        const table =
            createLunchTable(
                data.days
            );


        menu.appendChild(
            table
        );


        /*
         * ====================================================
         * ADD WIDGET
         * ====================================================
         */

        container.appendChild(
            widget
        );

    }

};


/*
 * ============================================================
 * CREATE LUNCH TABLE
 * ============================================================
 */

function createLunchTable(
    days
) {

    const table =
        document.createElement("div");

    table.className =
        "school-lunch-widget__table";


    /*
     * ========================================================
     * HEADER ROW
     * ========================================================
     */

    const headerRow =
        document.createElement("div");

    headerRow.className =
        "school-lunch-widget__table-row " +
        "school-lunch-widget__table-row--header";


    /*
     * School header cell.
     */

    const schoolHeader =
        document.createElement("div");
    
    schoolHeader.className =
        "school-lunch-widget__day-heading";

    schoolHeader.textContent =
        "School";


    headerRow.appendChild(
        schoolHeader
    );


    /*
     * Day header cells.
     */

    days.forEach(
        day => {

            const dayCell =
                document.createElement("div");

            dayCell.className =
                "school-lunch-widget__day-heading";


            dayCell.textContent =
                day.day;


            if (
                isToday(
                    day.date
                )
            ) {

                dayCell.classList.add(
                    "school-lunch-widget__day-heading--today"
                );

            }


            headerRow.appendChild(
                dayCell
            );

        }
    );


    table.appendChild(
        headerRow
    );


    /*
     * ========================================================
     * ELEMENTARY / MIDDLE
     * ========================================================
     */

    table.appendChild(
        createSchoolRow(
            "Mayo Elementary & Mountview Middle",
            days,
            "elementaryMiddle"
        )
    );


    /*
     * ========================================================
     * HIGH SCHOOL
     * ========================================================
     */

    table.appendChild(
        createSchoolRow(
            "Wachusett Regional High School",
            days,
            "highSchool"
        )
    );


    return table;
}


/*
 * ============================================================
 * CREATE SCHOOL ROW
 * ============================================================
 */

function createSchoolRow(
    schoolName,
    days,
    menuProperty
) {

    const row =
        document.createElement("div");

    row.className =
        "school-lunch-widget__table-row";


    /*
     * School name.
     */

    const schoolCell =
        document.createElement("div");

    schoolCell.className =
        "school-lunch-widget__school-cell";

    schoolCell.textContent =
        schoolName;


    row.appendChild(
        schoolCell
    );


    /*
     * Daily menus.
     */

    days.forEach(
        day => {

            const cell =
                createDayCell(
                    day,
                    menuProperty
                );


            row.appendChild(
                cell
            );

        }
    );


    return row;
}


/*
 * ============================================================
 * CREATE DAY CELL
 * ============================================================
 */

function createDayCell(
    day,
    menuProperty
) {

    const cell =
        document.createElement("div");

    cell.className =
        "school-lunch-widget__day";


    /*
     * Highlight today.
     */

    if (
        isToday(
            day.date
        )
    ) {

        cell.classList.add(
            "school-lunch-widget__day--today"
        );

    }


    const items =
        day[
            menuProperty
        ] || [];


    /*
     * No menu.
     */

    if (
        items.length === 0
    ) {

        const noMenu =
            document.createElement("div");

        noMenu.className =
            "school-lunch-widget__no-menu";

        noMenu.textContent =
            "No menu";


        cell.appendChild(
            noMenu
        );


        return cell;

    }


    /*
     * Render menu items.
     */

    items.forEach(
        (item, index) => {

            const element =
                document.createElement("div");

            element.className =
                "school-lunch-widget__item";


            /*
             * First item is treated as the main entrée.
             */

            if (
                index === 0
            ) {

                element.classList.add(
                    "school-lunch-widget__item--main"
                );

            }


            /*
             * Special statuses.
             */

            if (
                item ===
                "NO SCHOOL"
            ) {

                element.classList.add(
                    "school-lunch-widget__item--no-school"
                );

            }


            if (
                item ===
                "EARLY RELEASE"
            ) {

                element.classList.add(
                    "school-lunch-widget__item--early-release"
                );

            }


            if (
                item ===
                "EXAM DAY"
            ) {

                element.classList.add(
                    "school-lunch-widget__item--exam"
                );

            }


            if (
                item ===
                "LIMITED MENU"
            ) {

                element.classList.add(
                    "school-lunch-widget__item--limited"
                );

            }


            element.textContent =
                item;


            cell.appendChild(
                element
            );

        }
    );


    return cell;
}


/*
 * ============================================================
 * FORMAT WEEK LABEL
 * ============================================================
 */

function formatWeekLabel(
    days
) {

    if (
        !days ||
        days.length === 0
    ) {

        return "";

    }


    const first =
        parseLocalDate(
            days[0].date
        );

    const last =
        parseLocalDate(
            days[
                days.length - 1
            ].date
        );


    const firstLabel =
        first.toLocaleDateString(
            "en-US",
            {
                month:
                    "short",

                day:
                    "numeric"
            }
        );


    const lastLabel =
        last.toLocaleDateString(
            "en-US",
            {
                month:
                    "short",

                day:
                    "numeric",

                year:
                    "numeric"
            }
        );


    return (
        `${firstLabel} – ${lastLabel}`
    );

}


/*
 * ============================================================
 * RENDER MESSAGE
 * ============================================================
 */

function renderMessage(
    container,
    message
) {

    const element =
        document.createElement("div");

    element.className =
        "school-lunch-widget__message";

    element.textContent =
        message;


    container.appendChild(
        element
    );

}


/*
 * ============================================================
 * IS TODAY
 * ============================================================
 */

function isToday(
    dateString
) {

    const today =
        new Date();


    return (
        formatDate(
            today
        ) ===
        dateString
    );

}


/*
 * ============================================================
 * PARSE LOCAL DATE
 * ============================================================
 */

function parseLocalDate(
    dateString
) {

    const parts =
        dateString.split("-");


    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

}


/*
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
    date
) {

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


    return (
        `${year}-${month}-${day}`
    );

}


export default schoolLunch;