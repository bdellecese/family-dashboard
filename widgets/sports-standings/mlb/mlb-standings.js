/*
 * ============================================================
 * MLB STANDINGS
 *
 * MLB-specific standings renderer.
 *
 * Layout:
 *
 * AL EAST       AL CENTRAL       AL WEST       AL WILD CARD
 * NL EAST       NL CENTRAL       NL WEST       NL WILD CARD
 *
 * ============================================================
 */


const MLB_API =
    "https://statsapi.mlb.com/api/v1";


const DIVISIONS = {

    AL: [

        {
            id: 201,
            name: "AL EAST"
        },

        {
            id: 202,
            name: "AL CENTRAL"
        },

        {
            id: 200,
            name: "AL WEST"
        }

    ],

    NL: [

        {
            id: 204,
            name: "NL EAST"
        },

        {
            id: 205,
            name: "NL CENTRAL"
        },

        {
            id: 203,
            name: "NL WEST"
        }

    ]

};


const LEAGUE_IDS = {

    AL: 103,

    NL: 104

};


/*
 * ============================================================
 * HELPERS
 * ============================================================
 */


function getCurrentSeason() {

    return new Date()
        .getFullYear();

}


function createElement(
    tag,
    className,
    text = ""
) {

    const element =
        document.createElement(
            tag
        );


    if (className) {

        element.className =
            className;

    }


    if (text !== "") {

        element.textContent =
            text;

    }


    return element;

}


/*
 * ============================================================
 * TEAM NAME
 * ============================================================
 */

function getTeamName(
    record
) {

    const team =
        record.team || {};


    return (
        team.abbreviation ||
        team.teamName ||
        team.name ||
        "???"
    );

}


/*
 * ============================================================
 * LAST 10
 * ============================================================
 */

function getLastTen(
    record
) {

    if (
        record.lastTen &&
        record.lastTen.wins !== undefined &&
        record.lastTen.losses !== undefined
    ) {

        return (
            `${record.lastTen.wins}-${record.lastTen.losses}`
        );

    }


    const splitRecords =
        record.records
            ?.splitRecords || [];


    const lastTen =
        splitRecords.find(
            item =>
                item.type === "lastTen"
        );


    if (!lastTen) {

        return "—";

    }


    return (
        `${lastTen.wins}-${lastTen.losses}`
    );

}


/*
 * ============================================================
 * WINNING PERCENTAGE
 * ============================================================
 */

function getWinningPercentage(
    record
) {

    const wins =
        record.wins ?? 0;


    const losses =
        record.losses ?? 0;


    const games =
        wins +
        losses;


    if (
        games === 0
    ) {

        return 0;

    }


    return (
        wins /
        games
    );

}


/*
 * ============================================================
 * FORMAT GAMES BACK
 * ============================================================
 *
 * Standard formatting:
 *
 * 0       → —
 * 0.5     → 0.5
 * 1       → 1
 * 1.5     → 1.5
 *
 * ============================================================
 */

function formatGamesBack(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }


    if (
        value === "-"
    ) {

        return "—";

    }


    const numeric =
        Number(
            value
        );


    if (
        Number.isNaN(numeric)
    ) {

        return String(
            value
        );

    }


    if (
        numeric === 0
    ) {

        return "—";

    }


    return (
        numeric % 1 === 0
            ? numeric.toString()
            : numeric.toFixed(1)
    );

}


/*
 * ============================================================
 * CALCULATE GAMES DIFFERENCE
 * ============================================================
 *
 * Returns how many games record A is ahead of record B.
 *
 * Positive value = A is ahead
 * Negative value = A is behind
 *
 * ============================================================
 */

function calculateGamesDifference(
    recordA,
    recordB
) {

    const winsDifference =
        (
            recordA.wins ?? 0
        ) -
        (
            recordB.wins ?? 0
        );


    const lossesDifference =
        (
            recordB.losses ?? 0
        ) -
        (
            recordA.losses ?? 0
        );


    return (
        winsDifference +
        lossesDifference
    ) / 2;

}


/*
 * ============================================================
 * DIVISION GAMES BACK
 * ============================================================
 */

function getDivisionGamesBack(
    record,
    leader
) {

    if (!leader) {

        return "—";

    }


    const gamesBack =
        calculateGamesDifference(
            leader,
            record
        );


    if (
        gamesBack === 0
    ) {

        return "—";

    }


    return formatGamesBack(
        gamesBack
    );

}

