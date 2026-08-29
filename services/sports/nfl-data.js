// ============================================================
// NFL DATA SERVICE
//
// Server-side NFL data retrieval and persistent caching.
//
// The browser should NEVER call the NFL API directly.
//
// Displayed data:
//
// # | LOGO + TEAM | W-L
//
// No PCT or GB data is required.
// ============================================================


import fs from "fs/promises";
import path from "path";


const NFL_API =
    "https://site.api.espn.com/apis/v2/sports/football/nfl";


const CACHE_DIR =
    path.resolve(
        process.cwd(),
        "data/sports/nfl"
    );


// ============================================================
// CACHE HELPERS
// ============================================================

async function ensureCacheDir() {

    await fs.mkdir(
        CACHE_DIR,
        {
            recursive: true
        }
    );

}


async function readCache(
    filename,
    maxAge
) {

    try {

        const filePath =
            path.join(
                CACHE_DIR,
                filename
            );


        const raw =
            await fs.readFile(
                filePath,
                "utf8"
            );


        const cached =
            JSON.parse(
                raw
            );


        const age =
            Date.now() -
            new Date(
                cached.cachedAt
            ).getTime();


        if (
            age > maxAge
        ) {

            return null;

        }


        return cached.data;

    }

    catch {

        return null;

    }

}


async function writeCache(
    filename,
    data
) {

    await ensureCacheDir();


    const filePath =
        path.join(
            CACHE_DIR,
            filename
        );


    await fs.writeFile(
        filePath,
        JSON.stringify(
            {
                cachedAt:
                    new Date().toISOString(),

                data
            },
            null,
            2
        )
    );

}


// ============================================================
// FETCH HELPER
// ============================================================

async function fetchJson(
    url
) {

    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `NFL API request failed: ${response.status} ${response.statusText}`
        );

    }


    return response.json();

}


// ============================================================
// NFL TEAM / DIVISION MAP
// ============================================================

const NFL_DIVISIONS = {

    AFC: {

        East: [
            "BUF",
            "MIA",
            "NE",
            "NYJ"
        ],

        North: [
            "BAL",
            "CIN",
            "CLE",
            "PIT"
        ],

        South: [
            "HOU",
            "IND",
            "JAX",
            "TEN"
        ],

        West: [
            "DEN",
            "KC",
            "LV",
            "LAC"
        ]

    },


    NFC: {

        East: [
            "DAL",
            "NYG",
            "PHI",
            "WSH"
        ],

        North: [
            "CHI",
            "DET",
            "GB",
            "MIN"
        ],

        South: [
            "ATL",
            "CAR",
            "NO",
            "TB"
        ],

        West: [
            "ARI",
            "LAR",
            "SF",
            "SEA"
        ]

    }

};


// ============================================================
// TEAM DIVISION LOOKUP
// ============================================================

function getTeamDivision(
    abbreviation
) {

    for (
        const conference of
        Object.keys(
            NFL_DIVISIONS
        )
    ) {

        for (
            const division of
            Object.keys(
                NFL_DIVISIONS[
                    conference
                ]
            )
        ) {

            if (
                NFL_DIVISIONS[
                    conference
                ][
                    division
                ].includes(
                    abbreviation
                )
            ) {

                return {

                    conference,
                    division

                };

            }

        }

    }


    return null;

}


// ============================================================
// STANDINGS
// ============================================================

async function getNFLStandings() {

    const season =
        new Date().getFullYear();


    const filename =
        `standings-${season}.json`;


    const cached =
        await readCache(
            filename,
            30 * 60 * 1000
        );


    if (
        cached
    ) {
        return cached;
    }

    const data =
        await fetchJson(
            `${NFL_API}/standings?season=${season}`
        );


    await writeCache(
        filename,
        data
    );


    return data;

}


