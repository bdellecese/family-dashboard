const calendar = {

    name: "calendar",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        /*
         * WRAPPER
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "calendar-widget";

        container.appendChild(
            wrapper
        );


        /*
         * CURRENT DATE
         */

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            today.getMonth();

        const todayDate =
            today.getDate();


        /*
         * CALENDAR GRID
         */

        const grid =
            document.createElement(
                "div"
            );

        grid.className =
            "calendar-widget__grid";


        /*
         * DAY HEADERS
         */

        const dayNames = [
            "Su",
            "M",
            "Tu",
            "W",
            "Th",
            "F",
            "Sa"
        ];


        dayNames.forEach(
            dayName => {

                const header =
                    document.createElement(
                        "div"
                    );

                header.className =
                    "calendar-widget__day-name";

                header.textContent =
                    dayName;

                grid.appendChild(
                    header
                );

            }
        );


        /*
         * MONTH INFORMATION
         */

        const firstDay =
            new Date(
                year,
                month,
                1
            ).getDay();


        const daysInMonth =
            new Date(
                year,
                month + 1,
                0
            ).getDate();


        /*
         * PREVIOUS MONTH
         */

        const previousMonth =
            month === 0
                ? 11
                : month - 1;


        const previousYear =
            month === 0
                ? year - 1
                : year;


        const daysInPreviousMonth =
            new Date(
                previousYear,
                previousMonth + 1,
                0
            ).getDate();


        /*
         * TRAILING DAYS
         * FROM PREVIOUS MONTH
         */

        for (
            let i = firstDay - 1;
            i >= 0;
            i--
        ) {

            const dayNumber =
                daysInPreviousMonth - i;


            /*
             * The first visible
             * previous-month date
             * gets the month label.
             */

            const showMonth =
                i === firstDay - 1;


            const cell =
                createAdjacentDay(
                    dayNumber,
                    previousMonth,
                    previousYear,
                    showMonth
                );


            grid.appendChild(
                cell
            );

        }


        /*
         * CURRENT MONTH
         */

        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            const cell =
                document.createElement(
                    "div"
                );

            cell.className =
                "calendar-widget__day";


            const number =
                document.createElement(
                    "span"
                );

            number.className =
                "calendar-widget__day-number";


            /*
             * CURRENT MONTH
             *
             * Always show the
             * actual day number.
             */

            number.textContent =
                day;


            /*
             * TODAY
             */

            if (
                day === todayDate
            ) {

                cell.classList.add(
                    "calendar-widget__day--today"
                );

            }


            cell.appendChild(
                number
            );

            grid.appendChild(
                cell
            );

        }


        /*
         * NEXT MONTH
         */

        const totalCurrentCells =
            firstDay +
            daysInMonth;


        const remainingCells =
            42 -
            totalCurrentCells;


        const nextMonth =
            month === 11
                ? 0
                : month + 1;


        const nextYear =
            month === 11
                ? year + 1
                : year;


        /*
         * LEADING DAYS
         * FROM NEXT MONTH
         */

        for (
            let day = 1;
            day <= remainingCells;
            day++
        ) {

            const cell =
                createAdjacentDay(
                    day,
                    nextMonth,
                    nextYear,
                    day === 1
                );


            grid.appendChild(
                cell
            );

        }


        /*
         * ADD GRID
         */

        wrapper.appendChild(
            grid
        );

    }

};


/*
 * CREATE ADJACENT-MONTH DAY
 */

function createAdjacentDay(
    day,
    month,
    year,
    showMonth
) {

    const cell =
        document.createElement(
            "div"
        );

    cell.className =
        "calendar-widget__day calendar-widget__day--adjacent";


    const number =
        document.createElement(
            "span"
        );

    number.className =
        "calendar-widget__day-number";


    /*
     * FIRST VISIBLE DAY
     * OF ADJACENT MONTH
     */

    if (
        showMonth
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        number.textContent =
            date.toLocaleDateString(
                undefined,
                {
                    month:
                        "short"
                }
            );


        number.classList.add(
            "calendar-widget__day-number--month"
        );

    }


    /*
     * ALL OTHER ADJACENT DAYS
     */

    else {

        number.textContent =
            day;

    }


    cell.appendChild(
        number
    );

    return cell;

}


export default calendar;