/*
 * ============================================================
 * WILD CARD GAMES BACK
 * ============================================================
 *
 * Use MLB's official wildCardGamesBack value directly.
 *
 * MLB defines this relative to the THIRD Wild Card team,
 * which is the playoff cutoff.
 *
 * Examples:
 *
 * NYY  +7.5
 * BOS  +5.5
 * TEX     -
 * TOR   0.5
 * BAL   0.5
 *
 * NL:
 *
 * CHC    +6
 * PHI      -
 * ARI      -
 * SD       -
 * MIA      3
 *
 * IMPORTANT:
 *
 * Do NOT calculate this ourselves.
 * The MLB API already provides the correct value.
 *
 * ============================================================
 */

function getWildCardGamesBack(
    record
) {

    /*
     * Primary MLB API field.
     */

    if (
        record.wildCardGamesBack !== undefined &&
        record.wildCardGamesBack !== null
    ) {

        const value =
            record.wildCardGamesBack;


        /*
         * MLB returns "+" already for teams ahead
         * of the Wild Card cutoff.
         *
         * Preserve it.
         */

        if (
            typeof value === "string" &&
            value.startsWith("+")
        ) {

            return value;

        }


        /*
         * Standard numeric values.
         */

        return formatGamesBack(
            value
        );

    }


    /*
     * Defensive fallback.
     */

    if (
        record.wildCard &&
        record.wildCard.gamesBack !== undefined
    ) {

        return formatGamesBack(
            record.wildCard.gamesBack
        );

    }


    return "—";

}


/*
 * ============================================================
 * HEADER
 * ============================================================
 */

function createHeader() {

    const header =
        createElement(
            "div",
            "mlb-standings-columns"
        );


    header.innerHTML = `
        <span>#</span>
        <span>TEAM</span>
        <span>W-L</span>
        <span>GB</span>
        <span>L10</span>
    `;


    return header;

}


/*
 * ============================================================
 * TEAM ROW
 * ============================================================
 */

function createTeamRow(
    record,
    rank,
    gamesBack = "—"
) {

    const row =
        createElement(
            "div",
            "mlb-standings-team"
        );


    const wins =
        record.wins ??
        0;


    const losses =
        record.losses ??
        0;


    row.innerHTML = `
        <span class="mlb-standings-rank">
            ${rank}
        </span>

        <span class="mlb-standings-team-name">
            ${getTeamName(record)}
        </span>

        <span class="mlb-standings-record">
            ${wins}-${losses}
        </span>

        <span class="mlb-standings-games-back">
            ${gamesBack}
        </span>

        <span class="mlb-standings-last10">
            ${getLastTen(record)}
        </span>
    `;


    return row;

}


/*
 * ============================================================
 * SORT DIVISION RECORDS
 * ============================================================
 */

function sortDivisionRecords(
    records
) {

    return [...records]
        .sort(
            (
                a,
                b
            ) => {

                const aRank =
                    Number(
                        a.divisionRank
                    );


                const bRank =
                    Number(
                        b.divisionRank
                    );


                if (
                    !Number.isNaN(aRank) &&
                    !Number.isNaN(bRank) &&
                    aRank !== bRank
                ) {

                    return (
                        aRank -
                        bRank
                    );

                }


                const aPct =
                    getWinningPercentage(
                        a
                    );


                const bPct =
                    getWinningPercentage(
                        b
                    );


                if (
                    bPct !== aPct
                ) {

                    return (
                        bPct -
                        aPct
                    );

                }


                return (
                    (b.wins ?? 0) -
                    (a.wins ?? 0)
                );

            }
        );

}


/*
 * ============================================================
 * CREATE DIVISION
 * ============================================================
 */

function createDivision(
    division,
    records
) {

    const section =
        createElement(
            "section",
            "mlb-standings-division"
        );


    const title =
        createElement(
            "div",
            "mlb-standings-division-title",
            division.name
        );


    section.appendChild(
        title
    );


    section.appendChild(
        createHeader()
    );


    const sorted =
        sortDivisionRecords(
            records
        );


    const leader =
        sorted[0] || null;


    sorted.forEach(
        (
            record,
            index
        ) => {

            const gamesBack =
                getDivisionGamesBack(
                    record,
                    leader
                );


            section.appendChild(
                createTeamRow(
                    record,
                    index + 1,
                    gamesBack
                )
            );

        }
    );


    return section;

}


/*
 * ============================================================
 * LOAD REGULAR SEASON STANDINGS
 * ============================================================
 */

