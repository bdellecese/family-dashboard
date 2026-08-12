/*
 * ============================================================
 * DAD WISDOM WIDGET
 * ============================================================
 *
 * Displays a random dad joke and rotates to a new joke
 * every 30 seconds.
 *
 * ============================================================
 */

import dadWisdomData
from "../../services/dad-wisdom/dad-wisdom-data.js";


const dadWisdom = {

    name:
        "dad-wisdom",


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

        const rotationSeconds =
            config.rotationSeconds ||
            30;


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
            "dad-wisdom-widget";


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
            "dad-wisdom-widget__header";


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "dad-wisdom-widget__title";

        title.textContent =
            "Dad Wisdom";


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
            "dad-wisdom-widget__content";


        widget.appendChild(
            content
        );


        /*
         * ====================================================
         * JOKE
         * ====================================================
         */

        const jokeElement =
            document.createElement(
                "div"
            );

        jokeElement.className =
            "dad-wisdom-widget__joke";


        content.appendChild(
            jokeElement
        );


        /*
         * ====================================================
         * SOURCE
         * ====================================================
         */

        const source =
            document.createElement(
                "div"
            );

        source.className =
            "dad-wisdom-widget__source";

        source.textContent =
            "icanhazdadjoke";


        content.appendChild(
            source
        );


        /*
         * ====================================================
         * PROGRESS
         * ====================================================
         */

        const progress =
            document.createElement(
                "div"
            );

        progress.className =
            "dad-wisdom-widget__progress";


        const progressBar =
            document.createElement(
                "div"
            );

        progressBar.className =
            "dad-wisdom-widget__progress-bar";


        progress.appendChild(
            progressBar
        );


        widget.appendChild(
            progress
        );


        /*
         * ====================================================
         * LOAD JOKE
         * ====================================================
         */

        async function loadJoke() {

            try {

                const data =
                    await dadWisdomData
                        .getDadWisdom();


                /*
                 * ====================================================
                 * VALIDATE
                 * ====================================================
                 */

                if (
                    !data ||
                    !data.available ||
                    !data.joke
                ) {

                    jokeElement.textContent =
                        "Dad Wisdom is unavailable.";

                    return;

                }


                /*
                 * ====================================================
                 * REMOVE FADE
                 * ====================================================
                 */

                jokeElement.classList.remove(
                    "dad-wisdom-widget__fade"
                );


                /*
                 * Force animation restart.
                 */

                void jokeElement.offsetWidth;


                /*
                 * ====================================================
                 * DISPLAY JOKE
                 * ====================================================
                 */

                jokeElement.textContent =
                    data.joke;


                /*
                 * ====================================================
                 * DISPLAY SOURCE
                 * ====================================================
                 */

                source.textContent =
                    data.source ||
                    "Dad Wisdom";


                /*
                 * ====================================================
                 * FADE IN
                 * ====================================================
                 */

                jokeElement.classList.add(
                    "dad-wisdom-widget__fade"
                );


                /*
                 * ====================================================
                 * RESET PROGRESS BAR
                 * ====================================================
                 */

                progressBar.style.animation =
                    "none";


                void progressBar.offsetWidth;


                progressBar.style.animation =
                    `dad-wisdom-progress ${rotationSeconds}s linear`;

            }

            catch (error) {

                console.error(
                    "Failed to load Dad Wisdom:",
                    error
                );


                jokeElement.textContent =
                    "Unable to load Dad Wisdom.";

            }

        }


        /*
         * ====================================================
         * INITIAL JOKE
         * ====================================================
         */

        await loadJoke();


        /*
         * ====================================================
         * ROTATION
         * ====================================================
         */

        const rotationTimer =
            setInterval(
                loadJoke,
                rotationSeconds * 1000
            );


        /*
         * ====================================================
         * STORE TIMER
         * ====================================================
         */

        widget._rotationTimer =
            rotationTimer;


        /*
         * ====================================================
         * ADD WIDGET
         * ====================================================
 */

        container.appendChild(
            widget
        );

    },


    /*
     * ========================================================
     * DESTROY
     * ========================================================
     */

    async destroy(
        container
    ) {

        const widget =
            container.querySelector(
                ".dad-wisdom-widget"
            );


        if (
            widget &&
            widget._rotationTimer
        ) {

            clearInterval(
                widget._rotationTimer
            );


            widget._rotationTimer =
                null;

        }

    }

};


export default dadWisdom;