/*
 * ============================================================
 * ON THIS DAY IN SPORTS
 * ============================================================
 *
 * Displays notable sporting events that happened on today's
 * date in previous years.
 *
 * Events rotate every 30 seconds.
 *
 * ============================================================
 */

import onThisDaySportsData
from "../../services/on-this-day-sports/on-this-day-sports-data.js";


const onThisDaySports = {

    name:
        "on-this-day-sports",


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
            "on-this-day-sports-widget";


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
            "on-this-day-sports-widget__header";


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "on-this-day-sports-widget__title";

        title.textContent =
            "On This Day in Sports";


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
            "on-this-day-sports-widget__content";


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
                await onThisDaySportsData.getEvents();

        }

        catch (error) {

            console.error(
                "Failed to load On This Day in Sports:",
                error
            );


            renderMessage(
                content,
                "Unable to load sports history."
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
                "Sports history is unavailable."
            );

            return;

        }


        /*
         * ====================================================
         * EVENTS
         * ====================================================
         *
         * The data service has already filtered events by
         * significance score and limited the result count.
         *
         * Preserve that ranking here.
         * ====================================================
         */

        const events =
            data.events;


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
            "on-this-day-sports-widget__year";


        const sport =
            document.createElement(
                "div"
            );

        sport.className =
            "on-this-day-sports-widget__sport";


        const eventText =
            document.createElement(
                "div"
            );

        eventText.className =
            "on-this-day-sports-widget__event";


        content.appendChild(
            year
        );

        content.appendChild(
            sport
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
                "on-this-day-sports-widget__fade"
            );

            sport.classList.remove(
                "on-this-day-sports-widget__fade"
            );

            eventText.classList.remove(
                "on-this-day-sports-widget__fade"
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
             * SPORT
             */

            sport.textContent =
                event.sport;


            /*
             * EVENT
             */

            eventText.textContent =
                event.event;


            /*
             * Fade in.
             */

            year.classList.add(
                "on-this-day-sports-widget__fade"
            );

            sport.classList.add(
                "on-this-day-sports-widget__fade"
            );

            eventText.classList.add(
                "on-this-day-sports-widget__fade"
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
        "on-this-day-sports-widget__message";

    element.textContent =
        message;


    container.appendChild(
        element
    );

}


export default onThisDaySports;