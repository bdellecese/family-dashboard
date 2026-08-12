/*
 * ============================================================
 * WORD OF THE DAY
 * ============================================================
 *
 * Displays the current Merriam-Webster Word of the Day.
 *
 * ============================================================
 */

import wordOfDayData
from "../../services/word-of-day/word-of-day-data.js";

const wordOfDay = {

    name:
        "word-of-day",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML =
            "";


        /*
         * ====================================================
         * WIDGET
         * ====================================================
         */

        const widget =
            document.createElement("div");

        widget.className =
            "word-of-day-widget";


        /*
         * ====================================================
         * HEADER
         * ====================================================
         */

        const header =
            document.createElement("div");

        header.className =
            "word-of-day-widget__header";


        const title =
            document.createElement("div");

        title.className =
            "word-of-day-widget__title";

        title.textContent =
            "Word of the Day";


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
            document.createElement("div");

        content.className =
            "word-of-day-widget__content";


        widget.appendChild(
            content
        );


        /*
         * ====================================================
         * LOAD DATA
         * ====================================================
         */

        let data;


        try {

            data =
                await wordOfDayData
                    .getWordOfDay();

        }

        catch (error) {

            console.error(
                "Failed to load Word of the Day:",
                error
            );


            renderMessage(
                content,
                "Unable to load Word of the Day."
            );


            container.appendChild(
                widget
            );

            return;

        }


        /*
         * ====================================================
         * UNAVAILABLE
         * ====================================================
         */

        if (
            !data ||
            !data.available
        ) {

            renderMessage(
                content,
                data?.message ||
                "Word of the Day is unavailable."
            );


            container.appendChild(
                widget
            );

            return;

        }


        /*
         * ====================================================
         * WORD
         * ====================================================
         */

        const word =
            document.createElement("div");

        word.className =
            "word-of-day-widget__word";

        word.textContent =
            data.word;


        content.appendChild(
            word
        );


        /*
         * ====================================================
         * DETAILS
         *
         * Pronunciation + part of speech
         *
         * Rendered separately so spacing and styling
         * are controlled by CSS.
         * ====================================================
         */

        const details =
            document.createElement("div");

        details.className =
            "word-of-day-widget__details";


        if (
            data.pronunciation
        ) {

            const pronunciation =
                document.createElement("span");

            pronunciation.className =
                "word-of-day-widget__pronunciation";

            pronunciation.textContent =
                `\\${data.pronunciation}\\`;


            details.appendChild(
                pronunciation
            );

        }


        if (
            data.partOfSpeech
        ) {

            const partOfSpeech =
                document.createElement("span");

            partOfSpeech.className =
                "word-of-day-widget__part-of-speech";

            partOfSpeech.textContent =
                data.partOfSpeech;


            details.appendChild(
                partOfSpeech
            );

        }


        if (
            details.children.length > 0
        ) {

            content.appendChild(
                details
            );

        }


        /*
         * ====================================================
         * DEFINITION
         * ====================================================
         */

        if (
            data.definition
        ) {

            const definition =
                document.createElement("div");

            definition.className =
                "word-of-day-widget__definition";

            definition.textContent =
                data.definition;


            content.appendChild(
                definition
            );

        }


        /*
         * ====================================================
         * SOURCE
         * ====================================================
         */

        const source =
            document.createElement("div");

        source.className =
            "word-of-day-widget__source";

        source.textContent =
            data.source ||
            "Merriam-Webster";


        content.appendChild(
            source
        );


        /*
         * ====================================================
         * ADD WIDGET
         * ====================================================
         */

        container.appendChild(
            widget
        );

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
        document.createElement("div");

    element.className =
        "word-of-day-widget__message";

    element.textContent =
        message;


    container.appendChild(
        element
    );

}


export default wordOfDay;