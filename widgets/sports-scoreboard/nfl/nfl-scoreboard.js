/*
 * ============================================================
 * NFL SCOREBOARD WIDGET
 * ============================================================
 *
 * Renders NFL scoreboard data supplied by:
 *
 *     /api/sports/nfl/scoreboard
 *
 * Configuration comes from:
 *
 *     config.favoriteTeams
 *
 * The convention is intentionally simple:
 *
 *     favoriteTeams[0] = primary / left featured team
 *     favoriteTeams[1] = secondary / right featured team
 *
 * No separate primary / secondary / left / right configuration
 * is required.
 *
 * Layout:
 *
 *     NFL SCOREBOARD                         WEEK 1
 *
 *     FEATURED
 *
 *     [ FEATURED GAME ]       [ FEATURED GAME ]
 *
 *     OTHER GAMES
 *
 *     COLUMN 1          COLUMN 2          COLUMN 3          COLUMN 4
 *
 * ============================================================
 */


/*
 * ============================================================
 * DATE / TIME HELPERS
 * ============================================================
 */

function getDate(
    date
) {

    if (
        !date
    ) {

        return null;

    }


    const parsed =
        new Date(
            date
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return null;

    }


    return parsed;

}


function formatGameDate(
    date
) {

    const gameDate =
        getDate(
            date
        );


    if (
        !gameDate
    ) {

        return "";

    }


    return gameDate
        .toLocaleDateString(
            "en-US",
            {

                timeZone:
                    "America/New_York",

                weekday:
                    "short",

                month:
                    "short",

                day:
                    "numeric"

            }
        )
        .toUpperCase();

}


function formatGameTime(
    date
) {

    const gameDate =
        getDate(
            date
        );


    if (
        !gameDate
    ) {

        return "";

    }


    return gameDate
        .toLocaleTimeString(
            "en-US",
            {

                timeZone:
                    "America/New_York",

                hour:
                    "numeric",

                minute:
                    "2-digit"

            }
        )
        .toUpperCase();

}


function formatGameDateTime(
    date
) {

    const gameDate =
        formatGameDate(
            date
        );


    const gameTime =
        formatGameTime(
            date
        );


    if (
        !gameDate
    ) {

        return gameTime;

    }


    if (
        !gameTime
    ) {

        return gameDate;

    }


    return `${gameDate} • ${gameTime}`;

}


/*
 * ============================================================
 * GAME STATUS
 * ============================================================
 */

function getGameStatus(
    game
) {

    const type =
        game
            ?.status
            ?.type;


    if (
        type?.completed ||
        type?.state === "post"
    ) {

        return {

            state:
                "final",

            label:
                "FINAL"

        };

    }


    if (
        type?.state === "in"
    ) {

        return {

            state:
                "live",

            label:
                type?.shortDetail ||
                "LIVE"

        };

    }


    return {

        state:
            "scheduled",

        label:
            formatGameDateTime(
                game?.date
            )

    };

}


/*
 * ============================================================
 * TEAM HELPERS
 * ============================================================
 */

function getTeamName(
    team
) {

    return (
        team?.name ||
        team?.shortName ||
        team?.shortDisplayName ||
        team?.abbreviation ||
        "UNKNOWN"
    );

}


function getTeamAbbreviation(
    team
) {

    return (
        team?.abbreviation ||
        team?.shortName ||
        team?.shortDisplayName ||
        team?.name ||
        "???"
    );

}


/*
 * ============================================================
 * SCORE HELPERS
 * ============================================================
 */

function getScore(
    team
) {

    if (
        team?.score === null ||
        team?.score === undefined
    ) {

        return "-";

    }


    return team.score;

}


function getQuarterScores(
    team
) {

    const quarters =
        Array.isArray(
            team?.quarters
        )
            ? team.quarters
            : [];


    return [

        quarters[0] ?? "-",

        quarters[1] ?? "-",

        quarters[2] ?? "-",

        quarters[3] ?? "-"

    ];

}


