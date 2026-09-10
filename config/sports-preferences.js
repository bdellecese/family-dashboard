export const sportsPreferences = {

    rotationSeconds: 30,

    sports: [

        {
            sport: "mlb",

            priority: 1,

            favoriteTeams: [
                "BOS",
                "STL"
            ],

            phases: [
                {
                    phase: "regularSeason",
                    start: "2026-03-25",
                    end: "2026-09-28"
                },
                {
                    phase: "postseason",
                    start: "2026-09-29",
                    end: "2026-11-07"
                },
                {
                    phase: "disabled",
                    start: "2026-11-08",
                    end: "2027-03-24"
                }
            ]
/*
            testDate: "2025-11-01",

            phases: [
                {
                    phase: "regularSeason",
                    start: "2025-03-25",
                    end: "2025-09-28"
                },
                {
                    phase: "postseason",
                    start: "2025-09-29",
                    end: "2025-11-07"
                },
                {
                    phase: "disabled",
                    start: "2025-11-08",
                    end: "2026-03-24"
                }
            ]
*/
        },

        {
            sport: "nfl",

            priority: 2,

            favoriteTeams: [
                "NE",
                "KC"
            ],

            phases: [
                {
                    phase: "regularSeason",
                    start: "2026-09-01",
                    end: "2027-01-11"
                },
                {
                    phase: "postseason",
                    start: "2027-01-12",
                    end: "2027-02-16"
                },
                {
                    phase: "disabled",
                    start: "2027-02-17",
                    end: "2027-08-31"
                }
            ]

        },

        {
            sport: "soccer",

            priority: 3,

//          testDate: "2026-09-06",

            favoriteTeams: [
                "inter-milan",
                "napoli",
                "manchester-city",
                "manchester-united",
                "barcelona",
                "real-madrid",
                "inter-miami",
                "new-england",
                "usmnt",
                "italy",
                "portugal"
            ],

            standings: {

                topTeams: 7,

                competitions: [

                    {
                        type: "league",
                        competition: "championsLeague",
                        displayName: "UEFA Champions League"
                    },

                    {
                        type: "league",
                        competition: "premierLeague",
                        displayName: "English Premier League"
                    },

                    {
                        type: "league",
                        competition: "serieA",
                        displayName: "Italian Serie A"
                    },

                    {
                        type: "league",
                        competition: "laLiga",
                        displayName: "Spanish La Liga"
                    },

                    {
                        type: "league",
                        competition: "primeiraLiga",
                        displayName: "Primeira Liga"
                    },

                    {
                        type: "league",
                        competition: "mls",
                        displayName: "MLS"
                    }

                ]

            },

            modes: {
                events: [
                    {
                        event: "euro",
                        displayName: "EURO",
                        start: "2028-06-09",
                        end: "2028-07-09"
                    },
                    {
                        event: "worldCup",
                        displayName: "WORLD CUP",
                        start: "2030-06-01",
                        end: "2030-07-31"
                    }
                ]
            }

        }

    ]

};