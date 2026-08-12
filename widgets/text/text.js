/*
 * ============================================================
 * TEXT WIDGET
 * ============================================================
 *
 * Displays configurable text.
 *
 * Configuration:
 *
 * {
 *     text: "Your text here"
 * }
 *
 * ============================================================
 */

const text = {

    name:
        "text",


    async render(
        container,
        config = {}
    ) {

        /*
         * ====================================================
         * CLEAR CONTAINER
         * ====================================================
         */

        container.innerHTML =
            "";


        /*
         * ====================================================
         * TEXT ELEMENT
         * ====================================================
         */

        const element =
            document.createElement("div");

        element.className =
            "text-widget";


        /*
         * ====================================================
         * TEXT
         * ====================================================
         */

        element.textContent =
            config.text || "";


        /*
         * ====================================================
         * ADD TO CONTAINER
         * ====================================================
         */

        container.appendChild(
            element
        );

    }

};


export default text;