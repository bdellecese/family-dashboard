/*
 * ============================================================
 * SOCCER SCOREBOARD
 *
 * Soccer-specific scoreboard implementation.
 *
 * Layout:
 *
 * LEFT HALF
 * - Favorite-team games
 * - Detailed game cards
 *
 * RIGHT HALF
 * - Other games
 * - Grouped by league
 * - Compact score cards
 *
 * Server endpoint:
 *
 *     /api/sports/soccer/scoreboard
 *
 * Soccer-specific data logic belongs here.
 * ESPN API access belongs in the server-side soccer service.
 * ============================================================
 */

import {
    sportsPreferences
} from "../../../config/sports-preferences.js";

import {
    soccerRegistry
} from "../../../services/sports/soccer-registry.js";


function formatTeamName(
    team
) {

    return (
        team?.shortDisplayName ||
        team?.abbreviation ||
        team?.displayName ||
        team?.name ||
        ""
    );

}


function getTeamLogo(
    team
) {

    return (
        team?.logos?.[0]?.href ||
        ""
    );

}

function getCompetitionName(
    game
) {

    return (
        game?.league?.shortName ||
        game?.league?.name ||
        game?.competitions?.[0]?.league?.shortName ||
        game?.competitions?.[0]?.league?.name ||
        game?.competitions?.[0]?.altGameNote ||
        ""
    );

}

function getCompetitionDisplayName(
    game
) {

    const espnSlug =
        game?.league?.slug ||
        game?.competitions?.[0]?.league?.slug ||
        "";

    const registryEntry =
        Object.entries(
            soccerRegistry.competitions
        )
        .find(
            (
                [
                    ,
                    competition
                ]
            ) =>
                competition.slug ===
                espnSlug
        );

    const competitionKey =
        registryEntry?.[0] ||
        "";

    const soccerConfig =
        sportsPreferences
            ?.sports
            ?.find(
                sport =>
                    sport.sport ===
                    "soccer"
            );

    const configuredCompetition =
        soccerConfig
            ?.standings
            ?.competitions
            ?.find(
                competition =>
                    competition.competition ===
                    competitionKey
            );

    return (
        configuredCompetition?.displayName ||
        getCompetitionName(game)
    );

}

function getLeagueDisplayName(
    league
) {

    const soccerConfig =
        sportsPreferences
            ?.sports
            ?.find(
                sport =>
                    sport.sport ===
                    "soccer"
            );

    const leagueMap = {
        "English Premier League":
            "premierLeague",
        "Serie A":
            "serieA",
        "LALIGA":
            "laLiga",
        "MLS":
            "mls"
    };

    const competitionKey =
        leagueMap[league];

    const configuredCompetition =
        soccerConfig
            ?.standings
            ?.competitions
            ?.find(
                competition =>
                    competition.competition ===
                    competitionKey
            );

    return (
        configuredCompetition?.displayName ||
        league
    );

}

function formatGameDate(
    date
) {

    if (!date) {
        return "";
    }

    const gameDate =
        new Date(
            date
        );

    if (
        Number.isNaN(
            gameDate.getTime()
        )
    ) {
        return "";
    }

    return gameDate
        .toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        )
        .toUpperCase();

}

function getVenueName(
    game
) {

    return (
        game?.competitions?.[0]?.venue?.fullName ||
        game?.competitions?.[0]?.venue?.name ||
        game?.venue?.fullName ||
        game?.venue?.name ||
        ""
    );

}

function getStatusText(
    game
) {

    const status =
        game?.competitions?.[0]?.status;


    if (
        status?.type?.completed
    ) {

        return (
            status.type.detail ||
            "FINAL"
        );

    }


    if (
        status?.type?.state ===
        "in"
    ) {

        return (
            status.type.detail ||
            "LIVE"
        );

    }


    return "UPCOMING";

}


function getCompetitors(
    game
) {

    const competitors =
        game?.competitions?.[0]?.competitors ||
        [];


    const home =
        competitors.find(
            team =>
                team.homeAway ===
                "home"
        );


    const away =
        competitors.find(
            team =>
                team.homeAway ===
                "away"
        );


    if (
        !home ||
        !away
    ) {

        return null;

    }


    return {
        home,
        away
    };

}


