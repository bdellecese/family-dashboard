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

import {
    sportsPreferences
} from "../../../config/sports-preferences.js";

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

function getMLBTestDate() {

    const mlbConfig =
        sportsPreferences.sports?.find(
            sport =>
                sport.sport === "mlb"
        );


    return (
        mlbConfig?.testDate ||
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/New_York"
            }
        ).format(
            new Date()
        )
    );

}


function getMLBSeason() {

    return Number(
        getMLBTestDate().slice(
            0,
            4
        )
    );

}

function getMLBPhase() {

    const mlbConfig =
        sportsPreferences.sports?.find(
            sport =>
                sport.sport === "mlb"
        );


    if (
        !mlbConfig
    ) {

        return "disabled";

    }


    const dateString =
        mlbConfig.testDate ||
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/New_York"
            }
        ).format(
            new Date()
        );


    const currentDate =
        new Date(
            `${dateString}T00:00:00`
        );


    const phase =
        mlbConfig.phases?.find(
            phase => {

                const start =
                    new Date(
                        `${phase.start}T00:00:00`
                    );

                const end =
                    new Date(
                        `${phase.end}T23:59:59`
                    );

                return (
                    currentDate >= start &&
                    currentDate <= end
                );

            }
        );


    return (
        phase?.phase ||
        "disabled"
    );

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
        getMLBSeason();


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
 * LOAD POSTSEASON
 * ============================================================
 */

async function loadPostseason() {

    const mlbConfig =
        sportsPreferences.sports?.find(
            sport =>
                sport.sport === "mlb"
        );


    const date =
        mlbConfig?.testDate ||
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/New_York"
            }
        ).format(
            new Date()
        );


    const response =
        await fetch(
            `/api/sports/mlb/postseason?date=${date}`
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `MLB postseason request failed: ${response.status}`
        );

    }


    return response.json();

}

/*
 * ============================================================
 * LOAD WILD CARD STANDINGS
 * ============================================================
 */

