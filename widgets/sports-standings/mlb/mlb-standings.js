/*
 * ============================================================
 * MLB STANDINGS
 *
 * MLB-specific standings renderer.
 *
 * Layout:
 *
 * AL                         NL                    WILD CARD
 * EAST                       EAST                  AL
 * CENTRAL                    CENTRAL               NL
 * WEST                       WEST
 *
 * Each team displays:
 *
 * # | LOGO TEAM | W-L | GB | L10
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
 * TEAM LOGO
 * ============================================================
 *
 * MLB team logos are available using the MLB team ID.
 *
 * Example:
 *
 * https://www.mlbstatic.com/team-logos/111.svg
 *
 * ============================================================
 */

function getTeamLogoUrl(
    record
) {

    const teamId =
        record.team?.id;


    if (!teamId) {

        return "";

    }


    return (
        `https://www.mlbstatic.com/team-logos/${teamId}.svg`
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
 * MLB defines this relative to the third Wild Card team.
 *
 * ============================================================
 */

function getWildCardGamesBack(
    record
) {

    if (
        record.wildCardGamesBack !== undefined &&
        record.wildCardGamesBack !== null
    ) {

        const value =
            record.wildCardGamesBack;


        if (
            typeof value === "string" &&
            value.startsWith("+")
        ) {

            return value;

        }


        return formatGamesBack(
            value
        );

    }


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


    const logoUrl =
        getTeamLogoUrl(
            record
        );


    const logo =
        logoUrl
            ? `
                <img
                    class="mlb-standings-team-logo"
                    src="${logoUrl}"
                    alt=""
                    aria-hidden="true"
                >
            `
            : "";


    row.innerHTML = `
        <span class="mlb-standings-rank">
            ${rank}
        </span>

        <span class="mlb-standings-team-name">
            ${logo}
            <span class="mlb-standings-team-abbreviation">
                ${getTeamName(record)}
            </span>
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


            const row =
                createTeamRow(
                    record,
                    index + 1,
                    gamesBack
                );


            if (
                index === 0
            ) {

                row.classList.add(
                    "mlb-standings-division-leader"
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


    return uniqueTeams;

}


/*
 * ============================================================
 * LOAD WILD CARD STANDINGS
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
 * CREATE WILD CARD LEAGUE
 * ============================================================
 *
 * Displays:
 *
 * AL WILD CARD
 * NL WILD CARD
 *
 * Each displays the top five teams.
 *
 * ============================================================
 */

function createWildCardLeague(
    leagueName,
    records
) {

    const section =
        createElement(
            "section",
            "mlb-standings-wild-card-league"
        );


    const leagueHeader =
        createElement(
            "div",
            "mlb-standings-league-title",
            `${leagueName} WILD CARD`
        );


    section.appendChild(
        leagueHeader
    );


    const card =
        createElement(
            "div",
            "mlb-standings-wild-card-card"
        );


    card.appendChild(
        createHeader()
    );


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


    const sorted =
        sortWildCardRecords(
            leagueRecords
        );


    const wildCardLeader =
        sorted.find(
            record =>
                Number(
                    record.divisionRank
                ) !== 1
        ) || null;


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
                        record
                    );


                const row =
                    createTeamRow(
                        record,
                        index + 1,
                        gamesBack
                    );


                if (
                    Number(
                        record.divisionRank
                    ) === 1
                ) {

                    row.classList.add(
                        "mlb-standings-division-leader"
                    );

                }


                if (
                    record.team?.id ===
                    wildCardLeader?.team?.id
                ) {

                    row.classList.add(
                        "mlb-standings-wild-card-leader"
                    );

                }


                card.appendChild(
                    row
                );

            }
        );


    section.appendChild(
        card
    );


    return section;

}


/*
 * ============================================================
 * CREATE LEAGUE COLUMN
 * ============================================================
 */

function createLeagueColumn(
    leagueName,
    regularSeasonRecords
) {

    const column =
        createElement(
            "section",
            "mlb-standings-league-column"
        );


    const header =
        createElement(
            "div",
            "mlb-standings-league-header",
            leagueName
        );


    column.appendChild(
        header
    );


    const divisionStack =
        createElement(
            "div",
            "mlb-standings-division-stack"
        );


    DIVISIONS[
        leagueName
    ].forEach(
        division => {

            const divisionRecords =
                getDivisionRecords(
                    regularSeasonRecords,
                    division.id
                );


            divisionStack.appendChild(
                createDivision(
                    division,
                    divisionRecords
                )
            );

        }
    );


    column.appendChild(
        divisionStack
    );


    return column;

}


/*
 * ============================================================
 * CREATE WILD CARD COLUMN
 * ============================================================
 */

function createWildCardColumn(
    wildCardRecords
) {

    const column =
        createElement(
            "section",
            "mlb-standings-league-column mlb-standings-wild-card-column"
        );


    const header =
        createElement(
            "div",
            "mlb-standings-league-header",
            "WILD CARD"
        );


    column.appendChild(
        header
    );


    const wildCardStack =
        createElement(
            "div",
            "mlb-standings-wild-card-stack"
        );


    wildCardStack.appendChild(
        createWildCardLeague(
            "AL",
            wildCardRecords
        )
    );


    wildCardStack.appendChild(
        createWildCardLeague(
            "NL",
            wildCardRecords
        )
    );


    column.appendChild(
        wildCardStack
    );


    return column;

}


/*
 * ============================================================
 * CREATE COMPLETE 3 COLUMN LAYOUT
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
     * Column 1
     *
     * American League
     */

    grid.appendChild(
        createLeagueColumn(
            "AL",
            regularSeasonRecords
        )
    );


    /*
     * Column 2
     *
     * National League
     */

    grid.appendChild(
        createLeagueColumn(
            "NL",
            regularSeasonRecords
        )
    );


    /*
     * Column 3
     *
     * Wild Card
     */

    grid.appendChild(
        createWildCardColumn(
            wildCardRecords
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