// ============================================================
// NORMALIZE STANDINGS
// ============================================================
//
// Converts the ESPN response into the structure expected
// by the NFL standings widget.
//
// Returned structure:
//
// {
//     AFC: {
//         East: [],
//         North: [],
//         South: [],
//         West: []
//     },
//     NFC: {
//         East: [],
//         North: [],
//         South: [],
//         West: []
//     }
// }
//
// Each team contains:
//
// {
//     abbreviation,
//     name,
//     shortName,
//     logo,
//     wins,
//     losses
// }
//
// ============================================================

function normalizeStandings(
    data
) {

    const conferences = {

        AFC: {

            East: [],
            North: [],
            South: [],
            West: []

        },


        NFC: {

            East: [],
            North: [],
            South: [],
            West: []

        }

    };


    const groups =
        data.children ||
        [];


    for (
        const conferenceGroup of
        groups
    ) {

        const conferenceName =
            conferenceGroup.name ||
            conferenceGroup.abbreviation ||
            "";


        let conference =
            null;


        if (
            conferenceName
                .toUpperCase()
                .includes(
                    "AMERICAN"
                )
        ) {

            conference =
                "AFC";

        }


        else if (
            conferenceName
                .toUpperCase()
                .includes(
                    "NATIONAL"
                )
        ) {

            conference =
                "NFC";

        }


        else if (
            conferenceGroup.abbreviation ===
            "AFC"
        ) {

            conference =
                "AFC";

        }


        else if (
            conferenceGroup.abbreviation ===
            "NFC"
        ) {

            conference =
                "NFC";

        }


        if (
            !conference
        ) {

            console.warn(
                `NFL conference not recognized: ${conferenceName}`
            );


            continue;

        }


        const entries =
            conferenceGroup
                .standings
                ?.entries ||
            [];


        for (
            const entry of
            entries
        ) {

            const team =
                entry.team ||
                {};


            const abbreviation =
                team.abbreviation;


            if (
                !abbreviation
            ) {

                continue;

            }


            const location =
                getTeamDivision(
                    abbreviation
                );


            if (
                !location
            ) {

                console.warn(
                    `NFL division not found for ${abbreviation}`
                );


                continue;

            }


            const wins =
                entry.stats?.find(
                    stat =>
                        stat.name ===
                        "wins"
                )?.value ??
                0;


            const losses =
                entry.stats?.find(
                    stat =>
                        stat.name ===
                        "losses"
                )?.value ??
                0;


            conferences[
                location.conference
            ][
                location.division
            ].push({

                abbreviation,


                name:
                    team.displayName ||
                    team.name ||
                    abbreviation,


                shortName:
                    team.shortDisplayName ||
                    team.name ||
                    abbreviation,


                logo:
                    team.logos?.[0]?.href ||
                    null,


                wins,


                losses

            });

        }

    }


    // ========================================================
    // SORT EACH DIVISION
    // ========================================================
    //
    // Primary:
    //     Most wins
    //
    // Secondary:
    //     Fewest losses
    //
    // This keeps the standings presentation sensible without
    // carrying unnecessary PCT or GB data into the widget.
    //
    // ========================================================

    for (
        const conference of
        Object.keys(
            conferences
        )
    ) {

        for (
            const division of
            Object.keys(
                conferences[
                    conference
                ]
            )
        ) {

            conferences[
                conference
            ][
                division
            ].sort(
                (
                    a,
                    b
                ) => {

                    if (
                        b.wins !==
                        a.wins
                    ) {

                        return (
                            b.wins -
                            a.wins
                        );

                    }


                    if (
                        a.losses !==
                        b.losses
                    ) {

                        return (
                            a.losses -
                            b.losses
                        );

                    }


                    return (
                        a.abbreviation
                            .localeCompare(
                                b.abbreviation
                            )
                    );

                }
            );

        }

    }


    return conferences;

}


// ============================================================
// PUBLIC API
// ============================================================

export {

    getNFLStandings,

    normalizeStandings

};