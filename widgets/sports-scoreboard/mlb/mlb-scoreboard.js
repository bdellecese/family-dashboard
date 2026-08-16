/*
 * ============================================================
 * MLB SCOREBOARD
 *
 * Fenway-inspired MLB scoreboard.
 *
 * Responsibilities:
 * - Load yesterday's MLB games
 * - Display AL / NL out-of-town scores
 * - Display one featured AL game
 * - Display one featured NL game
 * - Display inning-by-inning scoring
 * - Display R / H / E
 * - Display pitching decisions
 * - Display home runs
 * ============================================================
 */


const MLB_API =
    "https://statsapi.mlb.com/api/v1";

const MLB_LIVE_API = 
    "https://statsapi.mlb.com/api/v1.1";


/*
 * ============================================================
 * TEAM / LEAGUE DATA
 * ============================================================
 */

const AL_TEAMS = new Set([
    "LAA",
    "BAL",
    "BOS",
    "CWS",
    "CLE",
    "DET",
    "HOU",
    "KC",
    "MIN",
    "NYY",
    "ATH",
    "SEA",
    "TB",
    "TEX",
    "TOR"
]);


const TEAM_ABBR = {

    108: "LAA",
    109: "ARI",
    110: "BAL",
    111: "BOS",
    112: "CHC",
    113: "CIN",
    114: "CLE",
    115: "COL",
    116: "DET",
    117: "HOU",
    118: "KC",
    119: "LAD",
    120: "WSH",
    121: "NYM",
    133: "ATH",
    134: "PIT",
    135: "SD",
    136: "SEA",
    137: "SF",
    138: "STL",
    139: "TB",
    140: "TEX",
    141: "TOR",
    142: "MIN",
    143: "PHI",
    144: "ATL",
    145: "CWS",
    146: "MIA",
    147: "NYY",
    158: "MIL"

};


/*
 * ============================================================
 * TEAM HELPERS
 * ============================================================
 */

function getTeamCode(team) {

    return (
        TEAM_ABBR[team.id] ||
        team.abbreviation ||
        team.name
    );

}


function getLeague(team) {

    return AL_TEAMS.has(
        getTeamCode(team)
    )
        ? "American League"
        : "National League";

}


/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 *
 * MLB schedules are based on calendar dates.
 *
 * We determine "yesterday" using Eastern Time so the dashboard
 * doesn't accidentally roll over to the wrong date around
 * midnight.
 * ============================================================
 */

function getYesterday() {

    const now =
        new Date();


    const eastern =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    "America/New_York",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        ).formatToParts(now);


    const values = {};


    eastern.forEach(part => {

        values[part.type] =
            part.value;

    });


    const date =
        new Date(
            Number(values.year),
            Number(values.month) - 1,
            Number(values.day)
        );


    date.setDate(
        date.getDate() - 1
    );


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return {

        apiDate:
            `${year}-${month}-${day}`,

        date

    };

}


function formatDate(date) {

    return date
        .toLocaleDateString(
            "en-US",
            {
                weekday:
                    "long",

                month:
                    "long",

                day:
                    "numeric",

                year:
                    "numeric",

                timeZone:
                    "America/New_York"
            }
        )
        .toUpperCase();

}


/*
 * ============================================================
 * SCOREBOARD GAME HELPERS
 * ============================================================
 */

function splitIntoColumns(games) {

    const midpoint =
        Math.ceil(
            games.length / 2
        );


    return [

        games.slice(
            0,
            midpoint
        ),

        games.slice(
            midpoint
        )

    ];

}


function createGame(game) {

    const away =
        game.teams.away;


    const home =
        game.teams.home;


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "mlb-game";


    const awayRow =
        document.createElement(
            "div"
        );


    awayRow.className =
        "mlb-team-row";


    awayRow.innerHTML = `
        <span class="mlb-team">
            ${getTeamCode(away.team)}
        </span>

        <span class="mlb-score">
            ${away.score ?? "-"}
        </span>
    `;


    const homeRow =
        document.createElement(
            "div"
        );


    homeRow.className =
        "mlb-team-row";


    homeRow.innerHTML = `
        <span class="mlb-team">
            ${getTeamCode(home.team)}
        </span>

        <span class="mlb-score">
            ${home.score ?? "-"}
        </span>
    `;


    card.appendChild(
        awayRow
    );


    card.appendChild(
        homeRow
    );


    return card;

}


