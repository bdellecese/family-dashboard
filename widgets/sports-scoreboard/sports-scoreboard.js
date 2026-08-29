/*
 * ============================================================
 * SPORTS SCOREBOARD
 *
 * Orchestrates sport-specific scoreboards.
 * ============================================================
 */

import mlbScoreboard
    from "./mlb/mlb-scoreboard.js";

import nflScoreboard
    from "./nfl/nfl-scoreboard.js";


const SPORT_IMPLEMENTATIONS = {

    mlb:
        mlbScoreboard,

    nfl:
        nflScoreboard

};

let activeTimers =
    new Map();


function getTodayMonthDay() {

    const now =
        new Date();


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


    return `${month}-${day}`;

}


function isSeasonActive(
    season,
    monthDay
) {

    if (
        !season?.start ||
        !season?.end
    ) {

        return true;

    }


    const start =
        season.start;


    const end =
        season.end;


    /*
     * Normal season:
     *
     * 03-01 → 10-31
     */

    if (
        start <= end
    ) {

        return (
            monthDay >= start &&
            monthDay <= end
        );

    }


    /*
     * Cross-year season:
     *
     * 08-01 → 02-15
     */

    return (
        monthDay >= start ||
        monthDay <= end
    );

}


function getActiveSports(
    config
) {

    const sports =
        config.sports || [];


    const monthDay =
        getTodayMonthDay();


    return sports
        .filter(
            sport =>
                isSeasonActive(
                    sport.season,
                    monthDay
                )
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
     *
     * Remove any previously active sport theme before adding
     * the theme for the sport currently being rendered.
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

        clearTimers(
            container
        );


        container.innerHTML =
            "";


        container.classList.add(
            "sports-scoreboard"
        );


        const activeSports =
            getActiveSports(
                config
            );


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


        let currentIndex =
            0;


        await renderSport(
            container,
            activeSports[
                currentIndex
            ]
        );


        if (
            activeSports.length > 1
        ) {

            const rotationSeconds =
                config.rotationSeconds ||
                20;


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