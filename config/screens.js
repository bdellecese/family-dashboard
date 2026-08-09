export const screenOrder = [
    "information"
];


export const screens = {

    information: {

        layout: "information-layout",

        theme: "dark",

        duration: { minutes: 2 },

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
                            {
                                name: "wifi",
                                config: {
                                    image: "https://cdn11.bigcommerce.com/s-wld7mb6jpw/images/stencil/1280x1280/products/755/904/61ktCJKmTGL._AC_SL1500___54216.1723046252.jpg?c=1",
                                    ssid: "YOUR_GUEST_SSID",
                                    password: "YOUR_GUEST_PASSWORD",
                                    security: "WPA"
                                }
                            }
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