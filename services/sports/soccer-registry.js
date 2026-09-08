export const soccerRegistry = {

    competitions: {

        premierLeague: {
            provider: "espn",
            slug: "eng.1"
        },

        serieA: {
            provider: "espn",
            slug: "ita.1"
        },

        laLiga: {
            provider: "espn",
            slug: "esp.1"
        },

        ligue1: {
            provider: "espn",
            slug: "fra.1"
        },

        bundesliga: {
            provider: "espn",
            slug: "ger.1"
        },

        primeiraLiga: {
            provider: "espn",
            slug: "por.1"
        },

        mls: {
            provider: "espn",
            slug: "usa.1"
        },

        fifaMen: {
            provider: "espn",
            slug: "fifa.world"
        }

    },

    teams: {

        "inter-milan": {
            provider: "espn",
            id: 110,
            competition: "serieA"
        },

        "napoli": {
            provider: "espn",
            id: 114,
            competition: "serieA"
        },

        "inter-miami": {
            provider: "espn",
            id: 20232,
            competition: "mls"
        },

        "new-england": {
            provider: "espn",
            id: 189,
            competition: "mls"
        },

        "manchester-city": {
            provider: "espn",
            id: 382,
            competition: "premierLeague"
        },

        "manchester-united": {
            provider: "espn",
            id: 360,
            competition: "premierLeague"
        },

        "barcelona": {
            provider: "espn",
            id: 83,
            competition: "laLiga"
        },

        "real-madrid": {
            provider: "espn",
            id: 86,
            competition: "laLiga"
        },

        "usmnt": {
            provider: "espn",
            id: 660
        },

        "italy": {
            provider: "espn",
            id: 162
        },

        "portugal": {
            provider: "espn",
            id: 482
        }

    }

};