/*
 * ============================================================
 * SOCCER STANDINGS
 *
 * Soccer-specific standings renderer.
 *
 * Each competition displays:
 *
 * # | TEAM | P | W-D-L | GF | GA | GD | PTS
 *
 * Configured competitions:
 *
 *     Premier League
 *     Serie A
 *     La Liga
 *     Ligue 1
 *     Primeira Liga
 *     MLS
 *
 * Top 5 teams are displayed for each competition.
 *
 * Favorite teams can be emphasized within their respective
 * league standings.
 *
 * ============================================================
 */

import {
    sportsPreferences
} from "../../../config/sports-preferences.js";

import {
    soccerRegistry
} from "../../../services/sports/soccer-registry.js";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function createElement(
    tag,
    className,
    text = ""
) {

    const element =
        document.createElement(
            tag
        );


    if (
        className
    ) {

        element.className =
            className;

    }


    if (
        text !== ""
    ) {

        element.textContent =
            text;

    }


    return element;

}


/*
 * ============================================================
 * SOCCER CONFIG
 * ============================================================
 */

function getSoccerConfig() {

    return sportsPreferences.sports?.find(
        sport =>
            sport.sport === "soccer"
    );

}


function getStandingsConfig() {

    return (
        getSoccerConfig()
            ?.standings ||
        {}
    );

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
        record?.team || {};


    return (
        team.shortDisplayName ||
        team.displayName ||
        team.name ||
        team.location ||
        "???"
    );

}


/*
 * ============================================================
 * TEAM LOGO
 * ============================================================
 */

function getTeamLogoUrl(
    record
) {

    const logo =
        record?.team
            ?.logos
            ?.find(
                item =>
                    item.href
            );


    return (
        logo?.href ||
        ""
    );

}


/*
 * ============================================================
 * STAT HELPER
 * ============================================================
 */

function getStat(
    record,
    name,
    fallback = 0
) {

    const stat =
        record?.stats?.find(
            item =>
                item.name === name
        );


    if (
        stat?.value !== undefined
    ) {

        return stat.value;

    }


    return fallback;

}


/*
 * ============================================================
 * RECORD
 * ============================================================
 */

