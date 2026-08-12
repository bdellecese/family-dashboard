/*
 * ============================================================
 * SCHOOL LUNCH DATA SERVICE
 * ============================================================
 *
 * Provides school lunch menu data to the dashboard.
 *
 * V1:
 * - Uses June 2026 menus for testing.
 * - Supports Mayo Elementary / Mountview Middle.
 * - Supports Wachusett Regional High School.
 * - Returns normalized Monday-Friday menu data.
 *
 * Future:
 * - Automatically locate the current month's PDFs.
 * - Parse the PDFs dynamically.
 *
 * ============================================================
 */

const schoolLunchData = {

    /*
     * ========================================================
     * CONFIGURATION
     * ========================================================
     */

    testMode: true,

    testYear: 2026,

    testMonth: 6,


    /*
     * ========================================================
     * GET WEEKLY MENU
     * ========================================================
     *
     * Returns the school lunch menus for the requested week.
     *
     * weekStart should be a Date representing Monday.
     *
     * Example:
     *
     *     getWeeklyMenu(
     *         new Date(2026, 5, 15)
     *     );
     *
     * ========================================================
     */

    async getWeeklyMenu(
        weekStart
    ) {

        /*
         * V1 TEST MODE
         */

        if (
            this.testMode
        ) {

            return getTestWeek(
                weekStart
            );

        }


        /*
         * FUTURE LIVE MODE
         *
         * This will eventually:
         *
         * 1. Determine the current month.
         * 2. Locate the Elementary/Middle PDF.
         * 3. Locate the High School PDF.
         * 4. Parse both PDFs.
         * 5. Normalize the menus.
         *
         * The widget will not need to change.
         */

        return {
            available: false,

            message:
                "School lunch menu not yet available.",

            weekStart:
                formatDate(
                    weekStart
                ),

            schools: {}

        };

    }

};


/*
 * ============================================================
 * JUNE 2026 TEST DATA
 * ============================================================
 *
 * Elementary + Middle schools use the same district menu.
 *
 * Mayo Elementary:
 *     Zander
 *     Teddy
 *
 * Mountview Middle:
 *     Isabella
 *
 * WRHS:
 *     James
 *
 * ============================================================
 */

const juneElementaryMiddle = {

    "2026-06-01": [
        "Chicken Tenders",
        "Sweet Potato Fries",
        "Chilled or Fresh Fruit",
        "Milk",
        "Bagel Meal"
    ],

    "2026-06-02": [
        "Mini Pancakes",
        "Tater Squares",
        "Chicken Sausage Links",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-03": [
        "Pasta w/ Marinara Sauce",
        "Mixed Vegetables",
        "Cheese Bread Stick",
        "Chilled or Fresh Fruit",
        "Milk",
        "Cereal Meal"
    ],

    "2026-06-04": [
        "Sloppy Joe on a Roll",
        "Oven Baked French Fries",
        "Corn",
        "Chilled or Fresh Fruit",
        "Milk",
        "Chicken Caesar Salad"
    ],

    "2026-06-05": [
        "Pizza",
        "Caesar Salad",
        "Hummus & Veggies",
        "Chilled or Fresh Fruit",
        "Milk",
        "Hot Dog on a Roll"
    ],

    "2026-06-08": [
        "Mandarin Chicken",
        "Seasoned Rice",
        "Steamed Broccoli",
        "Chilled or Fresh Fruit",
        "Milk",
        "Bagel Meal"
    ],

    "2026-06-09": [
        "Hot Dog on a Roll",
        "Smile Fries",
        "Cole Slaw",
        "Chilled or Fresh Fruit",
        "Milk",
        "Pizza"
    ],

    "2026-06-10": [
        "Mac n’ Cheese",
        "Mixed Vegetables",
        "Dinner Roll",
        "Chilled or Fresh Fruit",
        "Milk",
        "Cereal Meal"
    ],

    "2026-06-11": [
        "Hamburger on a Roll",
        "Swt Potato French Fries",
        "Baked Beans",
        "Chilled or Fresh Fruit",
        "Milk",
        "Chicken Caesar Salad"
    ],

    "2026-06-12": [
        "Pizza",
        "Caesar Salad",
        "Chilled or Fresh Fruit",
        "Milk",
        "Buffalo Chicken Sub"
    ],

    "2026-06-15": [
        "Turkey & Cheese Croissant",
        "Oven Baked French Fries",
        "Hummus & Veggies",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-16": [
        "Waffles",
        "Tater Squares",
        "Chicken Sausage Links",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-17": [
        "Meatball Sub",
        "Oven Baked French Fries",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-18": [
        "Pizza",
        "Caesar Salad",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-19": [
        "NO SCHOOL"
    ],

    "2026-06-22": [
        "Chicken Patty on a Roll",
        "Sweet Potato Fries",
        "Mixed Vegetables",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-23": [
        "Pizza & Broccoli",
        "Chilled or Fresh Fruit",
        "Milk",
        "EARLY RELEASE",
        "NO MEAL SERVICE"
    ],

    "2026-06-24": [
        "EARLY RELEASE",
        "NO MEAL SERVICE"
    ],

    "2026-06-25": [],

    "2026-06-26": [],

    "2026-06-29": [],

    "2026-06-30": []

};