async function loadWildCardStandings() {

    const season =
        getMLBSeason();

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
 * POSTSEASON BRACKET
 * ============================================================
 */

function getPostseasonTeamLogoUrl(
    team
) {

    if (
        !team?.id
    ) {

        return "";

    }

    return (
        `https://www.mlbstatic.com/team-logos/${team.id}.svg`
    );

}


/*
 * ============================================================
 * CREATE POSTSEASON TEAM
 * ============================================================
 */

function createPostseasonTeam(
    team,
    isLoser
) {

    const row =
        createElement(
            "div",
            "mlb-postseason-team"
        );


    if (
        isLoser
    ) {

        row.classList.add(
            "mlb-postseason-team--loser"
        );

    }


    const logoUrl =
        getPostseasonTeamLogoUrl(
            team
        );


    const logo =
        logoUrl
            ? `
                <img
                    class="mlb-postseason-team-logo"
                    src="${logoUrl}"
                    alt=""
                    aria-hidden="true"
                >
            `
            : "";


    row.innerHTML = `
        <span class="mlb-postseason-team-name">
            ${logo}
            <span>
                ${team?.name || "TBD"}
            </span>
        </span>

        <span class="mlb-postseason-team-wins">
            ${team?.wins ?? 0}
        </span>
    `;


    return row;

}


/*
 * ============================================================
 * CREATE POSTSEASON SERIES
 * ============================================================
 */

function createPostseasonSeries(
    series
) {

    const card =
        createElement(
            "div",
            "mlb-postseason-series"
        );


    const teams =
        series?.teams || [];


    /*
     * --------------------------------------------------------
     * Determine whether the series has been completed.
     * --------------------------------------------------------
     */

    const winnerId =
        series?.winner || null;


    /*
     * --------------------------------------------------------
     * Team order
     *
     * Winner first for completed series.
     * Otherwise preserve the API order.
     * --------------------------------------------------------
     */

    let orderedTeams =
        [...teams];


    if (
        winnerId
    ) {

        orderedTeams.sort(
            (
                a,
                b
            ) => {

                if (
                    a.id === winnerId
                ) {

                    return -1;

                }

                if (
                    b.id === winnerId
                ) {

                    return 1;

                }

                return 0;

            }
        );

    }


    /*
     * --------------------------------------------------------
     * Render both teams.
     * --------------------------------------------------------
     */

    orderedTeams
        .slice(
            0,
            2
        )
        .forEach(
            team => {

                const isLoser =
                    Boolean(
                        winnerId &&
                        team.id !== winnerId
                    );


                card.appendChild(
                    createPostseasonTeam(
                        team,
                        isLoser
                    )
                );

            }
        );


    /*
     * --------------------------------------------------------
     * Future / unknown series.
     *
     * Ensure the card always has two rows.
     * --------------------------------------------------------
     */

    while (
        card.children.length < 2
    ) {

        card.appendChild(
            createPostseasonTeam(
                {
                    name:
                        "TBD",

                    wins:
                        0
                },
                false
            )
        );

    }


    return card;

}


/*
 * ============================================================
 * CREATE POSTSEASON ROUND
 * ============================================================
 */

function createPostseasonRound(
    title,
    series
) {

    const column =
        createElement(
            "section",
            "mlb-postseason-round"
        );


    const header =
        createElement(
            "div",
            "mlb-postseason-round-title",
            title
        );


    column.appendChild(
        header
    );


    const seriesStack =
        createElement(
            "div",
            "mlb-postseason-round-cards"
        );


    (series || [])
        .forEach(
            currentSeries => {

                seriesStack.appendChild(
                    createPostseasonSeries(
                        currentSeries
                    )
                );

            }
        );


    column.appendChild(
        seriesStack
    );


    return column;

}


/*
 * ============================================================
 * CREATE LEAGUE BRACKET
 * ============================================================
 */

function createPostseasonLeagueBracket(
    league,
    bracket
) {

    const leagueSection =
        createElement(
            "section",
            `mlb-postseason-league mlb-postseason-league--${league.toLowerCase()}`
        );


    const title =
        createElement(
            "div",
            "mlb-postseason-league-title",
            league
        );


    leagueSection.appendChild(
        title
    );


    const grid =
        createElement(
            "div",
            "mlb-postseason-bracket"
        );


    const wildCard =
        (bracket.wildCard || [])
            .filter(
                series =>
                    series.league === league
            );


    const divisionSeries =
        (bracket.divisionSeries || [])
            .filter(
                series =>
                    series.league === league
            );


    const leagueChampionship =
        (bracket.leagueChampionship || [])
            .filter(
                series =>
                    series.league === league
            );


    grid.appendChild(
        createPostseasonRound(
            "WILD CARD",
            wildCard
        )
    );


    grid.appendChild(
        createPostseasonRound(
            "DIVISION",
            divisionSeries
        )
    );


    grid.appendChild(
        createPostseasonRound(
            "CHAMPIONSHIP",
            leagueChampionship
        )
    );


    leagueSection.appendChild(
        grid
    );


    return leagueSection;

}


/*
 * ============================================================
 * CREATE WORLD SERIES
 * ============================================================
 */

function createWorldSeries(
    bracket
) {

    const section =
        createElement(
            "section",
            "mlb-postseason-world-series"
        );


    const title =
        createElement(
            "div",
            "mlb-postseason-world-series-title",
            "WORLD SERIES"
        );


    section.appendChild(
        title
    );


    const series =
        bracket.worldSeries?.[0] ||
        null;


    if (
        series
    ) {

        section.appendChild(
            createPostseasonSeries(
                series
            )
        );

    }
    else {

        section.appendChild(
            createPostseasonSeries(
                {
                    teams: []
                }
            )
        );

    }


    return section;

}


/*
 * ============================================================
 * CREATE COMPLETE POSTSEASON BRACKET
 * ============================================================
 */

function createPostseasonBracket(
    bracket
) {

    const root =
        createElement(
            "div",
            "mlb-postseason-bracket"
        );


    /*
     * ========================================================
     * HELPERS
     * ========================================================
     */

    function getSeries(
        collection,
        id
    ) {

        return (
            collection || []
        ).find(
            series =>
                series.id === id
        ) || null;

    }

    function createTeam(
        team,
        league = null,
        forceLeftAligned = false
    ) {
        const row =
            createElement(
                "div",
                "mlb-postseason-team"
            );


        if (
            !team
        ) {
            row.classList.add(
                "mlb-postseason-team--placeholder"
            );

            row.appendChild(
                createElement(
                    "div",
                    "mlb-postseason-team-tbd",
                    "TBD"
                )
            );

            return row;
        }

        const seed =
            team.seed;

        const wins =
            team.wins ?? 0;

        const logo =
            document.createElement(
                "img"
            );

        logo.className =
            "mlb-postseason-team-logo";

        logo.src =
            getPostseasonTeamLogoUrl(
                team
            );

        logo.alt =
            team.name || "";

        const seedElement =
            createElement(
                "div",
                "mlb-postseason-team-seed",
                seed
                    ? `(${seed})`
                    : ""
                );

        const winsElement =
            createElement(
                "div",
                "mlb-postseason-team-wins",
                String(wins)
            );

        if (
            forceLeftAligned
        ) {
            winsElement.style.marginLeft =
                "auto";
        }

        if (
            league === "NL" &&
            !forceLeftAligned
        ) {
                row.appendChild(
                winsElement
            );

            row.appendChild(
                logo
            );

            row.appendChild(
                seedElement
            );
        }
        else {
            row.appendChild(
                seedElement
            );

            row.appendChild(
                logo
            );

            row.appendChild(
                winsElement
            );
        }

        return row;
    }


    function createSeriesCard(
        series,
        title
    ) {

        const card =
            createElement(
                "div",
                "mlb-postseason-series"
            );

        const isWorldSeries =
            series?.round ===
            "worldSeries";

        const heading =
            createElement(
                "div",
                "mlb-postseason-series-title",
                title
            );

        if (
            isWorldSeries
        ) {
            card.classList.add(
                "mlb-postseason-series--world"
            );
        }

        card.appendChild(
            heading
        );


        /*
        * ---------------------------------------------------------
        * Teams
        *
        * A series can have:
        *
        *   0 teams = completely TBD
        *   1 team  = known bye team + TBD opponent
        *   2 teams = both teams known
        * ---------------------------------------------------------
        */

        const teams =
            series?.teams || [];

        /*
        * ---------------------------------------------------------
        * No teams known yet.
        * ---------------------------------------------------------
        */

        if (
            teams.length === 0
        ) {

            card.appendChild(
                createTeam(
                    null,
                    series?.league,
                    isWorldSeries
                )
            );

            card.appendChild(
                createTeam(
                    null,
                    series?.league,
                    isWorldSeries
                )
            );

            return card;

        }


        /*
        * ---------------------------------------------------------
        * One team known.
        *
        * This is the important case for a Division Series
        * before the Wild Card winner is known.
        *
        * Example:
        *
        *     (1) [Dodgers logo]  TBD
        *
        * ---------------------------------------------------------
        */

        if (
            teams.length === 1
        ) {

            /*
             * The TBD slot represents the Wild Card winner
             * and therefore occupies the top bracket position.
             *
             * The known bye team occupies the bottom position.
             */

            card.appendChild(
                createTeam(
                    null,
                    series?.league,
                    isWorldSeries
                )
            );

            card.appendChild(
                createTeam(
                    teams[0],
                    series.league,
                    isWorldSeries
                )
            );

            return card;

        }

        /*
        * ---------------------------------------------------------
        * Both teams known.
        *
        * Sort by series wins so the team currently leading
        * appears first.
        * ---------------------------------------------------------
        */

        const sortedTeams =
            [...teams]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        (
                            b.wins ?? 0
                        ) -
                        (
                            a.wins ?? 0
                        )
                );


        sortedTeams.forEach(
            team => {

                card.appendChild(
                    createTeam(
                        team,
                        series.league,
                        isWorldSeries
                    )
                );

            }
        );


        return card;

    }


    function createRound(
        className,
        title,
        cards
    ) {

        const round =
            createElement(
                "section",
                `mlb-postseason-round ${className}`
            );


        const heading =
            createElement(
                "div",
                "mlb-postseason-round-title",
                title
            );


        round.appendChild(
            heading
        );


        const cardsContainer =
            createElement(
                "div",
                "mlb-postseason-round-cards"
            );


        cards.forEach(
            card => {

                cardsContainer.appendChild(
                    card
                );

            }
        );


        round.appendChild(
            cardsContainer
        );


        return round;

    }


    /*
     * ========================================================
     * BUILD AL
     * ========================================================
     */

    const al =
        createElement(
            "section",
            "mlb-postseason-side mlb-postseason-side--al"
        );


    al.appendChild(
        createElement(
            "div",
            "mlb-postseason-league",
            "AMERICAN LEAGUE"
        )
    );


    const alDivision =
        [
            getSeries(bracket.divisionSeries, "D_1"),
            getSeries(bracket.divisionSeries, "D_2")
        ];


    /*
     * Order Wild Card series to match the
     * Division Series slots.
     *
     * D_1 participant comes from whichever
     * Wild Card series produced that team.
     * D_2 participant does the same.
     */
    const alWildCard =
        alDivision.map(
            divisionSeries => {

                if (
                    !divisionSeries ||
                    !divisionSeries.teams?.length
                ) {
                    return null;
                }

                /*
                * MLB playoff structure:
                *
                *   #1 seed → winner of #4 vs #5
                *   #2 seed → winner of #3 vs #6
                *
                * This lets us identify the Wild Card series
                * even when the ALDS opponent is still TBD.
                */

                const byeTeam =
                    divisionSeries.teams.find(
                        team =>
                            team.seed === 1 ||
                            team.seed === 2
                    );

                if (
                    !byeTeam
                ) {
                    return null;
                }

                const opponentSeeds =
                    byeTeam.seed === 1
                        ? [4, 5]
                        : [3, 6];

                return (
                    (bracket.wildCard || [])
                        .find(
                            wc =>
                                wc.league === "AL" &&
                                wc.teams?.some(
                                    team =>
                                        opponentSeeds.includes(
                                            team.seed
                                        )
                                )
                        )
                    || null
                );

            }
        );

    const alChampionship =
        getSeries(
            bracket.leagueChampionship,
            "L_1"
        );


    al.appendChild(
        createRound(
            "mlb-postseason-round--wild-card",
            "WILD CARD",
            alWildCard.map(
                series =>
                    createSeriesCard(
                        series,
                        "WILD CARD"
                    )
            )
        )
    );


    al.appendChild(
        createRound(
            "mlb-postseason-round--division",
            "DIVISION",
            alDivision.map(
                series =>
                    createSeriesCard(
                        series,
                        "ALDS"
                    )
            )
        )
    );


    al.appendChild(
        createRound(
            "mlb-postseason-round--championship",
            "CHAMPIONSHIP",
            [
                createSeriesCard(
                    alChampionship,
                    "ALCS"
                )
            ]
        )
    );


    /*
     * ========================================================
     * WORLD SERIES
     * ========================================================
     */

    const center =
        createElement(
            "section",
            "mlb-postseason-center"
        );


    center.appendChild(
        createElement(
            "div",
            "mlb-postseason-league mlb-postseason-league--center",
            "WORLD SERIES"
        )
    );


    const worldSeries =
        bracket.worldSeries?.[0] ||
        null;


    center.appendChild(
        createSeriesCard(
            worldSeries,
            "WORLD SERIES"
        )
    );


    /*
     * ========================================================
     * BUILD NL
     * ========================================================
     */

    const nl =
        createElement(
            "section",
            "mlb-postseason-side mlb-postseason-side--nl"
        );


    nl.appendChild(
        createElement(
            "div",
            "mlb-postseason-league",
            "NATIONAL LEAGUE"
        )
    );


    const nlChampionship =
        getSeries(
            bracket.leagueChampionship,
            "L_2"
        );


    const nlDivision =
        [
            getSeries(bracket.divisionSeries, "D_3"),
            getSeries(bracket.divisionSeries, "D_4")
        ];


    const nlWildCard =
        nlDivision.map(
            divisionSeries => {

                if (
                    !divisionSeries ||
                    !divisionSeries.teams?.length
                ) {
                    return null;
                }

                /*
                * MLB playoff structure:
                *
                *   #1 seed → winner of #4 vs #5
                *   #2 seed → winner of #3 vs #6
                *
                * This lets us identify the Wild Card series
                * even when the NLDS opponent is still TBD.
                */

                const byeTeam =
                    divisionSeries.teams.find(
                        team =>
                            team.seed === 1 ||
                            team.seed === 2
                    );

                if (
                    !byeTeam
                ) {
                    return null;
                }

                const opponentSeeds =
                    byeTeam.seed === 1
                        ? [4, 5]
                        : [3, 6];

                return (
                    (bracket.wildCard || [])
                        .find(
                            wc =>
                                wc.league === "NL" &&
                                wc.teams?.some(
                                    team =>
                                        opponentSeeds.includes(
                                            team.seed
                                        )
                                )
                        )
                    || null
                );

            }
        );


    nl.appendChild(
        createRound(
            "mlb-postseason-round--championship",
            "CHAMPIONSHIP",
            [
                createSeriesCard(
                    nlChampionship,
                    "NLCS"
                )
            ]
        )
    );


    nl.appendChild(
        createRound(
            "mlb-postseason-round--division",
            "DIVISION",
            nlDivision.map(
                series =>
                    createSeriesCard(
                        series,
                        "NLDS"
                    )
            )
        )
    );


    nl.appendChild(
        createRound(
            "mlb-postseason-round--wild-card",
            "WILD CARD",
            nlWildCard.map(
                series =>
                    createSeriesCard(
                        series,
                        "WILD CARD"
                    )
            )
        )
    );


    /*
     * ========================================================
     * FINAL BRACKET
     * ========================================================
     */

    root.appendChild(
        al
    );

    root.appendChild(
        center
    );

    root.appendChild(
        nl
    );


    return root;

}