function getRecord(
    record
) {

    const wins =
        getStat(
            record,
            "wins"
        );


    const draws =
        getStat(
            record,
            "ties"
        );


    const losses =
        getStat(
            record,
            "losses"
        );


    return (
        `${wins}-${draws}-${losses}`
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
            "soccer-standings-columns"
        );


    header.innerHTML = `
        <span>#</span>
        <span>TEAM</span>
        <span>P</span>
        <span>W-D-L</span>
        <span>GF</span>
        <span>GA</span>
        <span>GD</span>
        <span>PTS</span>
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
    isFavorite = false
) {

    const row =
        createElement(
            "div",
            "soccer-standings-team"
        );

    if (
        isFavorite
    ) {

        row.classList.add(
            "soccer-standings-favorite"
        );

    }

    const gamesPlayed =
        getStat(
            record,
            "gamesPlayed"
        );


    const goalsFor =
        getStat(
            record,
            "pointsFor"
        );


    const goalsAgainst =
        getStat(
            record,
            "pointsAgainst"
        );


    const goalDifference =
        getStat(
            record,
            "pointDifferential"
        );


    const points =
        getStat(
            record,
            "points"
        );


    const logoUrl =
        getTeamLogoUrl(
            record
        );


    const logo =
        logoUrl
            ? `
                <img
                    class="soccer-standings-team-logo"
                    src="${logoUrl}"
                    alt=""
                    aria-hidden="true"
                >
            `
            : "";


    row.innerHTML = `
        <span class="soccer-standings-rank">
            ${rank}
        </span>

        <span class="soccer-standings-team-name">
            ${logo}
            <span class="soccer-standings-team-abbreviation">
                ${getTeamName(record)}
            </span>
        </span>

        <span class="soccer-standings-games-played">
            ${gamesPlayed}
        </span>

        <span class="soccer-standings-record">
            ${getRecord(record)}
        </span>

        <span class="soccer-standings-goals-for">
            ${goalsFor}
        </span>

        <span class="soccer-standings-goals-against">
            ${goalsAgainst}
        </span>

        <span class="soccer-standings-goal-difference">
            ${goalDifference}
        </span>

        <span class="soccer-standings-points">
            ${points}
        </span>
    `;


    return row;

}


/*
 * ============================================================
 * SORT STANDINGS
 * ============================================================
 *
 * ESPN normally provides standings in rank order.
 *
 * We explicitly sort by rank when available so that the
 * renderer does not depend on array ordering.
 *
 * ============================================================
 */

function sortStandings(
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
                        getStat(
                            a,
                            "rank",
                            Number.MAX_SAFE_INTEGER
                        )
                    );


                const bRank =
                    Number(
                        getStat(
                            b,
                            "rank",
                            Number.MAX_SAFE_INTEGER
                        )
                    );


                if (
                    aRank !== bRank
                ) {

                    return (
                        aRank -
                        bRank
                    );

                }


                return (
                    getStat(
                        b,
                        "points"
                    ) -
                    getStat(
                        a,
                        "points"
                    )
                );

            }
        );

}

/*
 * ============================================================
 * FAVORITE TEAM HELPERS
 * ============================================================
 */

function getFavoriteTeams() {

    return (
        getSoccerConfig()
            ?.favoriteTeams ||
        []
    );

}


function getTeamId(
    record
) {

    return String(
        record?.team?.id ||
        ""
    );

}


function getFavoriteTeamIds() {

    const favorites =
        getFavoriteTeams();


    return favorites
        .map(
            favorite => {

                const team =
                    soccerRegistry
                        ?.teams
                        ?.[favorite];


                return String(
                    team?.id ||
                    ""
                );

            }
        )
        .filter(
            id =>
                id !== ""
        );

}


/*
 * ============================================================
 * DISPLAY RECORDS
 * ============================================================
 *
 * Return the top N teams plus any configured favorite teams
 * that fall outside the top N.
 *
 * ============================================================
 */

function getDisplayRecords(
    records,
    topTeams
) {

    const sorted =
        sortStandings(
            records
        );


    const displayRecords =
        sorted.slice(
            0,
            topTeams
        );


    const displayedIds =
        new Set(
            displayRecords.map(
                record =>
                    getTeamId(
                        record
                    )
            )
        );


    const favoriteIds =
        new Set(
            getFavoriteTeamIds()
        );


    sorted
        .filter(
            record =>
                favoriteIds.has(
                    getTeamId(
                        record
                    )
                )
        )
        .forEach(
            record => {

                const teamId =
                    getTeamId(
                        record
                    );


                if (
                    !displayedIds.has(
                        teamId
                    )
                ) {

                    displayRecords.push(
                        record
                    );

                    displayedIds.add(
                        teamId
                    );

                }

            }
        );


    return displayRecords;

}


/*
 * ============================================================
 * LOAD COMPETITION STANDINGS
 * ============================================================
 */

async function loadStandings(
    competition
) {

    const response =
        await fetch(
            `/api/sports/soccer/standings?competition=${encodeURIComponent(
                competition
            )}`
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Soccer standings request failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    const entries =
        data
            ?.standings
            ?.children
            ?.flatMap(
                child =>
                    child
                        ?.standings
                        ?.entries ||
                    []
            ) ||
        [];


    return entries;

}


/*
 * ============================================================
 * CREATE COMPETITION
 * ============================================================
 */

function createCompetition(
    competition,
    records,
    topTeams
) {

    const section =
        createElement(
            "section",
            "soccer-standings-competition"
        );


    const title =
        createElement(
            "div",
            "soccer-standings-competition-title",
            competition.displayName ||
                competition.competition
        );


    section.appendChild(
        title
    );


    const card =
        createElement(
            "div",
            "soccer-standings-card"
        );


    card.appendChild(
        createHeader()
    );


    const displayRecords =
        getDisplayRecords(
            records,
            topTeams
        );


    displayRecords.forEach(
        (
            record,
            index
        ) => {

            const teamId =
                getTeamId(
                    record
                );


            const isFavorite =
                getFavoriteTeamIds()
                    .includes(
                        teamId
                    );


            const row =
                createTeamRow(
                    record,
                    getStat(
                        record,
                        "rank",
                        index + 1
                    ),
                    isFavorite
                );


            if (
                index === 0
            ) {

                row.classList.add(
                    "soccer-standings-leader"
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
 * CREATE MESSAGE
 * ============================================================
 */

function createMessage(
    text
) {

    return createElement(
        "div",
        "soccer-standings-message",
        text
    );

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
            "sports-standings__sport--soccer"
        );


        const root =
            createElement(
                "div",
                "soccer-standings"
            );


        root.innerHTML = `
            <header class="soccer-standings-header">

                <div class="soccer-standings-title">
                    SOCCER STANDINGS
                </div>

                <div class="soccer-standings-date">
                    ${new Intl.DateTimeFormat(
                        "en-US",
                        {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        }
                    ).format(
                        new Date()
                    )}
                </div>

            </header>

            <main class="soccer-standings-main">

                <div class="soccer-standings-loading">
                    LOADING STANDINGS...
                </div>

            </main>
        `;


        container.appendChild(
            root
        );


        const main =
            root.querySelector(
                ".soccer-standings-main"
            );


        try {

            const standingsConfig =
                getStandingsConfig();


            const competitions =
                standingsConfig
                    .competitions ||
                [];


            const topTeams =
                Number(
                    standingsConfig.topTeams
                ) ||
                5;


            if (
                competitions.length === 0
            ) {

                main.innerHTML =
                    "";


                main.appendChild(
                    createMessage(
                        "SOCCER STANDINGS UNAVAILABLE"
                    )
                );


                return;

            }


            const results =
                await Promise.all(
                    competitions.map(
                        async competition => {

                            try {

                                const records =
                                    await loadStandings(
                                        getCompetitionSlug(
                                            competition
                                        )
                                    );


                                return {
                                    competition,
                                    records,
                                    error: null
                                };

                            }
                            catch (
                                error
                            ) {

                                console.error(
                                    `Unable to load ${competition.displayName || competition.competition} standings:`,
                                    error
                                );


                                return {
                                    competition,
                                    records: [],
                                    error
                                };

                            }

                        }
                    )
                );


            main.innerHTML =
                "";


            const available =
                results.filter(
                    result =>
                        result.records.length > 0
                );


            if (
                available.length === 0
            ) {

                main.appendChild(
                    createMessage(
                        "UNABLE TO LOAD STANDINGS"
                    )
                );


                return;

            }


            const grid =
                createElement(
                    "div",
                    "soccer-standings-grid"
                );


            available.forEach(
                result => {

                    grid.appendChild(
                        createCompetition(
                            result.competition,
                            result.records,
                            topTeams
                        )
                    );

                }
            );


            main.appendChild(
                grid
            );

        }
        catch (
            error
        ) {

            console.error(
                "Unable to load soccer standings:",
                error
            );


            main.innerHTML =
                "";


            main.appendChild(
                createMessage(
                    "UNABLE TO LOAD STANDINGS"
                )
            );

        }

    },


    async destroy(
        container
    ) {

        container.innerHTML =
            "";

    }

};


/*
 * ============================================================
 * COMPETITION SLUG
 * ============================================================
 */

function getCompetitionSlug(competition) {

    const registryCompetition =
        soccerRegistry
            ?.competitions
            ?.[competition.competition];

    return (
        registryCompetition?.slug ||
        competition.competition
    );
}