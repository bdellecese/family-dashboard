/*
 * ============================================================
 * SPORTS TRIVIA WIDGET
 * ============================================================
 *
 * Displays a rotating 60-second sports trivia question.
 *
 * Timeline:
 *
 *   0–30 seconds  = Question
 *   30–40 seconds = Think you know it?
 *   40–60 seconds = Answer + explanation
 *
 * ============================================================
 */

import sportsTriviaData
    from "../../services/sports-trivia/sports-trivia-data.js";


const sportsTrivia = {

    name:
        "sports-trivia",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML =
            "";


        /*
         * ====================================================
         * CONFIGURATION
         * ====================================================
         */

        const questionSeconds =
            30;

        const thinkSeconds =
            10;

        const answerSeconds =
            20;


        /*
         * ====================================================
         * WIDGET
         * ====================================================
         */

        const widget =
            document.createElement(
                "div"
            );

        widget.className =
            "sports-trivia-widget";


        /*
         * ====================================================
         * HEADER
         * ====================================================
 */

        const header =
            document.createElement(
                "div"
            );

        header.className =
            "sports-trivia-widget__header";


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "sports-trivia-widget__title";

        title.textContent =
            "Sports Trivia";


        header.appendChild(
            title
        );


        widget.appendChild(
            header
        );


        /*
         * ====================================================
         * CONTENT
         * ====================================================
 */

        const content =
            document.createElement(
                "div"
            );

        content.className =
            "sports-trivia-widget__content";


        widget.appendChild(
            content
        );


        /*
         * ====================================================
         * ADD WIDGET
         * ====================================================
 */

        container.appendChild(
            widget
        );


        /*
         * ====================================================
         * LOAD QUESTION
         * ====================================================
 */

        let question;


        try {

            question =
                await sportsTriviaData
                    .getQuestion(
                        {
                            sports:
                                config.sports
                        }
                    );

        }

        catch (error) {

            console.error(
                "Failed to load Sports Trivia:",
                error
            );


            renderMessage(
                content,
                "Sports trivia is temporarily unavailable."
            );

            return;

        }


        /*
         * ====================================================
         * UNAVAILABLE
         * ====================================================
 */

        if (
            !question
        ) {

            renderMessage(
                content,
                "No sports trivia available."
            );

            return;

        }


        /*
         * ====================================================
         * SPORT
         * ====================================================
 */

        const sport =
            document.createElement(
                "div"
            );

        sport.className =
            "sports-trivia-widget__sport";


        content.appendChild(
            sport
        );


        /*
         * ====================================================
         * QUESTION
         * ====================================================
 */

        const questionElement =
            document.createElement(
                "div"
            );

        questionElement.className =
            "sports-trivia-widget__question";


        content.appendChild(
            questionElement
        );


        /*
         * ====================================================
         * ANSWERS
         * ====================================================
 */

        const answers =
            document.createElement(
                "div"
            );

        answers.className =
            "sports-trivia-widget__answers";


        content.appendChild(
            answers
        );


        /*
         * ====================================================
         * STATUS
         * ====================================================
 */

        const status =
            document.createElement(
                "div"
            );

        status.className =
            "sports-trivia-widget__status";


        content.appendChild(
            status
        );


        /*
         * ====================================================
         * ANSWER REVEAL
         * ====================================================
 */

        const answer =
            document.createElement(
                "div"
            );

        answer.className =
            "sports-trivia-widget__answer";


        content.appendChild(
            answer
        );


        /*
         * ====================================================
         * EXPLANATION
         * ====================================================
 */

        const explanation =
            document.createElement(
                "div"
            );

        explanation.className =
            "sports-trivia-widget__explanation";


        content.appendChild(
            explanation
        );


        /*
         * ====================================================
         * RENDER QUESTION
         * ====================================================
 */

        function renderQuestion() {

            sport.textContent =
                question.sport || "";


            questionElement.textContent =
                question.question || "";


            answers.innerHTML =
                "";


            if (
                Array.isArray(
                    question.answers
                )
            ) {

                question.answers
                    .forEach(
                        (
                            answerText,
                            index
                        ) => {

                            const answerElement =
                                document.createElement(
                                    "div"
                                );

                            answerElement.className =
                                "sports-trivia-widget__answer-option";


                            const letter =
                                String.fromCharCode(
                                    65 + index
                                );


                            answerElement.textContent =
                                `${letter}. ${answerText}`;


                            answers.appendChild(
                                answerElement
                            );

                        }
                    );

            }


            status.textContent =
                "Think you know it?";


            answer.textContent =
                "";


            explanation.textContent =
                "";


            answer.style.display =
                "none";


            explanation.style.display =
                "none";

        }


        /*
         * ====================================================
         * REVEAL ANSWER
         * ====================================================
 */

        function revealAnswer() {

            status.textContent =
                "Answer";


            answer.textContent =
                question.correctAnswer
                    ? `✓ ${question.correctAnswer}`
                    : "";


            explanation.textContent =
                question.explanation ||
                "";


            answer.style.display =
                question.correctAnswer
                    ? "block"
                    : "none";


            explanation.style.display =
                question.explanation
                    ? "block"
                    : "none";

        }


        /*
         * ====================================================
         * INITIAL RENDER
         * ====================================================
 */

        renderQuestion();


        /*
         * ====================================================
         * TIMELINE
         * ====================================================
 */

        /*
         * 0–30 seconds
         */

        const thinkTimer =
            setTimeout(
                () => {

                    status.textContent =
                        "Think you know it?";

                },
                questionSeconds * 1000
            );


        /*
         * 40 seconds
         */

        const revealTimer =
            setTimeout(
                revealAnswer,
                (
                    questionSeconds +
                    thinkSeconds
                ) * 1000
            );


        /*
         * 60 seconds
         */

        const nextTimer =
            setTimeout(
                async () => {

                    clearTimeout(
                        thinkTimer
                    );

                    clearTimeout(
                        revealTimer
                    );


                    try {

                        question =
                            await sportsTriviaData
                                .getQuestion(
                                    {
                                        sports:
                                            config.sports
                                    }
                                );


                        if (
                            question
                        ) {

                            renderQuestion();


                            /*
                             * Start a new cycle.
                             */

                            startCycle();

                        }

                        else {

                            renderMessage(
                                content,
                                "No sports trivia available."
                            );

                        }

                    }

                    catch (error) {

                        console.error(
                            "Failed to load next Sports Trivia question:",
                            error
                        );

                    }

                },
                (
                    questionSeconds +
                    thinkSeconds +
                    answerSeconds
                ) * 1000
            );


        /*
         * ====================================================
         * START NEXT CYCLE
         * ====================================================
 */

        function startCycle() {

            setTimeout(
                () => {

                    status.textContent =
                        "Think you know it?";

                },
                questionSeconds * 1000
            );


            setTimeout(
                revealAnswer,
                (
                    questionSeconds +
                    thinkSeconds
                ) * 1000
            );


            setTimeout(
                async () => {

                    try {

                        question =
                            await sportsTriviaData
                                .getQuestion(
                                    {
                                        sports:
                                            config.sports
                                    }
                                );


                        if (
                            question
                        ) {

                            renderQuestion();

                            startCycle();

                        }

                    }

                    catch (error) {

                        console.error(
                            "Failed to load next Sports Trivia question:",
                            error
                        );

                    }

                },
                (
                    questionSeconds +
                    thinkSeconds +
                    answerSeconds
                ) * 1000
            );

        }

    }

};


/*
 * ============================================================
 * RENDER MESSAGE
 * ============================================================
 */

function renderMessage(
    container,
    message
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "sports-trivia-widget__message";


    element.textContent =
        message;


    container.appendChild(
        element
    );

}


export default sportsTrivia;