/*
 * ============================================================
 * CREATE COMPLETE 3 COLUMN LAYOUT
 * ============================================================
 */

function createLayout(
    regularSeasonRecords,
    wildCardRecords,
    postseasonBracket
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
                    ${sportsPreferences.sports
                        ?.find(
                            sport =>
                                sport.sport === "mlb"
                        )
                        ?.testDate
                            ?.slice(0, 4) ||
                        getCurrentSeason()
                    } SEASON
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

        const phase =
            getMLBPhase();

        const title =
            root.querySelector(
                ".mlb-standings-title"
            );

        if (
            title
        ) {

            title.textContent =
                phase === "postseason"
                    ? "MLB POSTSEASON"
                    : "MLB STANDINGS";

        }

        const main =
            root.querySelector(
                ".mlb-standings-main"
            );

        try {

            const phase =
                getMLBPhase();

            /*
            * ========================================================
            * REGULAR SEASON
            * ========================================================
            */

            if (
                phase === "regularSeason"
            ) {

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


                return;

            }


            /*
            * ========================================================
            * POSTSEASON
            * ========================================================
            */

            if (
                phase === "postseason"
            ) {

                const postseason =
                    await loadPostseason();


                main.innerHTML =
                    "";


                if (
                    !postseason?.bracket
                ) {

                    main.innerHTML =
                        `
                        <div class="mlb-standings-message">
                            NO POSTSEASON DATA AVAILABLE
                        </div>
                        `;

                    return;

                }


                main.appendChild(
                    createPostseasonBracket(
                        postseason.bracket
                    )
                );


                return;

            }


            /*
            * ========================================================
            * DISABLED
            * ========================================================
            */

            main.innerHTML =
                `
                <div class="mlb-standings-message">
                    MLB STANDINGS UNAVAILABLE
                </div>
                `;

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