function renderLeagueScores(
    container,
    title,
    games
) {

    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const columns =
        splitIntoColumns(
            games
        );


    columns.forEach(
        columnGames => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "mlb-game-column";


            columnGames.forEach(
                game => {

                    column.appendChild(
                        createGame(game)
                    );

                }
            );


            container.appendChild(
                column
            );

        }
    );


    if (games.length === 0) {

        container.innerHTML = `
            <div class="mlb-no-games">
                NO GAMES
            </div>
        `;

    }

}


/*
 * ============================================================
 * INNING HELPERS
 * ============================================================
 */

function getDisplayInnings(
    linescore,
    side
) {

    const innings =
        linescore.innings || [];


    const regulation =
        innings.filter(
            inning =>
                inning.num <= 9
        );


    const extras =
        innings.filter(
            inning =>
                inning.num > 9
        );


    const display =
        regulation.map(
            inning => ({

                label:
                    inning.num,

                runs:
                    inning[side]?.runs ?? "-"

            })
        );


    if (extras.length > 0) {

        display.push({

            label:
                "X",

            runs:
                extras.reduce(
                    (
                        total,
                        inning
                    ) =>
                        total +
                        (
                            inning[side]?.runs ??
                            0
                        ),
                    0
                )

        });

    }


    return display;

}


/*
 * ============================================================
 * PLAYER / HOME RUN HELPERS
 * ============================================================
 */

function getDisplayName(
    fullName
) {

    const parts =
        fullName
            .trim()
            .split(
                /\s+/
            );


    const suffixes =
        new Set([
            "JR",
            "JR.",
            "SR",
            "SR.",
            "II",
            "III",
            "IV",
            "V"
        ]);


    const last =
        parts[
            parts.length - 1
        ].toUpperCase();


    if (
        suffixes.has(last) &&
        parts.length >= 2
    ) {

        return (
            `${parts[parts.length - 2]} ` +
            `${parts[parts.length - 1]}`
        );

    }


    return parts[
        parts.length - 1
    ];

}


function renderHomeRuns(
    allPlays
) {

    const homeRuns =
        new Map();


    allPlays.forEach(
        play => {

            if (
                play.result?.event !==
                "Home Run"
            ) {

                return;

            }


            const batter =
                play.matchup?.batter;


            if (!batter) {
                return;
            }


            const playerId =
                batter.id;


            const displayName =
                getDisplayName(
                    batter.fullName
                );


            const match =
                play.result
                    ?.description
                    ?.match(
                        /\((\d+)\)/
                    );


            const seasonTotal =
                match
                    ? parseInt(
                        match[1],
                        10
                    )
                    : null;


            if (
                !homeRuns.has(
                    playerId
                )
            ) {

                homeRuns.set(
                    playerId,
                    {
                        displayName,
                        gameTotal: 0,
                        seasonTotal
                    }
                );

            }


            const player =
                homeRuns.get(
                    playerId
                );


            player.gameTotal++;


            player.seasonTotal =
                seasonTotal;

        }
    );


    return Array.from(
        homeRuns.values()
    )
        .map(
            player => {

                const total =
                    player.seasonTotal ??
                    "?";


                if (
                    player.gameTotal === 1
                ) {

                    return (
                        `${player.displayName} (${total})`
                    );

                }


                return (
                    `${player.displayName} ` +
                    `${player.gameTotal} (${total})`
                );

            }
        );

}


/*
 * ============================================================
 * PITCHER RECORD
 * ============================================================
 */

