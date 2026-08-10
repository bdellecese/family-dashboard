export const screenOrder = [
    "information"
];


export const screens = {

    information: {

        layout: "information-layout",

        theme: "dark",

        duration: {
            minutes: 20
        },


        regions: {

            /*
             * LEFT PANEL
             */

            "left-panel": [

                {
                    name: "date-time",

                    config: {

                        timezone:
                            "America/New_York",

                        color:
                            "rgba(255, 255, 255, 0.85)",


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


                {
                    name: "photos"
                },


                {
                    name: "message"
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
                                    "family01156229611257150686",
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

    }

};