async function loadStandings() {

    const season =
        getCurrentSeason();


    const url =
        `${MLB_API}/standings?` +
        `leagueId=103,104&` +
        `season=${season}&` +
        `standingsTypes=regularSeason&` +
        `hydrate=team,division,league`;


    console.log(
        "Loading MLB regular-season standings:",
        url
    );


    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `MLB standings request failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    const teamRecords = [];


    for (
        const divisionRecord
        of data.records || []
    ) {

        for (
            const teamRecord
            of divisionRecord.teamRecords || []
        ) {

            teamRecords.push(
                teamRecord
            );

        }

    }


    /*
     * Remove duplicate teams.
     */

    const uniqueTeams =
        Array.from(
            new Map(
                teamRecords.map(
                    record => [
                        record.team?.id,
                        record
                    ]
                )
            ).values()
        );


    console.log(
        "MLB unique regular-season team count:",
        uniqueTeams.length
    );


    return uniqueTeams;

}


/*
 * ============================================================
 * LOAD WILD CARD STANDINGS
 * ============================================================
 *
 * We still load the official Wild Card endpoint because it
 * provides the official Wild Card ordering.
 *
 * We do NOT use wildCardGamesBack for display.
 *
 * ============================================================
 */

async function loadWildCardStandings() {

    const season =
        getCurrentSeason();


    const url =
        `${MLB_API}/standings?` +
        `leagueId=103,104&` +
        `season=${season}&` +
        `standingsTypes=wildCard&` +
        `hydrate=team,division,league`;


    console.log(
        "Loading MLB Wild Card standings:",
        url
    );


    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `MLB Wild Card standings request failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    const teamRecords = [];


    for (
        const standingsRecord
        of data.records || []
    ) {

        for (
            const teamRecord
            of standingsRecord.teamRecords || []
        ) {

            teamRecords.push(
                teamRecord
            );

        }

    }


    /*
     * Remove duplicates by team ID.
     */

    const uniqueTeams =
        Array.from(
            new Map(
                teamRecords.map(
                    record => [
                        record.team?.id,
                        record
                    ]
                )
            ).values()
        );


    console.log(
        "MLB unique Wild Card team count:",
        uniqueTeams.length
    );


    return uniqueTeams;

}


/*
 * ============================================================
 * FILTER DIVISION RECORDS
 * ============================================================
 */

function getDivisionRecords(
    records,
    divisionId
) {

    return records.filter(
        record =>
            record.team
                ?.division
                ?.id === divisionId
    );

}


/*
 * ============================================================
 * FILTER LEAGUE RECORDS
 * ============================================================
 */

function getLeagueRecords(
    records,
    leagueId
) {

    return records.filter(
        record =>
            record.team
                ?.league
                ?.id === leagueId
    );

}


/*
 * ============================================================
 * SORT WILD CARD RECORDS
 * ============================================================
 *
 * Official Wild Card ordering:
 *
 * 1. Wild Card rank
 * 2. Winning percentage
 * 3. Wins
 *
 * ============================================================
 */

function sortWildCardRecords(
    records
) {

    return [...records]
        .sort(
            (
                a,
                b
            ) => {

                const aRank =
                    Number(
                        a.wildCardRank
                    );


                const bRank =
                    Number(
                        b.wildCardRank
                    );


                if (
                    !Number.isNaN(aRank) &&
                    !Number.isNaN(bRank) &&
                    aRank !== bRank
                ) {

                    return (
                        aRank -
                        bRank
                    );

                }


                const aPct =
                    getWinningPercentage(
                        a
                    );


                const bPct =
                    getWinningPercentage(
                        b
                    );


                if (
                    bPct !== aPct
                ) {

                    return (
                        bPct -
                        aPct
                    );

                }


                return (
                    (b.wins ?? 0) -
                    (a.wins ?? 0)
                );

            }
        );

}


/*
 * ============================================================
 * CREATE WILD CARD
 * ============================================================
 *
 * The Wild Card panel displays:
 *
 *   1. Division leaders
 *   2. Wild Card teams
 *
 * GB is calculated relative to the best non-division-leading
 * team.
 *
 * Example:
 *
 * AL:
 *
 * NYY   +7.5
 * BOS   +5.5
 * TEX   —
 * TOR    0.5
 * BAL    0.5
 *
 * NL:
 *
 * CHC   +6
 * PHI   —
 * ARI   —
 * SD    —
 * MIA    3
 *
 * ============================================================
 */

