/*
 * ============================================================
 * NFL STANDINGS
 *
 * NFL-specific standings renderer.
 *
 * Consumes:
 *
 *     /api/sports/nfl/standings
 *
 * Layout:
 *
 * AFC                         NFC
 *
 * EAST       NORTH            EAST       NORTH
 * SOUTH      WEST             SOUTH      WEST
 *
 * Each division displays:
 *
 * TEAM | W-L
 *
 * ============================================================
 */


const NFL_API =
    "/api/sports/nfl/standings";


const CONFERENCES = {

    AFC: [
        "East",
        "North",
        "South",
        "West"
    ],

    NFC: [
        "East",
        "North",
        "South",
        "West"
    ]

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
    team
) {

    return (
        team.abbreviation ||
        team.shortName ||
        team.shortDisplayName ||
        team.name ||
        "???"
    );

}


/*
 * ============================================================
 * RECORD
 * ============================================================
 */

function getWins(
    team
) {

    return (
        Number(
            team.wins
        ) || 0
    );

}


function getLosses(
    team
) {

    return (
        Number(
            team.losses
        ) || 0
    );

}


function getTies(
    team
) {

    return (
        Number(
            team.ties
        ) || 0
    );

}


/*
 * ============================================================
 * WINNING PERCENTAGE
 * ============================================================
 */

function getWinningPercentage(
    team
) {

    const wins =
        getWins(
            team
        );


    const losses =
        getLosses(
            team
        );


    const ties =
        getTies(
            team
        );


    const games =
        wins +
        losses +
        ties;


    if (
        games === 0
    ) {

        return 0;

    }


    return (
        (
            wins +
            (
                ties * 0.5
            )
        ) /
        games
    );

}


/*
 * ============================================================
 * SORT DIVISION
 * ============================================================
 */

function sortDivisionTeams(
    teams
) {

    return [...teams]
        .sort(
            (
                a,
                b
            ) => {

                const aRank =
                    Number(
                        a.rank
                    );


                const bRank =
                    Number(
                        b.rank
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


                return (
                    getWinningPercentage(b) -
                    getWinningPercentage(a)
                );

            }
        );

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
            "nfl-standings-columns"
        );


    header.innerHTML = `
        <span>TEAM</span>
        <span>W-L</span>
    `;


    return header;

}


/*
 * ============================================================
 * TEAM ROW
 * ============================================================
 */

function createTeamRow(
    team,
    rank
) {

    const row =
        createElement(
            "div",
            "nfl-standings-team"
        );


    const wins =
        getWins(
            team
        );


    const losses =
        getLosses(
            team
        );


    const ties =
        getTies(
            team
        );


    const record =
        ties > 0
            ? `${wins}-${losses}-${ties}`
            : `${wins}-${losses}`;


    const logo =
        team.logo
            ? `
                <img
                    class="nfl-standings-team-logo"
                    src="${team.logo}"
                    alt=""
                    loading="lazy"
                >
              `
            : "";


    row.innerHTML = `
        <span class="nfl-standings-team-name">
            ${logo}
            <span>
                ${getTeamName(team)}
            </span>
        </span>

        <span class="nfl-standings-record">
            ${record}
        </span>
    `;


    if (
        rank === 1
    ) {

        row.classList.add(
            "nfl-standings-division-leader"
        );

    }


    return row;

}


/*
 * ============================================================
 * CREATE DIVISION
 * ============================================================
 */

function createDivision(
    conference,
    divisionName,
    teams
) {

    const section =
        createElement(
            "section",
            "nfl-standings-division"
        );


    const title =
        createElement(
            "div",
            "nfl-standings-division-title",
            divisionName.toUpperCase()
        );


    section.appendChild(
        title
    );


    section.appendChild(
        createHeader()
    );


    const sorted =
        sortDivisionTeams(
            teams
        );


    sorted.forEach(
        (
            team,
            index
        ) => {

            section.appendChild(
                createTeamRow(
                    team,
                    index + 1
                )
            );

        }
    );


    return section;

}


/*
 * ============================================================
 * CREATE CONFERENCE
 * ============================================================
 */

function createConference(
    conferenceName,
    standings
) {

    const conference =
        createElement(
            "section",
            "nfl-standings-conference"
        );


    const header =
        createElement(
            "div",
            "nfl-standings-conference-header",
            conferenceName
        );


    conference.appendChild(
        header
    );


    const grid =
        createElement(
            "div",
            "nfl-standings-division-grid"
        );


    CONFERENCES[
        conferenceName
    ].forEach(
        divisionName => {

            const divisionTeams =
                Array.isArray(
                    standings?.[
                        conferenceName
                    ]?.[
                        divisionName
                    ]
                )
                    ? standings[
                        conferenceName
                    ][
                        divisionName
                    ]
                    : [];


            grid.appendChild(
                createDivision(
                    conferenceName,
                    divisionName,
                    divisionTeams
                )
            );

        }
    );


    conference.appendChild(
        grid
    );


    return conference;

}


/*
 * ============================================================
 * CREATE COMPLETE LAYOUT
 * ============================================================
 */

function createLayout(
    standings
) {

    const layout =
        createElement(
            "div",
            "nfl-standings-conferences"
        );


    layout.appendChild(
        createConference(
            "AFC",
            standings
        )
    );


    layout.appendChild(
        createConference(
            "NFC",
            standings
        )
    );


    return layout;

}


/*
 * ============================================================
 * LOAD STANDINGS
 * ============================================================
 */

async function loadStandings() {

    const response =
        await fetch(
            `${NFL_API}?t=${Date.now()}`,
            {
                cache:
                    "no-store"
            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `NFL standings request failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    if (
        !data ||
        !data.standings
    ) {

        throw new Error(
            "NFL standings response did not contain standings data."
        );

    }


    return data;

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
            "sports-standings__sport--nfl"
        );


        const root =
            createElement(
                "div",
                "nfl-standings"
            );


        root.innerHTML = `
            <header class="nfl-standings-header">

                <div class="nfl-standings-title">
                    NFL STANDINGS
                </div>

                <div class="nfl-standings-date">
                    ${getCurrentSeason()} SEASON
                </div>

            </header>

            <main class="nfl-standings-main">

                <div class="nfl-standings-loading">
                    LOADING STANDINGS...
                </div>

            </main>
        `;


        container.appendChild(
            root
        );


        const main =
            root.querySelector(
                ".nfl-standings-main"
            );


        try {

            const data =
                await loadStandings();


            main.innerHTML =
                "";


            if (
                !data.standings ||
                (
                    !data.standings.AFC &&
                    !data.standings.NFC
                )
            ) {

                main.innerHTML =
                    `
                    <div class="nfl-standings-message">
                        NO STANDINGS AVAILABLE
                    </div>
                    `;

                return;

            }


            main.appendChild(
                createLayout(
                    data.standings
                )
            );

        }

        catch (error) {

            console.error(
                "Unable to load NFL standings:",
                error
            );


            main.innerHTML =
                `
                <div class="nfl-standings-message">
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