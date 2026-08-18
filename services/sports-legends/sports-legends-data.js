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
 *   - Equal-probability random selection
 *   - Full player pool
 *   - No family-score weighting
 *   - No hard-coded player limit
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
 * SHUFFLE
 * ============================================================
 *
 * Fisher-Yates shuffle.
 *
 * Every player has an equal probability of appearing
 * in every position in the resulting list.
 *
 * ============================================================
 */

function shuffle(
    legends
) {

    const shuffled =
        [
            ...legends
        ];


    for (
        let i = shuffled.length - 1;
        i > 0;
        i--
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                (
                    i + 1
                )
            );


        [
            shuffled[i],
            shuffled[randomIndex]
        ] =
        [
            shuffled[randomIndex],
            shuffled[i]
        ];

    }


    return shuffled;

}


/*
 * ============================================================
 * GET LEGENDS
 * ============================================================
 *
 * Returns the complete matching player pool in a
 * randomized order.
 *
 * There is intentionally NO maxLegends limit.
 *
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
     * NO LEGENDS AVAILABLE
     * ========================================================
 */

    if (
        filteredLegends.length === 0
    ) {

        return [];

    }


    /*
     * ========================================================
     * RANDOMIZE COMPLETE POOL
     * ========================================================
 */

    return shuffle(
        filteredLegends
    );

}


/*
 * ============================================================
 * RESET HISTORY
 * ============================================================
 *
 * Kept for compatibility with the existing service API.
 *
 * There is no history to reset because selection is now
 * handled entirely through random shuffling.
 *
 * ============================================================
 */

function resetHistory() {

    // Intentionally empty.

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