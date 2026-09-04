/*
 * ============================================================
 * SPORTS SCOREBOARD
 *
 * Orchestrates sport-specific scoreboards.
 *
 * Responsibilities:
 * - Determine which sports are currently in season
 * - Order active sports by priority
 * - Rotate between active sports
 * - Apply sport-specific styling
 * - Pass sport configuration to the sport implementation
 *
 * Sport-specific logic belongs in the individual widgets.
 * ============================================================
 */

import mlbScoreboard
    from "./mlb/mlb-scoreboard.js";

import nflScoreboard
    from "./nfl/nfl-scoreboard.js";

import {
    sportsPreferences
} from "../../config/sports-preferences.js";


const SPORT_IMPLEMENTATIONS = {

    mlb:
        mlbScoreboard,

    nfl:
        nflScoreboard

};


let activeTimers =
    new Map();


function getTodayDate(
    testDate
) {

    const now =
        testDate
            ? new Date(
                `${testDate}T12:00:00`
            )
            : new Date();

    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function getSportPhase(
    sport,
    date
) {

    const phases =
        sport.phases || [];


    /*
     * --------------------------------------------------------
     * No phase configuration
     *
     * A sport without explicit phases is disabled.
     * --------------------------------------------------------
     */

    if (
        phases.length === 0
    ) {

        return "disabled";

    }


    const phase =
        phases.find(
            phase =>
                date >= phase.start &&
                date <= phase.end
        );


    return (
        phase?.phase ||
        "disabled"
    );

}

function getActiveSports() {

    const sports =
        sportsPreferences.sports || [];


    return sports

        .map(
            sport => {

                const today =
                    getTodayDate(
                        sport.testDate
                    );


                const currentPhase =
                    getSportPhase(
                        sport,
                        today
                    );


                return {

                    ...sport,

                    currentPhase

                };

            }
        )

        .filter(
            sport =>
                sport.currentPhase !==
                "disabled"
        )

        .filter(
            sport =>
                SPORT_IMPLEMENTATIONS[
                    sport.sport
                ]
        )

        .sort(
            (
                a,
                b
            ) =>
                (
                    a.priority ?? 999
                )
                -
                (
                    b.priority ?? 999
                )
        );

}


function clearTimers(
    container
) {

    const timer =
        activeTimers.get(
            container
        );


    if (
        timer
    ) {

        clearInterval(
            timer
        );


        activeTimers.delete(
            container
        );

    }

}


async function renderSport(
    container,
    sportConfig
) {

    const implementation =
        SPORT_IMPLEMENTATIONS[
            sportConfig.sport
        ];


    if (
        !implementation
    ) {

        return;

    }


    /*
     * --------------------------------------------------------
     * UPDATE SPORT THEME
     * --------------------------------------------------------
     */

    container.classList.remove(
        "sports-scoreboard__sport--mlb",
        "sports-scoreboard__sport--nfl"
    );


    container.classList.add(
        `sports-scoreboard__sport--${sportConfig.sport}`
    );


    /*
     * --------------------------------------------------------
     * RENDER SPORT
     *
     * Pass the complete sport configuration through.
     *
     * Example:
     *
     * {
     *     sport: "mlb",
     *     priority: 1,
     *     favoriteTeams: ["BOS", "STL"],
     *     phases: [...],
     *     currentPhase: "regularSeason"
     * }
     *
     * The sport implementation decides how to use it.
     * --------------------------------------------------------
     */

    container.innerHTML =
        "";


    await implementation.render(
        container,
        sportConfig
    );

}


export default {

    async render(
        container,
        config = {}
    ) {

        /*
         * ----------------------------------------------------
         * CLEAN UP ANY EXISTING ROTATION
         * ----------------------------------------------------
         */

        clearTimers(
            container
        );


        container.innerHTML =
            "";


        container.classList.add(
            "sports-scoreboard"
        );


        /*
         * ----------------------------------------------------
         * GET ACTIVE SPORTS
         * ----------------------------------------------------
         */

        const activeSports =
            getActiveSports();

        /*
         * ----------------------------------------------------
         * NO ACTIVE SPORTS
         * ----------------------------------------------------
         */

        if (
            activeSports.length === 0
        ) {

            container.innerHTML = `
                <div class="sports-scoreboard__empty">
                    NO SPORTS IN SEASON
                </div>
            `;


            return;

        }


        /*
         * ----------------------------------------------------
         * RENDER FIRST SPORT
         * ----------------------------------------------------
         */

        let currentIndex =
            0;


        await renderSport(
            container,
            activeSports[
                currentIndex
            ]
        );


        /*
         * ----------------------------------------------------
         * ROTATE BETWEEN SPORTS
         * ----------------------------------------------------
         */

        if (
            activeSports.length > 1
        ) {

            const rotationSeconds =
                Number(
                    sportsPreferences.rotationSeconds
                ) || 30;


            const timer =
                setInterval(
                    async () => {

                        currentIndex =
                            (
                                currentIndex +
                                1
                            )
                            %
                            activeSports.length;


                        await renderSport(
                            container,
                            activeSports[
                                currentIndex
                            ]
                        );

                    },
                    rotationSeconds *
                    1000
                );


            activeTimers.set(
                container,
                timer
            );

        }

    },


    async destroy(
        container
    ) {

        clearTimers(
            container
        );


        container.innerHTML =
            "";

    }

};