/*
 * ============================================================
 * QUOTE OF THE DAY
 * ============================================================
 *
 * Displays the current Quote of the Day.
 *
 * ============================================================
 */

import quoteOfDayData
    from "../../services/quote-of-day/quote-of-day-data.js";


const quoteOfDay = {

    name:
        "quote-of-day",


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
            "quote-of-day-widget";


        /*
         * ====================================================
         * HEADER
         * ====================================================
         */

        const header =
            document.createElement("div");

        header.className =
            "quote-of-day-widget__header";


        const title =
            document.createElement("div");

        title.className =
            "quote-of-day-widget__title";

        title.textContent =
            "Quote of the Day";


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
            "quote-of-day-widget__content";


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
                await quoteOfDayData
                    .getQuoteOfDay();

        }

        catch (error) {

            console.error(
                "Failed to load Quote of the Day:",
                error
            );


            renderMessage(
                content,
                "Unable to load Quote of the Day."
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
                "Quote of the Day is unavailable."
            );


            container.appendChild(
                widget
            );

            return;

        }


        /*
         * ====================================================
         * QUOTE
         * ====================================================
         */

        if (
            data.quote
        ) {

            const quote =
                document.createElement("div");

            quote.className =
                "quote-of-day-widget__quote";

            quote.textContent =
                `“${data.quote}”`;


            content.appendChild(
                quote
            );

        }


        /*
         * ====================================================
         * AUTHOR
         * ====================================================
         */

        if (
            data.author
        ) {

            const author =
                document.createElement("div");

            author.className =
                "quote-of-day-widget__author";

            author.textContent =
                `— ${data.author}`;


            content.appendChild(
                author
            );

        }


        /*
         * ====================================================
         * SOURCE
         * ====================================================
         */

        if (
            data.source
        ) {

            const source =
                document.createElement("div");

            source.className =
                "quote-of-day-widget__source";

            source.textContent =
                data.source;


            content.appendChild(
                source
            );

        }


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
        "quote-of-day-widget__message";


    element.textContent =
        message;


    container.appendChild(
        element
    );

}


export default quoteOfDay;