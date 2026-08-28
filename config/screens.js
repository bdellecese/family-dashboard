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
             * ====================================================
             * RIGHT PANEL
             * ====================================================
             */

            "right-panel": {


                /*
                 * ==================================================
                 * TOP RIGHT
                 * ==================================================
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
                 * ==================================================
                 * RIGHT BOTTOM
                 * ==================================================
                 */

                "right-bottom": {


                    /*
                     * =================================================
                     * PRAYER + WIFI
                     * =================================================
                     */

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


                    /*
                     * =================================================
                     * WEATHER + SONOS
                     * =================================================
                     */

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


                        "sonos-status": [

                            {

                                name:
                                    "sonos-status",

                                config: {

                                    speaker:
                                        "Kitchen",

                                    refreshInterval:
                                        10000

                                }

                            }

                        ]

                    },


                    /*
                     * =================================================
                     * FAMILY MENU + COMMUTE
                     * =================================================
                     */


                    "menu-column": {

                        "menu": [

                            {

                                name:
                                    "family-menu"

                            }

                        ],


                        "commute": [

                            {

                                name:
                                    "commute"

                            }

                        ]

                    }

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

                            "family01156229611257150686@group.calendar.google.com", /* Family */

                            "barry.dellecese@gmail.com",

                            "m1tj3sivp5mmipt3f5a0d164cifunqm4@import.calendar.google.com", /* Barry TripIt */

                            "natalie.dellecese@gmail.com",

                            "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com", /* TSC */

                            "james.dellecese@gmail.com",

                            "kkpcjqa95gv87cn0ojj5oi7s6o3h6195@import.calendar.google.com", /* WU U16 */

                            "isabella.c.dellecese@gmail.com",

                            "snu45s689m3sm81dga137mebkmuraoq0@import.calendar.google.com", /* WU Softball - GC */

                            "gvco5trj7a8eip611tr883v8jsbftad6@import.calendar.google.com", /* WU Softball - Energy Athletics */

                            "h9b6sa72im49g27qv0hc09ofird2bm27@import.calendar.google.com", /* Fall softball */

                            "alexander.dellecese@gmail.com",

                            "878vjmvnrhp8soe4g89lmditinvg9tpm@import.calendar.google.com", /* WU U10 */

                            "theodore.dellecese@gmail.com",

                            "en.usa#holiday@group.v.calendar.google.com" /* US Holidays */

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

                }

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
                            "Sports News",

                        rotationSeconds:
                            30,

                        includeImage:
                            true

                    }

                },

                {

                    name:
                        "sports-trivia"

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
                        "sports-legends",

                    config: {

                        sports: [
                            "MLB",
                            "NBA",
                            "NFL",
                            "Soccer"
                        ],

                        maxLegends:
                            5,

                        rotationSeconds:
                            30
                    }

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