/*
 * ============================================================
 * LEADER HELPERS
 * ============================================================
 *
 * Supports both:
 *
 * 1. Normalized:
 *
 *    leaders: {
 *        passing: {...},
 *        rushing: {...},
 *        receiving: {...}
 *    }
 *
 * 2. ESPN-style:
 *
 *    leaders: [
 *        {
 *            name: "passing",
 *            leaders: [...]
 *        }
 *    ]
 * ============================================================
 */

function getLeader(
    team,
    type
) {

    const leaders =
        team?.leaders;


    if (
        !leaders
    ) {

        return null;

    }


    /*
     * --------------------------------------------------------
     * NORMALIZED OBJECT
     * --------------------------------------------------------
     */

    if (
        !Array.isArray(
            leaders
        )
    ) {

        const direct =
            leaders?.[type];


        if (
            direct
        ) {

            if (
                direct.name ||
                direct.displayValue
            ) {

                return direct;

            }


            if (
                Array.isArray(
                    direct.leaders
                )
            ) {

                return (
                    direct.leaders[0] ||
                    null
                );

            }


            return direct;

        }


        return null;

    }


    /*
     * --------------------------------------------------------
     * ESPN ARRAY
     * --------------------------------------------------------
 */

    const category =
        leaders.find(
            leader => {

                const value =
                    leader?.type ||
                    leader?.name ||
                    leader?.category;


                return (
                    String(
                        value || ""
                    )
                        .toLowerCase() ===
                    String(
                        type
                    )
                        .toLowerCase()
                );

            }
        );


    if (
        !category
    ) {

        return null;

    }


    if (
        Array.isArray(
            category.leaders
        )
    ) {

        return (
            category.leaders[0] ||
            null
        );

    }


    return category;

}


function getLeaderName(
    leader
) {

    if (
        !leader
    ) {

        return "—";

    }


    return (
        leader?.name ||
        leader?.athlete?.displayName ||
        leader?.athlete?.shortName ||
        leader?.athlete?.fullName ||
        "—"
    );

}


function getLeaderStats(
    leader
) {

    if (
        !leader
    ) {

        return "—";

    }


    return (
        leader?.displayValue ||
        leader?.statistics?.displayValue ||
        leader?.statDisplayValue ||
        "—"
    );

}


/*
 * ============================================================
 * CREATE FEATURED TEAM ROW
 * ============================================================
 */

function createFeaturedTeamRow(
    team,
    isWinner
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "nfl-featured-team-row";


    if (
        isWinner
    ) {

        row.classList.add(
            "nfl-featured-team-row--winner"
        );

    }


    const logo =
        team?.logo
            ? `
                <img
                    class="nfl-featured-team-logo"
                    src="${team.logo}"
                    alt="${getTeamName(team)}"
                >
            `
            : "";


    const quarters =
        getQuarterScores(
            team
        );


    const finalScore =
        getScore(
            team
        );


    row.innerHTML = `

        <div class="nfl-featured-team-info">

            ${logo}

            <span class="nfl-featured-team-name">

                ${getTeamName(team)}

            </span>

        </div>


        <div class="nfl-featured-score-line">

            <span>${quarters[0]}</span>

            <span>${quarters[1]}</span>

            <span>${quarters[2]}</span>

            <span>${quarters[3]}</span>

            <strong>${finalScore}</strong>

        </div>

    `;


    return row;

}


/*
 * ============================================================
 * CREATE LEADER SECTION
 * ============================================================
 */