function createWildCard(
    leagueName,
    records
) {

    const section =
        createElement(
            "section",
            "mlb-standings-division mlb-standings-wild-card"
        );


    const title =
        createElement(
            "div",
            "mlb-standings-division-title",
            `${leagueName} WILD CARD`
        );


    section.appendChild(
        title
    );


    section.appendChild(
        createHeader()
    );


    /*
     * Filter to league.
     */

    const leagueId =
        LEAGUE_IDS[
            leagueName
        ];


    const leagueRecords =
        records.filter(
            record =>
                record.team
                    ?.league
                    ?.id === leagueId
        );


    /*
     * Sort using official Wild Card rank.
     */

    const sorted =
        sortWildCardRecords(
            leagueRecords
        );


    /*
     * Identify division leaders.
     */

    const divisionLeaders =
        sorted.filter(
            record =>
                Number(
                    record.divisionRank
                ) === 1
        );


    /*
     * Identify the best non-division-leading team.
     *
     * This is the Wild Card reference team.
     */

    const wildCardLeader =
        sorted.find(
            record =>
                Number(
                    record.divisionRank
                ) !== 1
        ) || null;


    /*
     * Display the top five teams from the official
     * Wild Card standings.
     */

    sorted
        .slice(
            0,
            5
        )
        .forEach(
            (
                record,
                index
            ) => {

                const gamesBack =
                    getWildCardGamesBack(
                        record,
                        wildCardLeader
                    );


                const row =
                    createTeamRow(
                        record,
                        index + 1,
                        gamesBack
                    );


                /*
                 * Division leader styling.
                 */

                if (
                    Number(
                        record.divisionRank
                    ) === 1
                ) {

                    row.classList.add(
                        "mlb-standings-division-leader"
                    );

                }


                /*
                 * Wild Card leader styling.
                 */

                if (
                    record.team?.id ===
                    wildCardLeader?.team?.id
                ) {

                    row.classList.add(
                        "mlb-standings-wild-card-leader"
                    );

                }


                section.appendChild(
                    row
                );

            }
        );


    return section;

}


/*
 * ============================================================
 * CREATE COMPLETE 4 × 2 LAYOUT
 * ============================================================
 */

function createLayout(
    regularSeasonRecords,
    wildCardRecords
) {

    const grid =
        createElement(
            "div",
            "mlb-standings-grid"
        );


    /*
     * ========================================================
     * TOP ROW — AMERICAN LEAGUE
     * ========================================================
     */

    DIVISIONS.AL.forEach(
        division => {

            const divisionRecords =
                getDivisionRecords(
                    regularSeasonRecords,
                    division.id
                );


            grid.appendChild(
                createDivision(
                    division,
                    divisionRecords
                )
            );

        }
    );


    const alWildCardRecords =
        getLeagueRecords(
            wildCardRecords,
            LEAGUE_IDS.AL
        );


    grid.appendChild(
        createWildCard(
            "AL",
            alWildCardRecords
        )
    );


    /*
     * ========================================================
     * BOTTOM ROW — NATIONAL LEAGUE
     * ========================================================
     */

    DIVISIONS.NL.forEach(
        division => {

            const divisionRecords =
                getDivisionRecords(
                    regularSeasonRecords,
                    division.id
                );


            grid.appendChild(
                createDivision(
                    division,
                    divisionRecords
                )
            );

        }
    );


    const nlWildCardRecords =
        getLeagueRecords(
            wildCardRecords,
            LEAGUE_IDS.NL
        );


    grid.appendChild(
        createWildCard(
            "NL",
            nlWildCardRecords
        )
    );


    return grid;

}


/*
 * ============================================================
 * WIDGET
 * ============================================================
 */

export default {

    async render(
        container,
        config = {}
    ) {

        container.innerHTML =
            "";


        container.classList.add(
            "sports-standings__sport",
            "sports-standings__sport--mlb"
        );


        const root =
            createElement(
                "div",
                "mlb-standings"
            );


        root.innerHTML = `
            <header class="mlb-standings-header">

                <div class="mlb-standings-title">
                    MLB STANDINGS
                </div>

                <div class="mlb-standings-date">
                    ${getCurrentSeason()} SEASON
                </div>

            </header>

            <main class="mlb-standings-main">

                <div class="mlb-standings-loading">
                    LOADING STANDINGS...
                </div>

            </main>
        `;


        container.appendChild(
            root
        );


        const main =
            root.querySelector(
                ".mlb-standings-main"
            );


        try {

            /*
             * Load both datasets in parallel.
             */

            const [
                regularSeasonRecords,
                wildCardRecords
            ] =
                await Promise.all(
                    [
                        loadStandings(),
                        loadWildCardStandings()
                    ]
                );


            console.log(
                "MLB regular-season records:",
                regularSeasonRecords
            );


            console.log(
                "MLB Wild Card records:",
                wildCardRecords
            );


            main.innerHTML =
                "";


            if (
                regularSeasonRecords.length === 0
            ) {

                main.innerHTML =
                    `
                    <div class="mlb-standings-message">
                        NO STANDINGS AVAILABLE
                    </div>
                    `;

                return;

            }


            main.appendChild(
                createLayout(
                    regularSeasonRecords,
                    wildCardRecords
                )
            );

        }
        catch (error) {

            console.error(
                "Unable to load MLB standings:",
                error
            );


            main.innerHTML =
                `
                <div class="mlb-standings-message">
                    UNABLE TO LOAD STANDINGS
                </div>
                `;

        }

    },


    async destroy(
        container
    ) {

        container.innerHTML =
            "";

    }

};