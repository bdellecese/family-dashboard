/*
 * ============================================================
 * ON THIS DAY
 * ============================================================
 *
 * Displays historical events that happened on today's date.
 *
 * Events rotate every 30 seconds.
 *
 * ============================================================
 */

import onThisDayData
from "../../services/on-this-day/on-this-day-data.js";


const onThisDay = {

    name:
        "on-this-day",


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
            "on-this-day-widget";


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
            "on-this-day-widget__header";


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "on-this-day-widget__title";

        title.textContent =
            "On This Day";


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
            "on-this-day-widget__content";


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
         * LOAD DATA
         * ====================================================
         */

        let data;


        try {

            data =
                await onThisDayData.getEvents();

        }

        catch (error) {

            console.error(
                "Failed to load On This Day:",
                error
            );


            renderMessage(
                content,
                "Unable to load On This Day."
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
            !data.available ||
            !data.events ||
            data.events.length === 0
        ) {

            renderMessage(
                content,
                data?.message ||
                "On This Day is unavailable."
            );

            return;

        }


        /*
         * ====================================================
         * SELECT EVENTS
         *
         * Keep the widget manageable by using a subset
         * of the available historical events.
         * ====================================================
         */

        const events =
            selectEvents(
                data.events
            );


        /*
         * ====================================================
         * EVENT ELEMENTS
         * ====================================================
         */

        const year =
            document.createElement(
                "div"
            );

        year.className =
            "on-this-day-widget__year";


        const eventText =
            document.createElement(
                "div"
            );

        eventText.className =
            "on-this-day-widget__event";


        content.appendChild(
            year
        );

        content.appendChild(
            eventText
        );


        /*
         * ====================================================
         * RENDER EVENT
         * ====================================================
         */

        let currentIndex =
            0;


        function renderEvent() {

            const event =
                events[currentIndex];


            if (
                !event
            ) {

                return;

            }


            /*
             * Remove fade class.
             */

            year.classList.remove(
                "on-this-day-widget__fade"
            );

            eventText.classList.remove(
                "on-this-day-widget__fade"
            );


            /*
             * Force animation restart.
             */

            void year.offsetWidth;


            /*
             * YEAR
             */

            year.textContent =
                event.year;


            /*
             * EVENT
             */

            eventText.textContent =
                event.text;


            /*
             * Fade in.
             */

            year.classList.add(
                "on-this-day-widget__fade"
            );

            eventText.classList.add(
                "on-this-day-widget__fade"
            );


            /*
             * NEXT EVENT
             */

            currentIndex =
                (
                    currentIndex + 1
                ) %
                events.length;

        }


        /*
         * ====================================================
         * INITIAL EVENT
         * ====================================================
         */

        renderEvent();


        /*
         * ====================================================
         * ROTATION
         * ====================================================
         */

        if (
            events.length > 1
        ) {

            setInterval(
                renderEvent,
                rotationSeconds * 1000
            );

        }

    }

};


/*
 * ============================================================
 * SELECT EVENTS
 * ============================================================
 */

function selectEvents(
    events
) {

    /*
     * Shuffle the available events so the dashboard
     * doesn't always start with the same historical event.
     */

    const shuffled =
        [...events]
            .sort(
                () =>
                    Math.random() - 0.5
            );


    /*
     * Use up to six events.
     */

    return shuffled.slice(
        0,
        6
    );

}


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
        "on-this-day-widget__message";

    element.textContent =
        message;


    container.appendChild(
        element
    );

}


export default onThisDay;