function renderFavoriteGame(
    game
) {

    const competitors =
        getCompetitors(
            game
        );


    if (
        !competitors
    ) {

        return "";

    }

    const competition =
        getCompetitionDisplayName(
            game
        );

    const status =
        getStatusText(
            game
        );

    const gameDate =
        formatGameDate(
            game?.date
        );

    const venue =
        getVenueName(
            game
        );

    const away =
        competitors.away;


    const home =
        competitors.home;


    const awayLogo =
        getTeamLogo(
            away.team
        );


    const homeLogo =
        getTeamLogo(
            home.team
        );


    const awayName =
        formatTeamName(
            away.team
        );


    const homeName =
        formatTeamName(
            home.team
        );


    const awayScore =
        away.score?.displayValue ??
        away.score?.value ??
        "";


    const homeScore =
        home.score?.displayValue ??
        home.score?.value ??
        "";


    const scorers =
        game?.scorers ||
        {
            away: [],
            home: []
        };


    const renderScorers =
        list => {

            if (
                !Array.isArray(
                    list
                ) ||
                list.length === 0
            ) {

                return "";

            }


            return list
                .map(
                    scorer => `
                        <div
                            class="soccer-scoreboard__scorer"
                        >

                            <span
                                class="soccer-scoreboard__scorer-ball"
                            >
                                ⚽
                            </span>

                            <span
                                class="soccer-scoreboard__scorer-name"
                            >
                                ${scorer.name}
                                ${
                                    scorer.ownGoal
                                        ? " (OG)"
                                        : ""
                                }
                            </span>

                            ${
                                scorer.times?.length
                                    ? `
                                        <span
                                            class="soccer-scoreboard__scorer-time"
                                        >
                                            ${scorer.times.join(
                                                ", "
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>
                    `
                )
                .join("");
        };


    return `
        <article
            class="soccer-scoreboard__featured-game"
        >

            <div
                class="soccer-scoreboard__featured-match"
            >

                <div
                    class="soccer-scoreboard__featured-team soccer-scoreboard__featured-team--away"
                >

                    ${
                        awayLogo
                            ? `
                                <img
                                    class="soccer-scoreboard__featured-logo"
                                    src="${awayLogo}"
                                    alt=""
                                >
                            `
                            : ""
                    }

                    <div
                        class="soccer-scoreboard__featured-team-name"
                    >
                        ${awayName}
                    </div>

                </div>


                <div
                    class="soccer-scoreboard__featured-score"
                >

                    <span>
                        ${awayScore}
                    </span>

                    <span
                        class="soccer-scoreboard__featured-dash"
                    >
                        –
                    </span>

                    <span>
                        ${homeScore}
                    </span>

                </div>


                <div
                    class="soccer-scoreboard__featured-team soccer-scoreboard__featured-team--home"
                >

                    <div
                        class="soccer-scoreboard__featured-team-name"
                    >
                        ${homeName}
                    </div>

                    ${
                        homeLogo
                            ? `
                                <img
                                    class="soccer-scoreboard__featured-logo"
                                    src="${homeLogo}"
                                    alt=""
                                >
                            `
                            : ""
                    }

                </div>


                <div
                    class="soccer-scoreboard__featured-meta"
                >
                    <span>
                        ${status}
                    </span>

                    ${
                        gameDate
                            ? `
                                <span
                                    class="soccer-scoreboard__featured-meta-separator"
                                >
                                    •
                                </span>

                                <span>
                                    ${gameDate}
                                </span>
                            `
                            : ""
                    }

                    ${
                        competition
                            ? `
                                <span
                                    class="soccer-scoreboard__featured-meta-separator"
                                >
                                    •
                                </span>

                                <span>
                                    ${competition}
                                </span>
                            `
                            : ""
                    }

                    ${
                        venue
                            ? `
                                <span
                                    class="soccer-scoreboard__featured-meta-separator"
                                >
                                    •
                                </span>

                                <span>
                                    ${venue}
                                </span>
                            `
                            : ""
                    }

                </div>

                <div
                    class="soccer-scoreboard__featured-scorers soccer-scoreboard__featured-scorers--away"
                >
                    ${renderScorers(
                        scorers.away
                    )}
                </div>


                <div
                    class="soccer-scoreboard__featured-scorers soccer-scoreboard__featured-scorers--home"
                >
                    ${renderScorers(
                        scorers.home
                    )}
                </div>

            </div>

        </article>
    `;

}

function renderOtherGame(
    game
) {

    const competitors =
        getCompetitors(
            game
        );


    if (
        !competitors
    ) {

        return "";

    }

    const away =
        competitors.away;


    const home =
        competitors.home;


    const awayName =
        formatTeamName(
            away.team
        );


    const homeName =
        formatTeamName(
            home.team
        );


    const awayScore =
        away.score?.displayValue ??
        away.score?.value ??
        away.score ??
        "";


    const homeScore =
        home.score?.displayValue ??
        home.score?.value ??
        home.score ??
        "";


    const status =
        getStatusText(
            game
        );

    const gameDate =
        formatGameDate(
            game?.date
        );
    
    const venue =
        getVenueName(
            game
        );


    return `
        <article
            class="soccer-scoreboard__other-game"
        >

            <div
                class="soccer-scoreboard__other-status"
            >
                ${status}

                ${
                    gameDate
                        ? `
                            <span>
                                •
                            </span>

                            <span>
                                ${gameDate}
                            </span>
                        `
                        : ""
                }

                ${
                    venue
                        ? `
                            <span>
                                •
                            </span>

                            <span>
                                ${venue}
                            </span>
                        `
                        : ""
                }
            </div>

            <div
                class="soccer-scoreboard__other-team-row"
            >

                <span
                    class="soccer-scoreboard__other-team"
                >
                    ${awayName}
                </span>

                <strong
                    class="soccer-scoreboard__other-score"
                >
                    ${awayScore}
                </strong>

            </div>


            <div
                class="soccer-scoreboard__other-team-row"
            >

                <span
                    class="soccer-scoreboard__other-team"
                >
                    ${homeName}
                </span>

                <strong
                    class="soccer-scoreboard__other-score"
                >
                    ${homeScore}
                </strong>

            </div>

        </article>
    `;

}


function groupOtherGamesByLeague(
    games
) {

    const groups =
        new Map();


    for (
        const game
        of games
    ) {

        const league =
            getCompetitionName(
                game
            ) ||
            "OTHER";


        if (
            !groups.has(
                league
            )
        ) {

            groups.set(
                league,
                []
            );

        }


        groups
            .get(league)
            .push(game);

    }


    return [
        ...groups.entries()
    ];

}


function formatScoreboardDate(
    date
) {

    const dateValue =
        date ||
        new Date();


    let scoreboardDate;


    if (
        typeof dateValue ===
        "string"
    ) {

        const parts =
            dateValue.split("-");


        if (
            parts.length === 3
        ) {

            const year =
                Number(parts[0]);

            const month =
                Number(parts[1]) - 1;

            const day =
                Number(parts[2]);


            scoreboardDate =
                new Date(
                    year,
                    month,
                    day
                );

        }
        else {

            scoreboardDate =
                new Date(
                    dateValue
                );

        }

    }
    else {

        scoreboardDate =
            dateValue;

    }


    if (
        Number.isNaN(
            scoreboardDate.getTime()
        )
    ) {

        return "";

    }


    return scoreboardDate
        .toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        )
        .toUpperCase();

}


export default {

    async render(
        container,
        sportConfig = {}
    ) {

        const testDate =
            sportConfig.testDate ||
            null;

        container.innerHTML = `
            <div
                class="soccer-scoreboard__loading"
            >
                LOADING SOCCER
            </div>
        `;


        try {

            const endpoint =
                testDate
                    ? `/api/sports/soccer/scoreboard?date=${encodeURIComponent(testDate)}`
                    : "/api/sports/soccer/scoreboard";


            const response =
                await fetch(
                    endpoint
                );

            if (
                !response.ok
            ) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const data =
                await response.json();


            const favoriteGames =
                Array.isArray(
                    data.favoriteGames
                )
                    ? data.favoriteGames
                    : [];


            const otherGames =
                Array.isArray(
                    data.otherGames
                )
                    ? data.otherGames
                    : [];


            if (
                favoriteGames.length === 0 &&
                otherGames.length === 0
            ) {

                container.innerHTML = `
                    <div
                        class="soccer-scoreboard__empty"
                    >
                        NO SOCCER GAMES TODAY
                    </div>
                `;

                return;

            }


            const leagueGroups =
                groupOtherGamesByLeague(
                    otherGames
                );


            container.innerHTML = `
                <div
                    class="soccer-scoreboard"
                >
                    <header
                        class="soccer-scoreboard__header"
                    >

                        <div
                            class="soccer-scoreboard__title"
                        >
                            SOCCER SCOREBOARD
                        </div>

                        <div
                            class="soccer-scoreboard__date"
                        >
                            ${formatScoreboardDate(
                                testDate
                            )}
                        </div>

                    </header>

                    <section
                        class="soccer-scoreboard__favorites"
                    >

                        <div
                            class="soccer-scoreboard__section-title"
                        >
                            FAVORITES
                        </div>

                        <div
                            class="soccer-scoreboard__featured-games"
                        >

                            ${favoriteGames
                                .map(
                                    game =>
                                        renderFavoriteGame(
                                            game
                                        )
                                )
                                .join("")}

                        </div>

                    </section>


                    <section
                        class="soccer-scoreboard__other"
                    >

                        <div
                            class="soccer-scoreboard__section-title"
                        >
                            OTHER GAMES
                        </div>

                        <div
                            class="soccer-scoreboard__league-groups"
                        >

                            ${leagueGroups
                                .map(
                                    (
                                        [
                                            league,
                                            leagueGames
                                        ]
                                    ) => `
                                        <div
                                            class="soccer-scoreboard__league"
                                        >

                                            <div
                                                class="soccer-scoreboard__league-title"
                                            >
                                                ${getCompetitionDisplayName(
                                                    leagueGames[0]
                                                ) || league}
                                            </div>

                                            <div
                                                class="soccer-scoreboard__other-games"
                                            >

                                                ${leagueGames
                                                    .map(
                                                        game =>
                                                            renderOtherGame(
                                                                game
                                                            )
                                                    )
                                                    .join("")}

                                            </div>

                                        </div>
                                    `
                                )
                                .join("")}

                        </div>

                    </section>

                </div>
            `;

        }
        catch (
            error
        ) {

            console.error(
                "Soccer scoreboard error:",
                error
            );


            container.innerHTML = `
                <div
                    class="soccer-scoreboard__empty"
                >
                    SOCCER DATA UNAVAILABLE
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