function createLeaderSection(
    type,
    label,
    away,
    home
) {

    const section =
        document.createElement(
            "div"
        );


    section.className =
        "nfl-featured-leader";


    const awayLeader =
        getLeader(
            away,
            type
        );


    const homeLeader =
        getLeader(
            home,
            type
        );


    section.innerHTML = `

        <div class="nfl-featured-leader-title">

            ${label}

        </div>


        <div class="nfl-featured-leader-row">

            <span class="nfl-featured-leader-team">

                ${getTeamAbbreviation(away)}

            </span>


            <span class="nfl-featured-leader-name">

                ${getLeaderName(awayLeader)}

            </span>


            <span class="nfl-featured-leader-stats">

                ${getLeaderStats(awayLeader)}

            </span>

        </div>


        <div class="nfl-featured-leader-row">

            <span class="nfl-featured-leader-team">

                ${getTeamAbbreviation(home)}

            </span>


            <span class="nfl-featured-leader-name">

                ${getLeaderName(homeLeader)}

            </span>


            <span class="nfl-featured-leader-stats">

                ${getLeaderStats(homeLeader)}

            </span>

        </div>

    `;


    return section;

}


/*
 * ============================================================
 * FEATURED GAME
 * ============================================================
 */

function renderFeaturedGame(
    game,
    container
) {

    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !game
    ) {

        container.innerHTML = `

            <div class="nfl-featured-message">

                NO GAME

            </div>

        `;


        return;

    }


    const status =
        getGameStatus(
            game
        );


    const awayScore =
        Number(
            game.away?.score
        );


    const homeScore =
        Number(
            game.home?.score
        );


    const awayWinner =
        status.state === "final" &&
        !Number.isNaN(awayScore) &&
        !Number.isNaN(homeScore) &&
        awayScore >
            homeScore;


    const homeWinner =
        status.state === "final" &&
        !Number.isNaN(awayScore) &&
        !Number.isNaN(homeScore) &&
        homeScore >
            awayScore;


    const card =
        document.createElement(
            "div"
        );


    card.className =
        `nfl-featured-game nfl-featured-game--${status.state}`;


    /*
     * --------------------------------------------------------
     * SCORE HEADER
     * --------------------------------------------------------
     */

    const scoreHeaderHTML = `

        <div class="nfl-featured-score-header">

            <div></div>

            <span>Q1</span>

            <span>Q2</span>

            <span>Q3</span>

            <span>Q4</span>

            <strong>FINAL</strong>

        </div>

    `;


    /*
     * --------------------------------------------------------
     * TEAM ROWS
     * --------------------------------------------------------
     */

    const awayRow =
        createFeaturedTeamRow(
            game.away,
            awayWinner
        );


    const homeRow =
        createFeaturedTeamRow(
            game.home,
            homeWinner
        );


    const teams =
        document.createElement(
            "div"
        );


    teams.className =
        "nfl-featured-teams";


    teams.appendChild(
        awayRow
    );


    teams.appendChild(
        homeRow
    );


    /*
     * --------------------------------------------------------
     * GAME META
     * --------------------------------------------------------
 */

    const venue =
        game.venue?.fullName ||
        game.venue?.name ||
        "";


    const gameMeta =
        document.createElement(
            "div"
        );


    gameMeta.className =
        "nfl-featured-meta";


    gameMeta.innerHTML = `

        <div class="nfl-featured-date">

            ${formatGameDateTime(game.date)}

        </div>


        ${
            venue
                ? `
                    <div class="nfl-featured-venue">

                        ${venue}

                    </div>
                `
                : ""
        }

    `;


    /*
     * --------------------------------------------------------
     * LEADERS
     * --------------------------------------------------------
 */

    const leaders =
        document.createElement(
            "div"
        );


    leaders.className =
        "nfl-featured-leaders";


    leaders.appendChild(
        createLeaderSection(
            "passing",
            "PASSING",
            game.away,
            game.home
        )
    );


    leaders.appendChild(
        createLeaderSection(
            "rushing",
            "RUSHING",
            game.away,
            game.home
        )
    );


    leaders.appendChild(
        createLeaderSection(
            "receiving",
            "RECEIVING",
            game.away,
            game.home
        )
    );


    /*
     * --------------------------------------------------------
     * ASSEMBLE
     * --------------------------------------------------------
 */

    card.innerHTML =
        scoreHeaderHTML;


    card.appendChild(
        teams
    );


    card.appendChild(
        gameMeta
    );


    card.appendChild(
        leaders
    );


    container.appendChild(
        card
    );

}


