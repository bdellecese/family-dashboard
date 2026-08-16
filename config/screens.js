/*
 * ============================================================
 * SCREEN CONFIGURATION
 * ============================================================
 */

export const screenOrder = [
    "information",
    "calendar",
    "chores-fun",
    "sports"
];


export const screens = {


    /*
     * ============================================================
     * INFORMATION
     * ============================================================
     */

    information: {

        layout:
            "information-layout",

        theme:
            "dark",

        duration: {

            seconds:
                60

        },


        regions: {


            /*
             * LEFT PANEL
             */

            "left-panel": [

                {

                    name:
                        "date-time",

                    config: {

                        timezone:
                            "America/New_York",

                        color:
                            "rgba(255, 255, 255, 0.85)",

                        time: {

                            format:
                                "12h",

                            size:
                                72,

                            weight:
                                "normal"

                        },

                        date: {

                            format:
                                "weekday-month-day",

                            size:
                                48,

                            weight:
                                "normal"

                        },

                        alignment:
                            "left"

                    }

                },


                {

                    name:
                        "photo"

                },


                {

                    name:
                        "weather-alerts",

                    config: {

                        location:
                            "Holden, MA"

                    }

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


                    "calendar-list": [

                        {

                            name:
                                "calendar-list",

                            config: {

                                calendars: [

                                    "barry.dellecese@gmail.com",

                                    "family01156229611257150686@group.calendar.google.com",

                                    "natalie.dellecese@gmail.com",

                                    "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com"

                                ],

                                days:
                                    7,

                                showCalendarName:
                                    false

                            }

                        }

                    ],


                    "right-top-content": {


                        "top-summary": [

                            {

                                name:
                                    "calendar"

                            },


                            {

                                name:
                                    "news",

                                config: {

                                    feed:
                                        "http://feeds.bbci.co.uk/news/world/rss.xml",

                                    rotationSeconds:
                                        30

                                }

                            }

                        ],


                        "countdown": [

                            {

                                name:
                                    "countdown"

                            }

                        ]

                    }

                },


                /*
                 * RIGHT BOTTOM
                 */

                "right-bottom": {


                    "prayer-column": {


                        "prayer": [

                            {

                                name:
                                    "prayer-list"

                            }

                        ],


                        "wifi": [

                            {

                                name:
                                    "wifi",

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


                    "weather-column": {


                        "weather": [

                            {

                                name:
                                    "weather",

                                config: {

                                    location:
                                        "Holden, MA"

                                }

                            }

                        ],


                        "placeholder": [

                            {

                                name:
                                    "placeholder"

                            }

                        ]

                    },


                    "menu-column": [

                        {

                            name:
                                "family-menu"

                        }

                    ]

                }

            }

        }

    },


    /*
     * ============================================================
     * LARGE CALENDAR
     * ============================================================
     */

    calendar: {

        layout:
            "large-calendar-layout",

        theme:
            "dark",

        duration: {

            seconds:
                60

        },


        regions: {


            "calendar-main": [

                {

                    name:
                        "large-calendar",

                    config: {

                        calendars: [

                            "family01156229611257150686@group.calendar.google.com",

                            "barry.dellecese@gmail.com",

                            "m1tj3sivp5mmipt3f5a0d164cifunqm4@import.calendar.google.com",

                            "natalie.dellecese@gmail.com",

                            "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com",

                            "james.dellecese@gmail.com",

                            "kkpcjqa95gv87cn0ojj5oi7s6o3h6195@import.calendar.google.com",

                            "isabella.c.dellecese@gmail.com",

                            "gvco5trj7a8eip611tr883v8jsbftad6@import.calendar.google.com",

                            "alexander.dellecese@gmail.com",

                            "878vjmvnrhp8soe4g89lmditinvg9tpm@import.calendar.google.com",

                            "theodore.dellecese@gmail.com",

                            "en.usa#holiday@group.v.calendar.google.com"

                        ],

                        showCalendarName:
                            false

                    }

                }

            ]

        }

    },


/*
 * ============================================================
 * CHORES + FUN
 * ============================================================
 */

"chores-fun": {

    layout:
        "chores-fun-layout",

    theme:
        "light",

    duration: {

        seconds:
            60

    },

    regions: {


        /*
         * ====================================================
         * FULL-WIDTH BANNER
         * ====================================================
         */

        "screen-banner": [

            {

                name:
                    "text",

                config: {

                    text:
                        "Hard work before play at 28 Patriot Way"

                }

            }

        ],


        /*
         * ====================================================
         * COLUMN 1
         *
         * Kids chores
         * ====================================================
         */

        "column-1": [

            {

                name:
                    "kids-chores"

            }

        ],


        /*
         * ====================================================
         * COLUMN 2
         *
         * Household chores
         * ====================================================
         */

        "column-2": [

            {

                name:
                    "household-chores"

            }

        ],


        /*
         * ====================================================
         * SCHOOL LUNCH
         *
         * Spans columns 1 + 2
         * ====================================================
         */

        "school-lunch": [

            {

                name:
                    "school-lunch"

            }

        ],


        /*
         * ====================================================
         * COLUMN 3
         * ====================================================
         */

        "column-3": [

            {

                name:
                    "playing-time"

            },

            {

                name:
                    "on-this-day"

            },

            {

                name:
                    "did-you-know"

            },


        ],


        /*
         * ====================================================
         * COLUMN 4
         * ====================================================
         */

        "column-4": [

            {

                name:
                    "word-of-day"

            },

            {

                name:
                    "quote-of-day"

            },

            {

                name:
                    "dad-wisdom"

            }
        ]

    }

},

/*
 * ============================================================
 * SPORTS
 * ============================================================
 */

sports: {

    layout:
        "sports-layout",

    theme:
        "dark",

    duration: {

        seconds:
            60

    },

    regions: {


        /*
         * ====================================================
         * SCOREBOARD
         * ====================================================
         */

        "scoreboard": [

            {

                name:
                    "sports-scoreboard",

                config: {

                    rotationSeconds:
                        20,

                    sports: [

                        {

                            sport:
                                "mlb",

                            team:
                                "boston-red-sox",

                            season: {

                                start:
                                    "03-01",

                                end:
                                    "10-31"

                            },

                            priority:
                                1,

                            featured: {

                                left: {

                                    teamId:
                                        111

                                },

                                right: {

                                    teamId:
                                        138

                                }

                            }

                        }

                    ]

                }

            }

        ],


        /*
         * ====================================================
         * STANDINGS
         * ====================================================
         */

        "standings": [

            {

                name:
                    "sports-standings",

                config: {

                    rotationSeconds:
                        20,

                    sports: [

                        "mlb"

                    ]

                }

            }

        ],


        /*
         * ====================================================
         * COLUMN 2
         *
         * Sports News
         * Upcoming Games
         * ====================================================
         */

        "column-2": [

            {

                name:
                    "news",

                config: {

                    feeds: [

                       "http://feeds.bbci.co.uk/sport/rss.xml",

                        "https://www.eyefootball.com/football_news.xml"

                    ],

                    label:
                        "SPORTS NEWS",

                    rotationSeconds:
                        30,

                    includeImage:
                        true
                }

            },

            {

                name:
                    "placeholder"

            }



        ],


        /*
         * ====================================================
         * COLUMN 3
         *
         * Photos
         * Future widget
         * ====================================================
         */

        "column-3": [

            {

                name:
                    "placeholder"

            },

                        {

                name:
                    "calendar-list",

                config: {

                    calendars: [

                        "146377806ee0218992f826b434d72b37455f216a16304399637f785714487d17@group.calendar.google.com"

                    ],

                    days:
                        7,

                    showCalendarName:
                        false

                }

            }


        ]

    }

}

};