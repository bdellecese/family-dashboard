/*
 * ============================================================
 * SCHOOL LUNCH
 * ============================================================
 *
 * Displays the weekly school lunch menu.
 *
 * The browser talks to the dashboard server through:
 *
 *     /api/school-lunch
 *
 * The server is responsible for:
 *
 *     Google Sheet
 *     PDF downloads
 *     PDF parsing
 *     Menu normalization
 *
 * The browser must NOT import schoolLunchData directly because
 * that service uses Node-only PDF packages.
 *
 * ============================================================
 */

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
         * CONFIGURATION
         * ====================================================
         */

        const oneDay =
            config.oneDay === true;


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
         * Add a mode-specific class when the widget is being
         * used in one-day mode.
         *
         * This allows the Distraction Free screen to use the
         * full width available to it without changing the
         * existing weekly presentation.
         */

        if (
            oneDay
        ) {

            widget.classList.add(
                "school-lunch-widget--one-day"
            );

        }


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
         * MENU CONTAINER
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
         * DETERMINE DISPLAY DATE
         * ====================================================
         *
         * Weekly mode:
         *
         *     Load the current/upcoming school week.
         *
         * One-day mode:
         *
         *     Saturday/Sunday
         *         -> next Monday
         *
         *     Weekday before 9:00 AM
         *         -> today
         *
         *     Weekday at/after 9:00 AM
         *         -> next school day
         *
         * This intentionally makes Friday after 9:00 AM roll
         * forward to the following Monday.
         * ====================================================
         */

        const displayDate =
            getSchoolLunchDisplayDate(
                new Date(),
                oneDay
            );


        const monday =
            getUpcomingSchoolWeekMonday(
                displayDate
            );


        let data;


        try {

            data =
                await getSchoolLunchMenu(
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
         * ONE-DAY MODE
         * ====================================================
         */

        if (
            oneDay
        ) {

            const day =
                data.days.find(
                    item =>
                        item.date ===
                        formatDate(
                            displayDate
                        )
                );


            /*
             * The requested day may not have a menu entry
             * because the source data only contains school
             * weekdays.
             */

            if (
                !day
            ) {

                renderMessage(
                    menu,
                    "School lunch menu not available for this day."
                );


                container.appendChild(
                    widget
                );

                return;

            }


            const dayLabel =
                document.createElement("div");

            dayLabel.className =
                "school-lunch-widget__week";


            dayLabel.textContent =
                formatDayLabel(
                    displayDate
                );


            menu.appendChild(
                dayLabel
            );


            const table =
                createSingleDayLunchTable(
                    day
                );


            menu.appendChild(
                table
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
         * WEEKLY TABLE
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
 * GET SCHOOL LUNCH DISPLAY DATE
 * ============================================================
 *
 * oneDay = false:
 *
 *     Returns the supplied date unchanged.
 *
 *
 * oneDay = true:
 *
 *     Saturday / Sunday
 *         -> next Monday
 *
 *     Weekday before 9:00 AM
 *         -> today
 *
 *     Weekday at/after 9:00 AM
 *         -> next school day
 *
 * Friday after 9:00 AM therefore rolls to Monday.
 *
 * ============================================================
 */

function getSchoolLunchDisplayDate(
    date,
    oneDay
) {

    const result =
        new Date(
            date
        );


    result.setHours(
        0,
        0,
        0,
        0
    );


    if (
        !oneDay
    ) {

        return result;

    }


    const day =
        date.getDay();


    /*
     * ========================================================
     * WEEKEND
     * ========================================================
     */

    if (
        day === 6
    ) {

        /*
         * Saturday -> Monday
         */

        result.setDate(
            result.getDate() +
            2
        );

        return result;

    }


    if (
        day === 0
    ) {

        /*
         * Sunday -> Monday
         */

        result.setDate(
            result.getDate() +
            1
        );

        return result;

    }


    /*
     * ========================================================
     * WEEKDAY BEFORE 9:00 AM
     * ========================================================
     */

    if (
        date.getHours() <
        9
    ) {

        return result;

    }


    /*
     * ========================================================
     * WEEKDAY AT / AFTER 9:00 AM
     * ========================================================
     */

    /*
     * Monday-Thursday -> next day.
     *
     * Friday -> next Monday.
     */

    if (
        day === 5
    ) {

        result.setDate(
            result.getDate() +
            3
        );

    }

    else {

        result.setDate(
            result.getDate() +
            1
        );

    }


    return result;

}


/*
 * ============================================================
 * GET UPCOMING SCHOOL WEEK MONDAY
 * ============================================================
 *
 * If the supplied date is Monday-Friday:
 *
 *     return that week's Monday.
 *
 * If the supplied date is Saturday/Sunday:
 *
 *     return the following Monday.
 *
 * ============================================================
 */

function getUpcomingSchoolWeekMonday(
    date
) {

    const result =
        new Date(
            date
        );


    result.setHours(
        0,
        0,
        0,
        0
    );


    const day =
        result.getDay();


    /*
     * Saturday.
     */

    if (
        day === 6
    ) {

        result.setDate(
            result.getDate() +
            2
        );

        return result;

    }


    /*
     * Sunday.
     */

    if (
        day === 0
    ) {

        result.setDate(
            result.getDate() +
            1
        );

        return result;

    }


    /*
     * Monday-Friday.
     */

    const daysSinceMonday =
        day - 1;


    result.setDate(
        result.getDate() -
        daysSinceMonday
    );


    return result;

}


/*
 * ============================================================
 * GET SCHOOL LUNCH MENU
 * ============================================================
 *
 * Browser-side API call.
 *
 * IMPORTANT:
 * Do not import schoolLunchData here.
 * ============================================================
 */

async function getSchoolLunchMenu(
    monday
) {

    const weekStart =
        formatDate(
            monday
        );


    const response =
        await fetch(
            `/api/school-lunch?weekStart=${encodeURIComponent(weekStart)}`,
            {
                method:
                    "GET",

                cache:
                    "no-store"
            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `School lunch API returned ${response.status}`
        );

    }


    return await response.json();

}


/*
 * ============================================================
 * CREATE SINGLE-DAY LUNCH TABLE
 * ============================================================
 *
 * One-day mode uses a simple 2 x 2 grid:
 *
 *     ELEMENTARY / MIDDLE | HIGH SCHOOL
 *     --------------------+----------------
 *     MENU                | MENU
 *
 * The weekday is already displayed elsewhere on the
 * distraction-free screen, so it is intentionally not repeated.
 *
 * ============================================================
 */

function createSingleDayLunchTable(
    day
) {

    const table =
        document.createElement("div");

    table.className =
        "school-lunch-widget__one-day-table";


    /*
     * ========================================================
     * SCHOOL HEADERS
     * ========================================================
     */

    const elementaryHeader =
        createOneDaySchoolHeader(
            "Mayo Elementary & Mountview Middle"
        );


    const highSchoolHeader =
        createOneDaySchoolHeader(
            "Wachusett Regional High School"
        );


    /*
     * ========================================================
     * MENU CELLS
     * ========================================================
     */

    const elementaryMenu =
        createOneDayMenuCell(
            day,
            "elementaryMiddle"
        );


    const highSchoolMenu =
        createOneDayMenuCell(
            day,
            "highSchool"
        );


    /*
     * ========================================================
     * BUILD GRID
     * ========================================================
     */

    table.appendChild(
        elementaryHeader
    );


    table.appendChild(
        highSchoolHeader
    );


    table.appendChild(
        elementaryMenu
    );


    table.appendChild(
        highSchoolMenu
    );


    return table;

}


/*
 * ============================================================
 * ONE-DAY SCHOOL HEADER
 * ============================================================
 */

function createOneDaySchoolHeader(
    schoolName
) {

    const header =
        document.createElement("div");

    header.className =
        "school-lunch-widget__day-heading";


    header.textContent =
        schoolName;


    return header;

}


/*
 * ============================================================
 * ONE-DAY MENU CELL
 * ============================================================
 */

function createOneDayMenuCell(
    day,
    menuProperty
) {

    const cell =
        document.createElement("div");

    cell.className =
        "school-lunch-widget__day";


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
        (
            item,
            index
        ) => {

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
        (
            item,
            index
        ) => {

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
 * FORMAT DAY LABEL
 * ============================================================
 */

function formatDayLabel(
    date
) {

    return date.toLocaleDateString(
        "en-US",
        {

            weekday:
                "long",

            month:
                "long",

            day:
                "numeric"

        }
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