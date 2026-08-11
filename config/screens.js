export const screenOrder = [
    "calendar"
];

export const screens = {

    information: {

        layout: "information-layout",
        theme: "dark",
        duration: { minutes: 2 },


        regions: {

            /*
             * LEFT PANEL
             */

            "left-panel": [

                {
                    name: "date-time",

                    config: {

                        timezone: "America/New_York",
                        color: "rgba(255, 255, 255, 0.85)",

                        time: {

                            format: "12h",
                            size: 72,
                            weight: "normal"

                        },

                        date: {
                            format:
                                "weekday-month-day",
                                size: 48,
                                weight: "normal"

                        },
                        alignment: "left"
                    }

                },

                { name: "photo" },

                {
                    name: "weather-alerts",
                    config: { location: "Holden, MA"}
                }

            ],


            /*
             * RIGHT PANEL
             */

            "right-panel": {


                /*
                 * TOP RIGHT
                 */

                "right-top": {


                    /*
                     * LEFT 1/3
                     *
                     * New calendar-list widget
                     */

                    "calendar-list": [

                        {

                            name: "calendar-list",

                            config: {

                                calendars: [

                                    "barry.dellecese@gmail.com",
                                    "family01156229611257150686@group.calendar.google.com",
                                    "natalie.dellecese@gmail.com",
                                    "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com"

                                ],

                                days: 7,

                                showCalendarName: false

                            }

                        }

                    ],


                    /*
                     * RIGHT 2/3
                     */

                    "right-top-content": {


                        /*
                         * TOP HALF
                         *
                         * Calendar + News
                         */

                        "top-summary": [

                            {
                                name: "calendar"
                            },


                            {
                                name: "news",
                                config: {
                                    feed: "http://feeds.bbci.co.uk/news/world/rss.xml",
                                    rotationSeconds: 30
                                }
                            }

                        ],


                        /*
                         * BOTTOM HALF
                         *
                         * Countdown
                         */

                        "countdown": [

                            {
                                name: "countdown"
                            }

                        ]

                    }

                },


                /*
                 * RIGHT BOTTOM
                 */

                "right-bottom": {


                    /*
                     * PRAYER COLUMN
                     */

                    "prayer-column": {

                        "prayer": [

                            {
                                name: "prayer-list"
                            }

                        ],


                        "wifi": [

                            {

                                name: "wifi",

                                config: {

                                    image:
                                        "https://cdn11.bigcommerce.com/s-wld7mb6jpw/images/stencil/1280x1280/products/755/904/61ktCJKmTGL._AC_SL1500___54216.1723046252.jpg?c=1",

                                    ssid:
                                        "YOUR_GUEST_SSID",

                                    password:
                                        "YOUR_GUEST_PASSWORD",

                                    security:
                                        "WPA"

                                }

                            }

                        ]

                    },


                    /*
                     * WEATHER COLUMN
                     */

                    "weather-column": {

                        "weather": [

                            {
                                name: "weather",

                                config: {

                                    location: "Holden, MA"

                                }

                            }

                        ],

                        "placeholder": [
                            {
                                name: "placeholder"
                            }
                        ]

                    },


                    /*
                     * MENU COLUMN
                     */

                    "menu-column": [

                        {
                            name: "family-menu"
                        }

                    ]

                }

            }

        }

    },

    calendar: {

        layout: "large-calendar-layout",

        theme: "dark",

        duration: {
            minutes: 5
        },

        regions: {

            "calendar-main": [

                {
                    name: "large-calendar",

                    config: {

                        calendars: [
                            "family01156229611257150686@group.calendar.google.com", /* Family */
                            "barry.dellecese@gmail.com",
                            "m1tj3sivp5mmipt3f5a0d164cifunqm4@import.calendar.google.com", /* Barry TripIt */
                            "natalie.dellecese@gmail.com",
                            "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com", /* Nat TSC */
                            "james.dellecese@gmail.com",
                            "kkpcjqa95gv87cn0ojj5oi7s6o3h6195@import.calendar.google.com", /* WU FC U16 */
                            "isabella.c.dellecese@gmail.com",
                            "gvco5trj7a8eip611tr883v8jsbftad6@import.calendar.google.com", /* WU Softball */
                            "alexander.dellecese@gmail.com",
                            "878vjmvnrhp8soe4g89lmditinvg9tpm@import.calendar.google.com", /* WU FC U10 */
                            "theodore.dellecese@gmail.com",
                            "en.usa#holiday@group.v.calendar.google.com" /* US Holidays */
                        ],

                        showCalendarName: false
                    }
                }
            ]
        }
    }

};