/*
 * ============================================================
 * SPORTS TRIVIA DATA SERVICE
 * ============================================================
 *
 * Provides randomly selected sports trivia questions.
 *
 * Supports:
 *
 *   - Multiple sports
 *   - Equal-probability random selection
 *   - Immediate-repeat avoidance
 *
 * ============================================================
 */


/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const DATA_URL =
    "/services/sports-trivia/sports-trivia-data.json";


/*
 * ============================================================
 * STATE
 * ============================================================
 */

let lastShownId =
    null;


/*
 * ============================================================
 * LOAD DATA
 * ============================================================
 */

async function loadData() {

    const response =
        await fetch(
            DATA_URL
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Failed to load Sports Trivia data: ${response.status}`
        );

    }


    const data =
        await response.json();


    if (
        !data ||
        !Array.isArray(
            data.questions
        )
    ) {

        throw new Error(
            "Sports Trivia data file is invalid."
        );

    }


    return data.questions;

}


/*
 * ============================================================
 * RANDOM QUESTION
 * ============================================================
 */

function randomQuestion(
    questions
) {

    if (
        !questions ||
        questions.length === 0
    ) {

        return null;

    }


    const randomIndex =
        Math.floor(
            Math.random() *
            questions.length
        );


    return questions[
        randomIndex
    ];

}


/*
 * ============================================================
 * GET QUESTION
 * ============================================================
 */

async function getQuestion(
    config = {}
) {

    const questions =
        await loadData();


    /*
     * ========================================================
     * SPORTS FILTER
     * ========================================================
     */

    let filteredQuestions =
        questions;


    if (
        Array.isArray(
            config.sports
        ) &&
        config.sports.length > 0
    ) {

        const requestedSports =
            new Set(
                config.sports.map(
                    sport =>
                        String(
                            sport
                        ).toUpperCase()
                )
            );


        filteredQuestions =
            questions.filter(
                question =>
                    requestedSports.has(
                        String(
                            question.sport
                        ).toUpperCase()
                    )
            );

    }


    /*
     * ========================================================
     * NO QUESTIONS AVAILABLE
     * ========================================================
 */

    if (
        filteredQuestions.length === 0
    ) {

        return null;

    }


    /*
     * ========================================================
     * AVOID IMMEDIATE REPEAT
     * ========================================================
     */

    let pool =
        filteredQuestions;


    if (
        filteredQuestions.length > 1 &&
        lastShownId
    ) {

        const eligible =
            filteredQuestions.filter(
                question =>
                    question.id !==
                    lastShownId
            );


        if (
            eligible.length > 0
        ) {

            pool =
                eligible;

        }

    }


    /*
     * ========================================================
     * SELECT RANDOM QUESTION
     * ========================================================
 */

    const selectedQuestion =
        randomQuestion(
            pool
        );


    /*
     * ========================================================
     * UPDATE STATE
     * ========================================================
 */

    if (
        selectedQuestion
    ) {

        lastShownId =
            selectedQuestion.id;

    }


    return selectedQuestion;

}


/*
 * ============================================================
 * RESET HISTORY
 * ============================================================
 */

function resetHistory() {

    lastShownId =
        null;

}


/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

const sportsTriviaData = {

    getQuestion,

    resetHistory

};


export default
    sportsTriviaData;