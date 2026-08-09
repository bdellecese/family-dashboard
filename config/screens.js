export const screens = {

    information: {

        layout: "information-layout",

        regions: {

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
                            format: "weekday-month-day",
                            size: 48,
                            weight: "normal"
                        },

                        alignment: "left"
                    }
                },

                { name: "photos" },
                { name: "message" }
            ],


            "right-panel": {

                "right-top": {

                    "calendar-dates": [
                        { name: "calendar-dates" }
                    ],

                    "right-top-content": {

                        "top-summary": [
                            { name: "calendar" },
                            { name: "news" }
                        ],

                        "countdown": [
                            { name: "countdown" }
                        ]

                    }

                },


                "right-bottom": {

                    "prayer-column": {

                        "prayer": [
                            { name: "prayer-list" }
                        ],

                        "wifi": [
                            { name: "wifi" }
                        ]

                    },


                    "weather-column": {

                        "weather": [
                            { name: "weather" }
                        ],

                        "weather-secondary": [
                            { name: "tbd" }
                        ]

                    },


                    "menu-column": [
                        { name: "family-menu" }
                    ]

                }

            }

        }

    }

};