async function getPitcherRecord(
    playerId,
    season
) {

    try {

        const response =
            await fetch(
                `${MLB_API}/people/${playerId}/stats?stats=season&group=pitching&season=${season}`
            );


        if (!response.ok) {
            return "";
        }


        const data =
            await response.json();


        const splits =
            data.stats?.[0]?.splits;


        if (
            !splits ||
            splits.length === 0
        ) {

            return "";

        }


        const pitching =
            splits[0].stat;


        let record =
            "";


        if (
            pitching.wins !== undefined &&
            pitching.losses !== undefined
        ) {

            record =
                `${pitching.wins}-${pitching.losses}`;

        }


        if (
            pitching.saves !== undefined &&
            pitching.saves > 0
        ) {

            record +=
                record
                    ? `, ${pitching.saves} SV`
                    : `${pitching.saves} SV`;

        }


        return record;

    }
    catch (error) {

        console.error(
            "Unable to load pitcher record:",
            error
        );


        return "";

    }

}


/*
 * ============================================================
 * FEATURED GAME
 * ============================================================
 */

async function renderFeaturedGame(
    teamId,
    container
) {

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="mlb-featured-message">
            LOADING...
        </div>
    `;


    const {
        apiDate
    } =
        getYesterday();


    try {

        /*
         * --------------------------------------------------------
         * Load schedule
         * --------------------------------------------------------
         */

        const scheduleResponse =
            await fetch(
                `${MLB_API}/schedule?sportId=1&date=${apiDate}`
            );


        if (!scheduleResponse.ok) {

            throw new Error(
                "Schedule request failed."
            );

        }


        const scheduleData =
            await scheduleResponse.json();


        const games =
            scheduleData.dates?.[0]?.games ||
            [];


        const featuredGame =
            games.find(
                game =>
                    game.teams.home.team.id === teamId ||
                    game.teams.away.team.id === teamId
            );


        if (!featuredGame) {

            container.innerHTML = `
                <div class="mlb-featured-message">
                    NO GAME
                </div>
            `;

            return;

        }


        /*
         * --------------------------------------------------------
         * Load game feed
         * --------------------------------------------------------
         */

        const feedResponse =
            await fetch(
                `${MLB_LIVE_API}/game/${featuredGame.gamePk}/feed/live`
            );


        if (!feedResponse.ok) {

            throw new Error(
                `Game feed request failed: ${feedResponse.status}`
            );

        }


        const feed =
            await feedResponse.json();


        const linescore =
            feed.liveData.linescore;


        const awayTeam =
            feed.gameData.teams.away;


        const homeTeam =
            feed.gameData.teams.home;


        const awayCode =
            getTeamCode(
                awayTeam
            );


        const homeCode =
            getTeamCode(
                homeTeam
            );


        /*
         * --------------------------------------------------------
         * Innings
         * --------------------------------------------------------
         */

        const awayInnings =
            getDisplayInnings(
                linescore,
                "away"
            );


        const homeInnings =
            getDisplayInnings(
                linescore,
                "home"
            );


        const inningHeaders =
            awayInnings
                .map(
                    inning =>
                        `<span>${inning.label}</span>`
                )
                .join("");


        const awayRuns =
            awayInnings
                .map(
                    inning =>
                        `<span>${inning.runs}</span>`
                )
                .join("");


        const homeRunsByInning =
            homeInnings
                .map(
                    inning =>
                        `<span>${inning.runs}</span>`
                )
                .join("");


        /*
         * --------------------------------------------------------
         * R / H / E
         * --------------------------------------------------------
         */

        const awayTotals = `
            <span>${linescore.teams.away.runs}</span>
            <span>${linescore.teams.away.hits}</span>
            <span>${linescore.teams.away.errors}</span>
        `;


        const homeTotals = `
            <span>${linescore.teams.home.runs}</span>
            <span>${linescore.teams.home.hits}</span>
            <span>${linescore.teams.home.errors}</span>
        `;


        /*
         * --------------------------------------------------------
         * Pitching decisions
         * --------------------------------------------------------
         */

        const decisions =
            feed.liveData.decisions;


        const decisionLines =
            [];


        const season =
            new Date().getFullYear();


        if (
            decisions?.winner
        ) {

            const record =
                await getPitcherRecord(
                    decisions.winner.id,
                    season
                );


            decisionLines.push(
                `WP ${decisions.winner.fullName}` +
                `${record ? ` (${record})` : ""}`
            );

        }


        if (
            decisions?.loser
        ) {

            const record =
                await getPitcherRecord(
                    decisions.loser.id,
                    season
                );


            decisionLines.push(
                `LP ${decisions.loser.fullName}` +
                `${record ? ` (${record})` : ""}`
            );

        }


        if (
            decisions?.save
        ) {

            const record =
                await getPitcherRecord(
                    decisions.save.id,
                    season
                );


            decisionLines.push(
                `SV ${decisions.save.fullName}` +
                `${record ? ` (${record})` : ""}`
            );

        }


        /*
         * --------------------------------------------------------
         * Home runs
         * --------------------------------------------------------
         */

        const homeRunList =
            renderHomeRuns(
                feed.liveData.plays?.allPlays || []
            );


        /*
         * --------------------------------------------------------
         * Game length
         * --------------------------------------------------------
         */

        const inningsPlayed =
            linescore.innings?.length || 0;


        const gameLength =
            inningsPlayed > 9
                ? `FINAL • ${inningsPlayed} INNINGS`
                : "FINAL";


        /*
         * --------------------------------------------------------
         * Render
         * --------------------------------------------------------
         */

        container.innerHTML = `

            <div class="mlb-box-score">

                <div class="mlb-inning-header">

                    <span></span>

                    ${inningHeaders}

                    <span>R</span>
                    <span>H</span>
                    <span>E</span>

                </div>


                <div class="mlb-inning-row">

                    <span class="mlb-team">
                        ${awayCode}
                    </span>

                    ${awayRuns}

                    ${awayTotals}

                </div>


                <div class="mlb-inning-row">

                    <span class="mlb-team">
                        ${homeCode}
                    </span>

                    ${homeRunsByInning}

                    ${homeTotals}

                </div>

            </div>


            <div class="mlb-decisions">

                <div class="mlb-game-length">
                    ${gameLength}
                </div>

                ${
                    decisionLines.length
                        ? decisionLines.join(
                            "&nbsp;&nbsp;&nbsp;"
                        )
                        : ""
                }

            </div>


            ${
                homeRunList.length
                    ? `
                        <div class="mlb-home-runs">
                            HR&nbsp;&nbsp;
                            ${homeRunList.join(", ")}
                        </div>
                    `
                    : ""
            }

        `;

    }
    catch (error) {

        console.error(
            "Unable to load featured MLB game:",
            error
        );


        container.innerHTML = `
            <div class="mlb-featured-message">
                UNABLE TO LOAD GAME
            </div>
        `;

    }

}


/*
 * ============================================================
 * SORT GAMES
 * ============================================================
 */

function sortGames(
    a,
    b
) {

    const aHome =
        getTeamCode(
            a.teams.home.team
        );


    const bHome =
        getTeamCode(
            b.teams.home.team
        );


    /*
     * Keep Boston first when present.
     */

    if (
        aHome === "BOS"
    ) {

        return -1;

    }


    if (
        bHome === "BOS"
    ) {

        return 1;

    }


    return aHome.localeCompare(
        bHome
    );

}


/*
 * ============================================================
 * LOAD SCHEDULE
 * ============================================================
 */

async function loadGames(
    apiDate
) {

    const response =
        await fetch(
            `${MLB_API}/schedule?sportId=1&date=${apiDate}`
        );


    if (!response.ok) {

        throw new Error(
            `MLB schedule request failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    return (
        data.dates?.[0]?.games ||
        []
    );

}


