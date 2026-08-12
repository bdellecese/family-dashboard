/*
 * ============================================================
 * DID YOU KNOW?
 * ============================================================
 *
 * Displays a rotating interesting fact.
 *
 * A new fact is loaded every 30 seconds.
 *
 * ============================================================
 */

import didYouKnowData
from "../../services/did-you-know/did-you-know-data.js";


const didYouKnow = {

    name:
        "did-you-know",


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
            "did-you-know-widget";


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
            "did-you-know-widget__header";


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "did-you-know-widget__title";

        title.textContent =
            "Did You Know?";


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
            "did-you-know-widget__content";


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
         * FACT
         * ====================================================
         */

        const fact =
            document.createElement(
                "div"
            );

        fact.className =
            "did-you-know-widget__fact";


        content.appendChild(
            fact
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
            "did-you-know-widget__source";


        content.appendChild(
            source
        );


        /*
         * ====================================================
         * LOAD FACT
         * ====================================================
         */

        async function loadFact() {

            try {

                const data =
                    await didYouKnowData.getFact();


                if (
                    !data ||
                    !data.available
                ) {

                    fact.textContent =
                        data?.message ||
                        "Did You Know? is unavailable.";

                    source.textContent =
                        "";

                    return;

                }


                /*
                 * Remove fade class.
                 */

                fact.classList.remove(
                    "did-you-know-widget__fade"
                );

                source.classList.remove(
                    "did-you-know-widget__fade"
                );


                /*
                 * Force animation restart.
                 */

                void fact.offsetWidth;


                /*
                 * FACT
                 */

                fact.textContent =
                    data.fact;


                /*
                 * SOURCE
                 */

                source.textContent =
                    data.source;


                /*
                 * Fade in.
                 */

                fact.classList.add(
                    "did-you-know-widget__fade"
                );

                source.classList.add(
                    "did-you-know-widget__fade"
                );

            }

            catch (error) {

                console.error(
                    "Failed to load Did You Know:",
                    error
                );


                fact.textContent =
                    "Unable to load a fact.";

                source.textContent =
                    "";

            }

        }


        /*
         * ====================================================
         * INITIAL FACT
         * ====================================================
         */

        await loadFact();


        /*
         * ====================================================
         * ROTATION
         * ====================================================
         */

        setInterval(
            loadFact,
            rotationSeconds * 1000
        );

    }

};


export default didYouKnow;