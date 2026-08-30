/*
 * ============================================================
 * GREETING WIDGET
 * ============================================================
 *
 * Displays:
 *
 *     Good morning, Dellecese family.
 *     Today is Sunday, August 30, 2026 and it's 8:05am.
 *     This is your "distraction-free" screen to help keep you
 *     focused.
 *
 * The greeting and date/time refresh automatically so the
 * display remains current while the screen is active.
 *
 * ============================================================
 */

let refreshTimer =
    null;


const greeting = {

    name:
        "greeting",


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

        const familyName =
            config.familyName ||
            "Dellecese family";


        /*
         * ====================================================
         * WRAPPER
         * ====================================================
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "greeting-widget";


        /*
         * ====================================================
         * GREETING
         * ==================================================== */

        const greetingElement =
            document.createElement("div");

        greetingElement.className =
            "greeting-widget__greeting";


        /*
         * ====================================================
         * DATE / TIME
         * ==================================================== */

        const dateTimeElement =
            document.createElement("div");

        dateTimeElement.className =
            "greeting-widget__date-time";


        /*
         * ====================================================
         * DESCRIPTION
         * ==================================================== */

        const descriptionElement =
            document.createElement("div");

        descriptionElement.className =
            "greeting-widget__description";

        descriptionElement.textContent =
            'This is your "distraction-free" screen to help keep you focused.';


        /*
         * ====================================================
         * UPDATE
         * ====================================================
         *
         * Keep the header current while the screen is active.
         * ====================================================
         */

        function update() {

            const now =
                new Date();


            const hour =
                now.getHours();


            let greetingText;


            if (
                hour < 12
            ) {

                greetingText =
                    `Good morning, ${familyName}.`;

            }

            else if (
                hour < 17
            ) {

                greetingText =
                    `Good afternoon, ${familyName}.`;

            }

            else {

                greetingText =
                    `Good evening, ${familyName}.`;

            }


            /*
             * Date
             */

            const dateText =
                now.toLocaleDateString(
                    "en-US",
                    {

                        weekday:
                            "long",

                        month:
                            "long",

                        day:
                            "numeric",

                        year:
                            "numeric"

                    }
                );


            /*
             * Time
             */

            const timeText =
                now.toLocaleTimeString(
                    "en-US",
                    {

                        hour:
                            "numeric",

                        minute:
                            "2-digit",

                        hour12:
                            true

                    }
                )
                .toLowerCase();


            /*
             * Update elements.
             */

            greetingElement.textContent =
                greetingText;


            dateTimeElement.textContent =
                `Today is ${dateText} and it's ${timeText}.`;

        }


        /*
         * ====================================================
         * BUILD
         * ====================================================
         */

        wrapper.appendChild(
            greetingElement
        );


        wrapper.appendChild(
            dateTimeElement
        );


        wrapper.appendChild(
            descriptionElement
        );


        container.appendChild(
            wrapper
        );


        /*
         * ====================================================
         * INITIAL UPDATE
         * ====================================================
         */

        update();


        /*
         * ====================================================
         * REFRESH
         * ====================================================
         *
         * Refresh every 30 seconds.
         */

        if (
            refreshTimer
        ) {

            clearInterval(
                refreshTimer
            );

        }


        refreshTimer =
            setInterval(
                update,
                30000
            );

    },


    /*
     * ========================================================
     * DESTROY
     * ========================================================
     *
     * Clean up the refresh timer when the widget is removed.
     * ========================================================
     */

    async destroy() {

        if (
            refreshTimer
        ) {

            clearInterval(
                refreshTimer
            );

            refreshTimer =
                null;

        }

    }

};


export default greeting;