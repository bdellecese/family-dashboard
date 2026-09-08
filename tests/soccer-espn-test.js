const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

const competitions = {
    premierLeague: "eng.1",
    serieA: "ita.1",
    laLiga: "esp.1",
    ligue1: "fra.1",
    bundesliga: "ger.1",
    primeiraLiga: "por.1",
    mls: "usa.1",
    worldCup: "fifa.world"
};

const favoriteTeams = {
    "inter-milan": {
        name: "Inter Milan",
        league: "ita.1"
    },
    "inter-miami": {
        name: "Inter Miami",
        league: "usa.1"
    },
    "manchester-city": {
        name: "Manchester City",
        league: "eng.1"
    },
    "barcelona": {
        name: "Barcelona",
        league: "esp.1"
    },
    "real-madrid": {
        name: "Real Madrid",
        league: "esp.1"
    },
    "usmnt": {
        name: "United States",
        league: "fifa.world"
    },
    "italy": {
        name: "Italy",
        league: "fifa.world"
    },
    "portugal": {
        name: "Portugal",
        league: "fifa.world"
    }
};

async function getJson(url) {

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.json();
}


/*
 * ============================================================
 * TEST 1 — COMPETITION SLUGS
 * ============================================================
 */

console.log("\n============================================================");
console.log("TEST 1 — ESPN COMPETITION SLUGS");
console.log("============================================================");

for (const [name, slug] of Object.entries(competitions)) {

    try {

        const url = `${BASE}/${slug}/scoreboard`;

        const data = await getJson(url);

        console.log(
            `✓ ${name.padEnd(18)} ${slug.padEnd(10)} — ${data.league?.name || "OK"}`
        );

    } catch (error) {

        console.log(
            `✗ ${name.padEnd(18)} ${slug.padEnd(10)} — ${error.message}`
        );

    }

}


/*
 * ============================================================
 * TEST 2 — FAVORITE TEAM RESOLUTION
 * ============================================================
 */

console.log("\n============================================================");
console.log("TEST 2 — FAVORITE TEAM RESOLUTION");
console.log("============================================================");

for (const [key, teamConfig] of Object.entries(favoriteTeams)) {

    try {

        const url =
            `${BASE}/${teamConfig.league}/teams`;

        const data = await getJson(url);

        const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];

        const match = teams.find(item => {

            const team = item.team;

            const search = teamConfig.name.toLowerCase();

            return (
                team.displayName?.toLowerCase() === search ||
                team.shortDisplayName?.toLowerCase() === search ||
                team.name?.toLowerCase() === search ||
                team.abbreviation?.toLowerCase() === search
            );

        });

        if (!match) {

            console.log(
                `✗ ${key.padEnd(20)} — NOT FOUND`
            );

            continue;
        }

        const team = match.team;

        console.log(
            `✓ ${key.padEnd(20)} — ESPN ID ${team.id} — ${team.displayName}`
        );

        console.log(
            `  logo: ${team.logos?.[0]?.href || "none"}`
        );

    } catch (error) {

        console.log(
            `✗ ${key.padEnd(20)} — ${error.message}`
        );

    }

}

/*
 * ============================================================
 * TEST 5 — DEBUG UNRESOLVED TEAMS
 * ============================================================
 */

console.log("\n============================================================");
console.log("TEST 5 — DEBUG UNRESOLVED TEAMS");
console.log("============================================================");

const debugTeams = [
    {
        search: "miami",
        league: "usa.1"
    },
    {
        search: "italy",
        league: "fifa.world"
    }
];

for (const item of debugTeams) {

    try {

        const url =
            `${BASE}/${item.league}/teams`;

        const data = await getJson(url);

        const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];

        console.log(`\nSearching ${item.league} for "${item.search}"`);

        const matches = teams
            .map(item => item.team)
            .filter(team => {

                const text = [
                    team.displayName,
                    team.shortDisplayName,
                    team.name,
                    team.abbreviation,
                    team.slug
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes(item.search.toLowerCase());
            });

        if (matches.length === 0) {

            console.log("  No matches found.");

        } else {

            for (const team of matches) {

                console.log(
                    `  ID ${team.id} — ${team.displayName}`
                );

                console.log(
                    `  short: ${team.shortDisplayName || "none"}`
                );

                console.log(
                    `  name: ${team.name || "none"}`
                );

                console.log(
                    `  abbreviation: ${team.abbreviation || "none"}`
                );

                console.log(
                    `  slug: ${team.slug || "none"}`
                );

                console.log(
                    `  logo: ${team.logos?.[0]?.href || "none"}`
                );
            }

        }

    } catch (error) {

        console.log(
            `✗ ${item.league} — ${error.message}`
        );

    }

}

/*
 * ============================================================
 * TEST 6 — FIND ITALY ACROSS ESPN SOCCER LEAGUES
 * ============================================================
 */

console.log("\n============================================================");
console.log("TEST 6 — FIND ITALY");
console.log("============================================================");

const italySearchLeagues = [
    "fifa.world",
    "uefa.euro",
    "uefa.nations",
    "uefa.nations-league"
];