/*
 * ============================================================
 * RENDER LEAGUE
 * ============================================================
 */

function renderLeague(
    container,
    games
) {

    const finalGames =
        games
            .filter(
                game =>
                    game.status
                        ?.abstractGameState ===
                    "Final"
            )
            .sort(
                sortGames
            );


    renderLeagueScores(
        container,
        "",
        finalGames
    );

}


/*
 * ============================================================
 * RENDER FEATURED GAMES
 * ============================================================
 */

async function renderFeaturedGames(
    alContainer,
    nlContainer,
    config
) {

    const featured =
        config.featured || {};


    const alTeamId =
        featured.left?.teamId;


    const nlTeamId =
        featured.right?.teamId;


    await Promise.all([

        renderFeaturedGame(
            alTeamId,
            alContainer
        ),

        renderFeaturedGame(
            nlTeamId,
            nlContainer
        )

    ]);

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
            "sports-scoreboard__sport--mlb"
        );


        const {
            apiDate,
            date
        } =
            getYesterday();


        /*
         * --------------------------------------------------------
         * Root markup
         * --------------------------------------------------------
         */

        const root =
            document.createElement(
                "div"
            );


        root.className =
            "mlb-scoreboard";


        root.innerHTML = `

            <header class="mlb-header">

                <div class="mlb-title">
                    MLB SCOREBOARD
                </div>

                <div class="mlb-date">
                    ${formatDate(date)}
                </div>

            </header>


            <main class="mlb-main">


                <!-- AL FEATURED -->

                <section
                    class="mlb-panel mlb-al-featured"
                >

                    <div class="mlb-panel-title">
                        AL FEATURED
                    </div>

                    <div class="mlb-featured-game">
                    </div>

                </section>


                <!-- AL SCORES -->

                <section
                    class="mlb-panel mlb-al-scores"
                >

                    <div class="mlb-panel-title">
                        AMERICAN LEAGUE
                    </div>

                    <div class="mlb-league-games">
                    </div>

                </section>


                <!-- NL FEATURED -->

                <section
                    class="mlb-panel mlb-nl-featured"
                >

                    <div class="mlb-panel-title">
                        NL FEATURED
                    </div>

                    <div class="mlb-featured-game">
                    </div>

                </section>


                <!-- NL SCORES -->

                <section
                    class="mlb-panel mlb-nl-scores"
                >

                    <div class="mlb-panel-title">
                        NATIONAL LEAGUE
                    </div>

                    <div class="mlb-league-games">
                    </div>

                </section>


            </main>

        `;


        container.appendChild(
            root
        );


        /*
         * --------------------------------------------------------
         * Find containers
         * --------------------------------------------------------
         */

        const alFeatured =
            root.querySelector(
                ".mlb-al-featured .mlb-featured-game"
            );


        const alScores =
            root.querySelector(
                ".mlb-al-scores .mlb-league-games"
            );


        const nlFeatured =
            root.querySelector(
                ".mlb-nl-featured .mlb-featured-game"
            );


        const nlScores =
            root.querySelector(
                ".mlb-nl-scores .mlb-league-games"
            );


        /*
         * --------------------------------------------------------
         * Load MLB schedule
         * --------------------------------------------------------
         *
         * One schedule request is enough for the entire widget.
         * Featured game feeds are loaded separately.
         * --------------------------------------------------------
         */

        try {

            const games =
                await loadGames(
                    apiDate
                );


            const finalGames =
                games.filter(
                    game =>
                        game.status
                            ?.abstractGameState ===
                        "Final"
                );


            const americanLeague =
                finalGames
                    .filter(
                        game =>
                            getLeague(
                                game.teams.home.team
                            ) ===
                            "American League"
                    )
                    .sort(
                        sortGames
                    );


            const nationalLeague =
                finalGames
                    .filter(
                        game =>
                            getLeague(
                                game.teams.home.team
                            ) ===
                            "National League"
                    )
                    .sort(
                        sortGames
                    );


            /*
             * Render AL / NL scores.
             */

            renderLeague(
                alScores,
                americanLeague
            );


            renderLeague(
                nlScores,
                nationalLeague
            );


            /*
             * Render featured games.
             */

            await renderFeaturedGames(
                alFeatured,
                nlFeatured,
                config
            );

        }
        catch (error) {

            console.error(
                "Unable to load MLB scoreboard:",
                error
            );


            alScores.innerHTML = `
                <div class="mlb-no-games">
                    UNABLE TO LOAD SCORES
                </div>
            `;


            nlScores.innerHTML = `
                <div class="mlb-no-games">
                    UNABLE TO LOAD SCORES
                </div>
            `;


            alFeatured.innerHTML = `
                <div class="mlb-featured-message">
                    UNABLE TO LOAD GAME
                </div>
            `;


            nlFeatured.innerHTML = `
                <div class="mlb-featured-message">
                    UNABLE TO LOAD GAME
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