import { soccerData } from "../services/sports/soccer-data.js";


/*
 * ============================================================
 * SOCCER DATA API TEST
 *
 * Verifies that the API-Football connection and API key work.
 * ============================================================
 */


async function runTest() {

    console.log(
        "[soccer-test] Testing API-Football connection..."
    );


    const data =
        await soccerData.getCachedData(
            "test-premier-league",
            soccerData.cacheTtl.metadata,
            "/leagues",
            {
                id: 39,
                season: 2026
            }
        );


    if (!data) {

        throw new Error(
            "No data returned from API-Football."
        );

    }


    if (
        !data.response ||
        data.response.length === 0
    ) {

        throw new Error(
            "API responded, but no league data was returned."
        );

    }


    const league =
        data.response[0]?.league;


    console.log(
        "[soccer-test] API connection successful."
    );

    console.log(
        `[soccer-test] League: ${league?.name}`
    );

    console.log(
        `[soccer-test] Country: ${league?.country}`
    );

}


runTest()
    .catch(error => {

        console.error(
            "[soccer-test] FAILED:",
            error.message
        );

        process.exitCode = 1;

    });