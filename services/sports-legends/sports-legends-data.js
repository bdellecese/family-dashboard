/*
 * ============================================================
 * SPORTS LEGENDS DATA SERVICE
 * ============================================================
 *
 * Provides randomized sports legends with cycle-based
 * repeat avoidance.
 *
 * Selection behavior:
 *
 *   - Equal probability across all eligible players
 *   - No sport weighting
 *   - No family-score weighting
 *   - Players are not repeated until the entire current
 *     player pool has been displayed
 *   - Display history persists in localStorage
 *   - Adding players does NOT reset the current cycle
 *   - Removing players automatically removes them from history
 *   - Adding new sports requires no code changes
 *
 * ============================================================
 */

const DATA_URL =
    "/services/sports-legends/sports-legends-data.json";

const HISTORY_STORAGE_KEY =
    "sports-legends-cycle";

const HISTORY_VERSION =
    2;


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
 * RANDOM SELECTION
 * ============================================================
 */

function randomItem(
    items
) {

    const randomIndex =
        Math.floor(
            Math.random() *
            items.length
        );

    return items[randomIndex];

}


/*
 * ============================================================
 * CREATE POOL SIGNATURE
 * ============================================================
 *
 * Used for diagnostics/debugging.
 *
 * The signature is NOT used to reset history.
 *
 * ============================================================
 */

function createPoolSignature(
    legends
) {

    return legends
        .map(
            legend =>
                `${legend.id}:${String(legend.sport).toUpperCase()}`
        )
        .sort()
        .join("|");

}


/*
 * ============================================================
 * LOAD HISTORY
 * ============================================================
 */

function loadHistory() {

    try {

        const stored =
            localStorage.getItem(
                HISTORY_STORAGE_KEY
            );

        if (
            !stored
        ) {

            return null;

        }

        const history =
            JSON.parse(
                stored
            );

        if (
            !history ||
            typeof history !== "object"
        ) {

            return null;

        }

        if (
            history.version !== HISTORY_VERSION
        ) {

            return null;

        }

        if (
            !Array.isArray(
                history.displayed
            )
        ) {

            return null;

        }

        return history;

    }

    catch (
        error
    ) {

        console.warn(
            "Sports Legends history could not be loaded. Starting a new cycle.",
            error
        );

        return null;

    }

}


/*
 * ============================================================
 * SAVE HISTORY
 * ============================================================
 */

function saveHistory(
    history
) {

    try {

        localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(
                history
            )
        );

    }

    catch (
        error
    ) {

        console.warn(
            "Sports Legends history could not be saved.",
            error
        );

    }

}


/*
 * ============================================================
 * CREATE NEW HISTORY
 * ============================================================
 */

function createHistory(
    poolSignature
) {

    return {

        version:
            HISTORY_VERSION,

        poolSignature,

        displayed: []

    };

}


/*
 * ============================================================
 * RECONCILE HISTORY
 * ============================================================
 *
 * Keeps valid existing history while adapting to changes
 * in the player pool.
 *
 * Examples:
 *
 *   Add a player:
 *       Existing history is preserved.
 *       New player becomes immediately eligible.
 *
 *   Remove a player:
 *       Removed player's history entry disappears.
 *
 *   Add a new sport:
 *       New players are immediately eligible.
 *
 * ============================================================
 */

function reconcileHistory(
    history,
    legends,
    poolSignature
) {

    if (
        !history
    ) {

        return createHistory(
            poolSignature
        );

    }

    const validIds =
        new Set(
            legends.map(
                legend =>
                    legend.id
            )
        );

    const validDisplayed =
        history.displayed.filter(
            id =>
                validIds.has(
                    id
                )
        );

    return {

        version:
            HISTORY_VERSION,

        poolSignature,

        displayed:
            validDisplayed

    };

}


/*
 * ============================================================
 * GET NEXT LEGEND
 * ============================================================
 */

async function getNextLegend(
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

        return null;

    }


    /*
     * ========================================================
     * POOL SIGNATURE
     * ========================================================
     */

    const poolSignature =
        createPoolSignature(
            filteredLegends
        );


    /*
     * ========================================================
     * LOAD + RECONCILE HISTORY
     * ========================================================
     */

    let history =
        loadHistory();

    history =
        reconcileHistory(
            history,
            filteredLegends,
            poolSignature
        );


    /*
     * ========================================================
     * DETERMINE REMAINING PLAYERS
     * ========================================================
     */

    const displayedIds =
        new Set(
            history.displayed
        );

    let remainingLegends =
        filteredLegends.filter(
            legend =>
                !displayedIds.has(
                    legend.id
                )
        );


    /*
     * ========================================================
     * CYCLE COMPLETE
     * ========================================================
     *
     * Everyone currently in the pool has appeared.
     *
     * Start a completely new cycle.
     *
     * ========================================================
     */

    if (
        remainingLegends.length === 0
    ) {

        history =
            createHistory(
                poolSignature
            );

        remainingLegends =
            filteredLegends;

    }


    /*
     * ========================================================
     * RANDOM SELECTION
     * ========================================================
     */

    const selectedLegend =
        randomItem(
            remainingLegends
        );


    /*
     * ========================================================
     * RECORD SELECTION
     * ========================================================
 */

    history.displayed.push(
        selectedLegend.id
    );


    /*
     * ========================================================
     * UPDATE SIGNATURE
     * ========================================================
     */

    history.poolSignature =
        poolSignature;


    /*
     * ========================================================
     * SAVE
     * ========================================================
 */

    saveHistory(
        history
    );


    /*
     * ========================================================
     * RETURN
     * ========================================================
 */

    return selectedLegend;

}


/*
 * ============================================================
 * RESET HISTORY
 * ============================================================
 */

function resetHistory() {

    try {

        localStorage.removeItem(
            HISTORY_STORAGE_KEY
        );

    }

    catch (
        error
    ) {

        console.warn(
            "Sports Legends history could not be reset.",
            error
        );

    }

}


/*
 * ============================================================
 * GET HISTORY
 * ============================================================
 */

function getHistory() {

    return loadHistory();

}


/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

const sportsLegendsData = {

    getNextLegend,

    resetHistory,

    getHistory

};


export default
    sportsLegendsData;