for (const league of italySearchLeagues) {

    try {

        const url =
            `${BASE}/${league}/teams`;

        const response = await fetch(url);

        if (!response.ok) {

            console.log(
                `✗ ${league.padEnd(22)} — ${response.status} ${response.statusText}`
            );

            continue;
        }

        const data = await response.json();

        const teams =
            data.sports?.[0]?.leagues?.[0]?.teams || [];

        const matches = teams
            .map(item => item.team)
            .filter(team => {

                const text = [
                    team.displayName,
                    team.shortDisplayName,
                    team.name,
                    team.abbreviation,
                    team.slug
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes("ital");
            });

        if (matches.length === 0) {

            console.log(
                `✓ ${league.padEnd(22)} — endpoint works, Italy not listed`
            );

        } else {

            for (const team of matches) {

                console.log(
                    `✓ ${league.padEnd(22)} — ID ${team.id} — ${team.displayName}`
                );

                console.log(
                    `  short: ${team.shortDisplayName || "none"}`
                );

                console.log(
                    `  abbreviation: ${team.abbreviation || "none"}`
                );

                console.log(
                    `  slug: ${team.slug || "none"}`
                );

                console.log(
                    `  logo: ${team.logos?.[0]?.href || "none"}`
                );

            }

        }

    } catch (error) {

        console.log(
            `✗ ${league.padEnd(22)} — ${error.message}`
        );

    }

}

// ============================================================
// TEST 11 — ESPN "all" competition team schedule
// ============================================================

async function test11() {

    console.log("\n=== TEST 11 — ESPN all-competition team schedule ===\n");

    const teamId = 110; // Inter Milan

    const urls = [
        `https://site.web.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule`,
        `https://site.web.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule?fixture=true`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule?fixture=true`
    ];

    for (const url of urls) {

        console.log(`\nURL: ${url}`);

        try {

            const response = await fetch(url);

            console.log(`HTTP ${response.status}`);

            if (!response.ok) {
                console.log("✗ FAILED");
                continue;
            }

            const data = await response.json();

            const events = data.events || [];

            console.log(`✓ Events: ${events.length}`);

            for (const event of events) {

                const competition =
                    event.competitions?.[0];

                const competitors =
                    competition?.competitors || [];

                const home =
                    competitors.find(c => c.homeAway === "home");

                const away =
                    competitors.find(c => c.homeAway === "away");

                console.log(
                    `${event.date} | ` +
                    `${away?.team?.displayName || "?"} ` +
                    `vs ` +
                    `${home?.team?.displayName || "?"} | ` +
                    `${competition?.status?.type?.shortDetail || "?"} | ` +
                    `${event.season?.displayName || "?"} | ` +
                    `${event.league?.name || event.season?.displayName || "?"}`
                );
            }

        } catch (error) {

            console.log(`✗ ERROR: ${error.message}`);

        }
    }
}

await test11();

// ============================================================
// TEST 13 — ESPN cross-competition match summary
// ============================================================

async function test13() {

    console.log("\n=== TEST 13 — ESPN Club Friendly match summary ===\n");

    const league = "club.friendly";
    const eventId = "401905173";

    const url =
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`;

    console.log(`URL: ${url}`);

    try {

        const response = await fetch(url);

        console.log(`HTTP ${response.status}`);

        if (!response.ok) {
            console.log("✗ FAILED");
            return;
        }

        const data = await response.json();

        console.log("✓ Summary loaded");

        console.log(
            `Event: ${data.header?.competitions?.[0]?.id || "?"}`
        );

        console.log(
            `League: ${data.header?.league?.name || "?"}`
        );

        console.log(
            `League Slug: ${data.header?.league?.slug || "?"}`
        );

        console.log(
            `Season: ${data.header?.season?.displayName || "?"}`
        );

        console.log(
            `Key events: ${data.keyEvents?.length || 0}`
        );

        const scoringEvents =
            (data.keyEvents || []).filter(
                event => event.scoringPlay === true
            );

        console.log(
            `Scoring plays: ${scoringEvents.length}`
        );

        for (const event of scoringEvents) {

            console.log(
                `GOAL: ${event.clock?.displayValue || "?"} | ` +
                `${event.participants?.[0]?.athlete?.displayName || "?"} | ` +
                `${event.text || ""}`
            );
        }

    } catch (error) {

        console.log(`✗ ERROR: ${error.message}`);

    }
}

await test13();

// ============================================================
// TEST 14 — Inspect structured scoring event
// ============================================================

async function test14() {

    console.log("\n=== TEST 14 — ESPN scoring event structure ===\n");

    const league = "club.friendly";
    const eventId = "401905173";

    const url =
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`;

    console.log(`URL: ${url}`);

    try {

        const response = await fetch(url);

        console.log(`HTTP ${response.status}`);

        if (!response.ok) {
            console.log("✗ FAILED");
            return;
        }

        const data = await response.json();

        const scoringEvents =
            (data.keyEvents || []).filter(
                event => event.scoringPlay === true
            );

        console.log(`\nScoring events: ${scoringEvents.length}\n`);

        for (const event of scoringEvents) {

            console.log("--------------------------------------------------");

            console.log("ID:", event.id);
            console.log("Clock:", event.clock);
            console.log("Text:", event.text);

            console.log("\nScoring:");
            console.log("  scoringPlay:", event.scoringPlay);
            console.log("  ownGoal:", event.ownGoal);
            console.log("  penaltyKick:", event.penaltyKick);

            console.log("\nTeam:");
            console.log(
                "  team:",
                event.team
                    ? {
                        id: event.team.id,
                        displayName: event.team.displayName,
                        abbreviation: event.team.abbreviation
                    }
                    : null
            );

            console.log("\nParticipants:");

            for (const participant of event.participants || []) {

                console.log({
                    athlete: participant.athlete
                        ? participant.athlete.displayName
                        : null,

                    team: participant.team
                        ? {
                            id: participant.team.id,
                            displayName: participant.team.displayName
                        }
                        : null,

                    type: participant.type,
                    role: participant.role
                });
            }

            console.log("\nFull event:");
            console.dir(event, { depth: null });
        }

    } catch (error) {

        console.log(`✗ ERROR: ${error.message}`);

    }
}

await test14();

console.log("\n============================================================");
console.log("TESTING COMPLETE");
console.log("============================================================\n");