/*
 * ============================================================
 * OTHER GAME
 * ============================================================
 */

function createGame(
    game
) {

    const card =
        document.createElement(
            "div"
        );


    const status =
        getGameStatus(
            game
        );


    card.className =
        `nfl-game nfl-game--${status.state}`;


    const awayScore =
        getScore(
            game.away
        );


    const homeScore =
        getScore(
            game.home
        );


    const awayNumeric =
        Number(
            game.away?.score
        );


    const homeNumeric =
        Number(
            game.home?.score
        );


    const awayWinner =
        status.state === "final" &&
        !Number.isNaN(awayNumeric) &&
        !Number.isNaN(homeNumeric) &&
        awayNumeric >
            homeNumeric;


    const homeWinner =
        status.state === "final" &&
        !Number.isNaN(awayNumeric) &&
        !Number.isNaN(homeNumeric) &&
        homeNumeric >
            awayNumeric;


    card.innerHTML = `

        <div class="nfl-game-status">

            ${status.label}

        </div>


        <div class="nfl-game-row">

            <div class="nfl-game-team">

                ${
                    game.away?.logo
                        ? `
                            <img
                                class="nfl-game-logo"
                                src="${game.away.logo}"
                                alt=""
                            >
                        `
                        : ""
                }


                <span>

                    ${getTeamAbbreviation(game.away)}

                </span>

            </div>


            <span class="nfl-game-score ${
                awayWinner
                    ? "nfl-game-score--winner"
                    : ""
            }">

                ${awayScore}

            </span>

        </div>


        <div class="nfl-game-row">

            <div class="nfl-game-team">

                ${
                    game.home?.logo
                        ? `
                            <img
                                class="nfl-game-logo"
                                src="${game.home.logo}"
                                alt=""
                            >
                        `
                        : ""
                }


                <span>

                    ${getTeamAbbreviation(game.home)}

                </span>

            </div>


            <span class="nfl-game-score ${
                homeWinner
                    ? "nfl-game-score--winner"
                    : ""
            }">

                ${homeScore}

            </span>

        </div>

    `;


    return card;

}


/*
 * ============================================================
 * SPLIT GAMES INTO FOUR COLUMNS
 * ============================================================
 */

function splitIntoColumns(
    games
) {

    const displayGames =
        games.slice(
            0,
            14
        );


    return [

        displayGames.slice(
            0,
            4
        ),

        displayGames.slice(
            4,
            8
        ),

        displayGames.slice(
            8,
            12
        ),

        displayGames.slice(
            12,
            14
        )

    ];

}


/*
 * ============================================================
 * RENDER OTHER GAMES
 * ============================================================
 */

function renderGames(
    container,
    games
) {

    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !Array.isArray(games) ||
        games.length === 0
    ) {

        container.innerHTML = `

            <div class="nfl-no-games">

                NO OTHER GAMES

            </div>

        `;


        return;

    }


    const columns =
        splitIntoColumns(
            games
        );


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "nfl-games-grid";


    columns.forEach(
        columnGames => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "nfl-game-column";


            columnGames.forEach(
                game => {

                    column.appendChild(
                        createGame(
                            game
                        )
                    );

                }
            );


            grid.appendChild(
                column
            );

        }
    );


    container.appendChild(
        grid
    );

}


/*
 * ============================================================
 * LOAD SCOREBOARD
 * ============================================================
 *
 * Configuration convention:
 *
 *     favoriteTeams[0] -> primary / left
 *     favoriteTeams[1] -> secondary / right
 *
 * The server still receives the parameters it already expects:
 *
 *     leftTeam
 *     rightTeam
 *
 * This keeps the configuration simple while avoiding a need to
 * change the server contract at this stage.
 * ============================================================
 */

