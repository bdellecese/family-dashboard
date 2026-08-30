import {
    getSheetRows
} from "../../services/google-sheets/sheets.js";


const familyMenu = {

    async render(container, config = {}) {

        /*
         * ----------------------------------------
         * Configuration
         * ----------------------------------------
         */

        const settings = {

            title: "Family Menu",

            ...config

        };


        /*
         * ----------------------------------------
         * Container
         * ----------------------------------------
         */

        container.classList.add(
            "family-menu-widget"
        );


        /*
         * ----------------------------------------
         * Load data
         * ----------------------------------------
         */

        const rows =
            await getSheetRows("Meals");


        if (
            !rows ||
            rows.length === 0
        ) {

            container.innerHTML = `
                <div class="
                    family-menu-widget__error
                ">
                    Unable to load menu.
                </div>
            `;

            return;

        }


        /*
         * ----------------------------------------
         * Parse sheet
         * ----------------------------------------
         */

        const menu =
            parseMenu(rows);


        /*
         * ----------------------------------------
         * Render
         * ----------------------------------------
         */

        renderMenu(
            container,
            menu,
            settings
        );

    }

};


/*
 * ============================================
 * PARSE MENU
 * ============================================
 */

function parseMenu(rows) {

    /*
     * ----------------------------------------
     * Build column map
     * ----------------------------------------
     */

    const headers =
        rows[0]?.c || [];


    const columns = {};


    headers.forEach(
        (cell, index) => {

            const name =
                String(
                    cell?.v ?? ""
                )
                .trim()
                .toLowerCase();


            if (name) {

                columns[name] =
                    index;

            }

        }
    );


    /*
     * ----------------------------------------
     * Validate sheet
     * ----------------------------------------
     */

    if (
        columns.day === undefined
    ) {

        console.error(
            "Meals sheet is missing the Day column."
        );

        return {

            chef: "",

            meals: []

        };

    }


    /*
     * ----------------------------------------
     * Days we recognize
     * ----------------------------------------
     */

    const days = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];


    const meals = [];

    let chef = "";

    let extra = "";


    /*
     * ----------------------------------------
     * Read rows
     * ----------------------------------------
     */

    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i]?.c || [];


        const day =
            getCellValue(
                row,
                columns.day
            );


        /*
         * Staging section
         */

        if (
            day ===
            "--- NEXT WEEK ---"
        ) {

            break;

        }


        /*
         * Chef
         */

        if (
            day.toLowerCase() ===
            "chef"
        ) {

            /*
             * Chef is currently stored
             * in the breakfast column.
             */

            chef =
                getCellValue(
                    row,
                    columns.breakfast
                );

            continue;

        }

       /*
        * ----------------------------------------
        * Extra
        * ----------------------------------------
        */

        if (
            day.toLowerCase() ===
            "extra"
        ) {

            /*
             * Extra is currently stored
             * in the breakfast column.
             */


            extra =
                getCellValue(
                    row,
                    columns.breakfast
                );

            continue;

        }

        /*
         * Ignore non-day rows
         */

        if (
            !days.includes(day)
        ) {

            continue;

        }


        /*
         * Build meal object
         */

        meals.push({

            day,

            breakfast:
                getCellValue(
                    row,
                    columns.breakfast
                ),

            lunch:
                getCellValue(
                    row,
                    columns.lunch
                ),

            dinner:
                getCellValue(
                    row,
                    columns.dinner
                ),

            breakfastUrl:
                getCellValue(
                    row,
                    columns["b-url"]
                ),

            lunchUrl:
                getCellValue(
                    row,
                    columns["l-url"]
                ),

            dinnerUrl:
                getCellValue(
                    row,
                    columns["d-url"]
                )

        });

    }


    return {

        chef,

        extra,

        meals

    };

}


/*
 * ============================================
 * RENDER MENU
 * ============================================
 */

function renderMenu(
    container,
    menu,
    settings
) {

    container.innerHTML = `
        <div class="
            family-menu-widget__title
        ">
            <span>
                ${settings.title}
            </span>
        </div>

        ${
            menu.chef
                ? `
                    <div class="family-menu-widget__chef">
                        Chef: ${menu.chef}
                    </div>
                `
                : ""
        }

        ${
            menu.extra
                ? `
                    <div class="family-menu-widget__extra">
                        Extra: ${menu.extra}
                    </div>
                `
                : ""
        }

        <div class="
            family-menu-widget__list
        "></div>
    `;


    const list =
        container.querySelector(
            ".family-menu-widget__list"
        );


    /*
    * ----------------------------------------
    * Render days
    * ----------------------------------------
    */

    const today =
        new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long"
            }
        ).format(
            new Date()
        );


    for (
        const meal of menu.meals
    ) {

        const isToday =
            meal.day === today;


        /*
        * Day section
        */

        const daySection =
            document.createElement(
                "div"
            );


        daySection.className =
            "family-menu-widget__day";


        if (isToday) {

            daySection.classList.add(
                "family-menu-widget__day--today"
            );

        }


        /*
        * Day header
        */

        const dayElement =
            document.createElement(
                "div"
            );


        dayElement.className =
            "family-menu-widget__day-name";


        if (isToday) {

            dayElement.classList.add(
                "family-menu-widget__day-name--today"
            );


            const todayElement =
                document.createElement(
                    "span"
                );


            todayElement.className =
                "family-menu-widget__today-label";


            todayElement.textContent =
                "TODAY";


            dayElement.appendChild(
                todayElement
            );

        }


        const dayText =
            document.createElement(
                "span"
            );


        dayText.textContent =
            meal.day;


        dayElement.appendChild(
            dayText
        );


        daySection.appendChild(
            dayElement
        );


        /*
        * Meals
        */

        addMeal(
            daySection,
            "B",
            meal.breakfast,
            meal.breakfastUrl,
            isToday
        );


        addMeal(
            daySection,
            "L",
            meal.lunch,
            meal.lunchUrl,
            isToday
        );


        addMeal(
            daySection,
            "D",
            meal.dinner,
            meal.dinnerUrl,
            isToday
        );


        list.appendChild(
            daySection
        );

    }

}


/*
 * ============================================
 * ADD MEAL
 * ============================================
 */

function addMeal(
    container,
    prefix,
    meal,
    url,
    isToday = false
) {

    /*
     * Don't render empty meals.
     */

    if (!meal) {

        return;

    }


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "family-menu-widget__meal";


    if (isToday) {

        element.classList.add(
            "family-menu-widget__meal--today"
        );

    }

    /*
     * Meal prefix
     */

    const iconElement =
    document.createElement(
        "i"
    );


    iconElement.className =
        "fa-fw fa-solid fa-utensils family-menu-widget__meal-icon";


    element.appendChild(
        iconElement
    );


    const prefixElement =
        document.createElement(
            "span"
        );


    prefixElement.className =
        "family-menu-widget__meal-prefix";


    prefixElement.textContent =
        `${prefix}:`;


    element.appendChild(
        prefixElement
    );


    /*
     * Meal text
     */

    if (url) {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";


        link.textContent =
            meal;


        element.appendChild(
            link
        );

    }

    else {

        const text =
            document.createElement(
                "span"
            );


        text.textContent =
            meal;


        element.appendChild(
            text
        );

    }


    container.appendChild(
        element
    );

}


/*
 * ============================================
 * CELL VALUE
 * ============================================
 */

function getCellValue(
    row,
    column
) {

    if (
        column === undefined
    ) {

        return "";

    }


    return String(
        row[column]?.v ?? ""
    )
    .replace(/\u00a0/g, " ")
    .trim();

}


export default familyMenu;