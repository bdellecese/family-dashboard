/*
 * ============================================================
 * SPORTS LEGENDS DATA SERVICE
 * ============================================================
 *
 * Provides randomized sports legends for the
 * Sports Legends widget.
 *
 * Supports:
 *
 *   - Multiple sports
 *   - Family-score weighting
 *   - Recent-player avoidance
 *   - Configurable result count
 *
 * ============================================================
 */


/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const DATA_URL =
    "/services/sports-legends/sports-legends-data.json";


const RECENT_HISTORY_SIZE =
    6;


/*
 * ============================================================
 * STATE
 * ============================================================
 */

let recentlyShown = [];


/*
 * ============================================================
 * LOAD DATA
 * ============================================================
 */

async function loadData() {

    const response =
        await fetch(
            DATA_URL
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Failed to load Sports Legends data: ${response.status}`
        );

    }


    const data =
        await response.json();


    if (
        !data ||
        !Array.isArray(
            data.legends
        )
    ) {

        throw new Error(
            "Sports Legends data file is invalid."
        );

    }


    return data.legends;

}


/*
 * ============================================================
 * WEIGHTED RANDOM
 * ============================================================
 *
 * Higher family scores make a player more likely to appear,
 * but do not guarantee selection.
 *
 * ============================================================
 */

function weightedRandom(
    legends
) {

    if (
        !legends ||
        legends.length === 0
    ) {

        return null;

    }


    const totalWeight =
        legends.reduce(
            (
                total,
                legend
            ) => {

                return (
                    total +
                    Math.max(
                        1,
                        Number(
                            legend.familyScore
                        ) || 1
                    )
                );

            },
            0
        );


    let random =
        Math.random() *
        totalWeight;


    for (
        const legend of legends
    ) {

        random -=
            Math.max(
                1,
                Number(
                    legend.familyScore
                ) || 1
            );


        if (
            random <= 0
        ) {

            return legend;

        }

    }


    return legends[
        legends.length - 1
    ];

}


/*
 * ============================================================
 * SELECT RANDOM LEGENDS
 * ============================================================
 */

function selectRandomLegends(
    legends,
    maxLegends
) {

    if (
        legends.length === 0
    ) {

        return [];

    }


    /*
     * ========================================================
     * REMOVE RECENTLY SHOWN
     * ========================================================
     */

    const recentIds =
        new Set(
            recentlyShown
        );


    const eligible =
        legends.filter(
            legend =>
                !recentIds.has(
                    legend.id
                )
        );


    /*
     * If we've exhausted the eligible pool,
     * fall back to the complete list.
     */

    const pool =
        eligible.length > 0
            ? [
                ...eligible
            ]
            : [
                ...legends
            ];


    /*
     * ========================================================
     * SELECT
     * ========================================================
     */

    const selected = [];


    while (
        selected.length <
            maxLegends &&
        pool.length > 0
    ) {

        const legend =
            weightedRandom(
                pool
            );


        if (
            !legend
        ) {

            break;

        }


        selected.push(
            legend
        );


        /*
         * Remove selected legend so it cannot
         * appear twice in the same request.
         */

        const index =
            pool.findIndex(
                item =>
                    item.id ===
                    legend.id
            );


        if (
            index !== -1
        ) {

            pool.splice(
                index,
                1
            );

        }

    }


    /*
     * ========================================================
     * UPDATE RECENT HISTORY
     * ========================================================
     */

    for (
        const legend of selected
    ) {

        recentlyShown.push(
            legend.id
        );

    }


    /*
     * Keep only the most recent IDs.
     */

    if (
        recentlyShown.length >
        RECENT_HISTORY_SIZE
    ) {

        recentlyShown =
            recentlyShown.slice(
                -RECENT_HISTORY_SIZE
            );

    }


    return selected;

}


/*
 * ============================================================
 * GET LEGENDS
 * ============================================================
 */

async function getLegends(
    config = {}
) {

    const legends =
        await loadData();


    /*
     * ========================================================
     * SPORTS FILTER
     * ========================================================
     */

    let filteredLegends =
        legends;


    if (
        Array.isArray(
            config.sports
        ) &&
        config.sports.length > 0
    ) {

        const requestedSports =
            new Set(
                config.sports.map(
                    sport =>
                        String(
                            sport
                        ).toUpperCase()
                )
            );


        filteredLegends =
            legends.filter(
                legend =>
                    requestedSports.has(
                        String(
                            legend.sport
                        ).toUpperCase()
                    )
            );

    }


    /*
     * ========================================================
     * RESULT COUNT
     * ========================================================
     */

    const maxLegends =
        Math.max(
            1,
            Number(
                config.maxLegends
            ) || 1
        );


    /*
     * ========================================================
     * SELECT
     * ========================================================
     */

    return selectRandomLegends(
        filteredLegends,
        maxLegends
    );

}


/*
 * ============================================================
 * RESET HISTORY
 * ============================================================
 */

function resetHistory() {

    recentlyShown = [];

}


/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

const sportsLegendsData = {

    getLegends,

    resetHistory

};


export default
    sportsLegendsData;