async function loadScoreboard(
    config
) {

    const favoriteTeams =
        Array.isArray(
            config?.favoriteTeams
        )
            ? config.favoriteTeams
            : [];


    const primaryTeam =
        favoriteTeams[0] || "";


    const secondaryTeam =
        favoriteTeams[1] || "";


    const params =
        new URLSearchParams();


    if (
        primaryTeam
    ) {

        params.set(
            "leftTeam",
            primaryTeam
        );

    }


    if (
        secondaryTeam
    ) {

        params.set(
            "rightTeam",
            secondaryTeam
        );

    }


    const query =
        params.toString();


    const url =
        query
            ? `/api/sports/nfl/scoreboard?${query}`
            : "/api/sports/nfl/scoreboard";


    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `NFL scoreboard request failed: ${response.status}`
        );

    }


    return response.json();

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

            "sports-scoreboard__sport",

            "sports-scoreboard__sport--nfl"

        );


        const root =
            document.createElement(
                "div"
            );


        root.className =
            "nfl-scoreboard";


        root.innerHTML = `

            <header class="nfl-header">

                <div class="nfl-title">

                    NFL SCOREBOARD

                </div>


                <div class="nfl-week">

                    LOADING...

                </div>

            </header>


            <main class="nfl-main">

                <section class="nfl-panel nfl-featured-panel">

                    <div class="nfl-panel-title">

                        FEATURED

                    </div>


                    <div class="nfl-featured-games">

                        <div
                            class="nfl-featured-slot"
                            data-featured="primary"
                        >

                            <div class="nfl-featured-message">

                                LOADING...

                            </div>

                        </div>


                        <div
                            class="nfl-featured-slot"
                            data-featured="secondary"
                        >

                            <div class="nfl-featured-message">

                                LOADING...

                            </div>

                        </div>

                    </div>

                </section>


                <section class="nfl-panel nfl-other-games-panel">

                    <div class="nfl-panel-title">

                        OTHER GAMES

                    </div>


                    <div class="nfl-league-games">

                        <div class="nfl-no-games">

                            LOADING...

                        </div>

                    </div>

                </section>

            </main>

        `;


        container.appendChild(
            root
        );


        const weekContainer =
            root.querySelector(
                ".nfl-week"
            );


        const primaryFeatured =
            root.querySelector(
                '[data-featured="primary"]'
            );


        const secondaryFeatured =
            root.querySelector(
                '[data-featured="secondary"]'
            );


        const otherGames =
            root.querySelector(
                ".nfl-league-games"
            );


        try {

            const scoreboard =
                await loadScoreboard(
                    config
                );


            weekContainer.textContent =
                scoreboard.weekLabel ||
                `WEEK ${scoreboard.week || ""}`;


            renderFeaturedGame(

                scoreboard
                    ?.featured
                    ?.left
                    ?.game ||
                    null,

                primaryFeatured

            );


            renderFeaturedGame(

                scoreboard
                    ?.featured
                    ?.right
                    ?.game ||
                    null,

                secondaryFeatured

            );


            renderGames(

                otherGames,

                scoreboard.games ||
                []

            );

        }

        catch (
            error
        ) {

            console.error(
                "Unable to load NFL scoreboard:",
                error
            );


            weekContainer.textContent =
                "";


            primaryFeatured.innerHTML = `

                <div class="nfl-featured-message">

                    UNABLE TO LOAD GAME

                </div>

            `;


            secondaryFeatured.innerHTML = `

                <div class="nfl-featured-message">

                    UNABLE TO LOAD GAME

                </div>

            `;


            otherGames.innerHTML = `

                <div class="nfl-no-games">

                    UNABLE TO LOAD SCORES

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