/*
 * ============================================================
 * JUNE 2026 HIGH SCHOOL TEST DATA
 * ============================================================
 */

const juneHighSchool = {

    "2026-06-01": [
        "Chicken Drumstick",
        "Mac n’ Cheese",
        "Three Bean Salad",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-02": [
        "Turkey & Bacon on a Roll",
        "Heartzel Pretzels",
        "Carrot Sticks & Hummus",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-03": [
        "Cheese Lasagna",
        "Garden Salad",
        "Garlic Bread Knot",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-04": [
        "Sloppy Joe on a Roll",
        "Oven Baked French Fries",
        "Cole Slaw",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-05": [
        "Pizza",
        "Caesar Salad",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-08": [
        "Grilled Ham & Cheese",
        "Goldfish Crackers",
        "Carrot & Celery Sticks",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-09": [
        "Chicken Parmesan on a Roll",
        "Oven Baked French Fries",
        "Chickpea Salad",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-10": [
        "American Chop Suey",
        "Caesar Salad",
        "Dinner Roll",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-11": [
        "Hamburger on a Roll",
        "Oven Baked French Fries",
        "Cucumber Slices",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-12": [
        "Pizza",
        "Garden Salad",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-15": [
        "Pizza Sticks",
        "Marinara Sauce",
        "Caesar Salad",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-16": [
        "Rib b Que on a Roll",
        "Pasta Salad",
        "Three Bean Salad",
        "Chilled or Fresh Fruit",
        "Milk"
    ],

    "2026-06-17": [
        "EXAM DAY",
        "LIMITED MENU",
        "TBA"
    ],

    "2026-06-18": [
        "EXAM DAY",
        "LIMITED MENU",
        "TBA"
    ],

    "2026-06-19": [
        "NO SCHOOL"
    ],

    "2026-06-22": [
        "EXAM DAY",
        "LIMITED MENU",
        "TBA"
    ],

    "2026-06-23": [
        "LAST DAY",
        "LIMITED MENU",
        "TBA"
    ],

    "2026-06-24": [],

    "2026-06-25": [],

    "2026-06-26": [],

    "2026-06-29": [],

    "2026-06-30": []

};


/*
 * ============================================================
 * GET TEST WEEK
 * ============================================================
 */

function getTestWeek(
    weekStart
) {

    /*
     * Make sure we are working with a Date.
     */

    const monday =
        new Date(
            weekStart
        );

    monday.setHours(
        0,
        0,
        0,
        0
    );


    /*
     * Build Monday-Friday.
     */

    const days = [];


    for (
        let index = 0;
        index < 5;
        index++
    ) {

        const date =
            new Date(
                monday
            );

        date.setDate(
            monday.getDate() + index
        );


        const dateKey =
            formatDate(
                date
            );


        days.push({

            date:
                dateKey,

            day:
                date.toLocaleDateString(
                    "en-US",
                    {
                        weekday:
                            "long"
                    }
                ),

            elementaryMiddle:
                juneElementaryMiddle[
                    dateKey
                ] || [],

            highSchool:
                juneHighSchool[
                    dateKey
                ] || []

        });

    }


    return {

        available:
            true,

        year:
            2026,

        month:
            6,

        weekStart:
            formatDate(
                monday
            ),

        days:

            days,

        schools: {

            mayo: {

                name:
                    "Mayo Elementary",

                students: [
                    "Zander",
                    "Teddy"
                ]

            },

            mountview: {

                name:
                    "Mountview Middle",

                students: [
                    "Isabella"
                ]

            },

            wrhs: {

                name:
                    "Wachusett Regional High School",

                students: [
                    "James"
                ]

            }

        }

    };

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


export default schoolLunchData;