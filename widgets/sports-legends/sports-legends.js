/*
 * ============================================================
 * SPORTS LEGENDS WIDGET
 * ============================================================
 *
 * Displays rotating sports legends across configured sports.
 *
 * ============================================================
 */

import sportsLegendsData
from "../../services/sports-legends/sports-legends-data.js";


const sportsLegends = {

    name:
        "sports-legends",


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
            "sports-legends-widget";


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
            "sports-legends-widget__header";


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "sports-legends-widget__title";

        title.textContent =
            "Sports Legends";


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
            "sports-legends-widget__content";


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
         * LOAD LEGENDS
         * ====================================================
 */

        let legends;


        try {

            legends =
                await sportsLegendsData.getLegends(
                    {

                        sports:
                            config.sports,

                        maxLegends:
                            config.maxLegends ||
                            10

                    }
                );

        }

        catch (error) {

            console.error(
                "Failed to load Sports Legends:",
                error
            );


            renderMessage(
                content,
                "Sports legends are temporarily unavailable."
            );

            return;

        }


        /*
         * ====================================================
         * UNAVAILABLE
         * ====================================================
 */

        if (
            !legends ||
            legends.length === 0
        ) {

            renderMessage(
                content,
                "No sports legends available."
            );

            return;

        }


        /*
         * ====================================================
         * EVENT ELEMENTS
         * ====================================================
 */

        const sport =
            document.createElement(
                "div"
            );

        sport.className =
            "sports-legends-widget__sport";


        const name =
            document.createElement(
                "div"
            );

        name.className =
            "sports-legends-widget__name";


        const team =
            document.createElement(
                "div"
            );

        team.className =
            "sports-legends-widget__team";


        const details =
            document.createElement(
                "div"
            );

        details.className =
            "sports-legends-widget__details";


        const stats =
            document.createElement(
                "div"
            );

        stats.className =
            "sports-legends-widget__stats";


        content.appendChild(
            sport
        );

        content.appendChild(
            name
        );

        content.appendChild(
            team
        );

        content.appendChild(
            details
        );

        content.appendChild(
            stats
        );


        /*
         * ====================================================
         * RENDER LEGEND
         * ====================================================
 */

        let currentIndex =
            0;


        function renderLegend() {

            const legend =
                legends[currentIndex];


            if (
                !legend
            ) {

                return;

            }


            /*
             * Remove fade class.
             */

            sport.classList.remove(
                "sports-legends-widget__fade"
            );

            name.classList.remove(
                "sports-legends-widget__fade"
            );

            team.classList.remove(
                "sports-legends-widget__fade"
            );

            details.classList.remove(
                "sports-legends-widget__fade"
            );

            stats.classList.remove(
                "sports-legends-widget__fade"
            );


            /*
             * Force animation restart.
             */

            void name.offsetWidth;


            /*
             * SPORT
             */

            sport.textContent =
                legend.sport;


            /*
             * NAME
             */

            name.textContent =
                legend.name;


            /*
             * TEAM
             */

            team.textContent =
                legend.team;


            /*
             * DETAILS
             */

            const detailParts =
                [];


            if (
                legend.years
            ) {

                detailParts.push(
                    legend.years
                );

            }


            if (
                legend.position
            ) {

                detailParts.push(
                    legend.position
                );

            }


            if (
                legend.hallOfFame
            ) {

                detailParts.push(
                    `Hall of Fame ${legend.hallOfFame}`
                );

            }


            details.textContent =
                detailParts.join(
                    " • "
                );


            /*
             * STATS
             */

            stats.innerHTML =
                "";


            if (
                Array.isArray(
                    legend.stats
                )
            ) {

                legend.stats
                    .forEach(
                        stat => {

                            const statElement =
                                document.createElement(
                                    "div"
                                );

                            statElement.className =
                                "sports-legends-widget__stat";

                            statElement.textContent =
                                stat;


                            stats.appendChild(
                                statElement
                            );

                        }
                    );

            }


            /*
             * FADE IN
             */

            sport.classList.add(
                "sports-legends-widget__fade"
            );

            name.classList.add(
                "sports-legends-widget__fade"
            );

            team.classList.add(
                "sports-legends-widget__fade"
            );

            details.classList.add(
                "sports-legends-widget__fade"
            );

            stats.classList.add(
                "sports-legends-widget__fade"
            );


            /*
             * NEXT LEGEND
             */

            currentIndex =
                (
                    currentIndex + 1
                ) %
                legends.length;

        }


        /*
         * ====================================================
         * INITIAL LEGEND
         * ====================================================
 */

        renderLegend();


        /*
         * ====================================================
         * ROTATION
         * ====================================================
 */

        if (
            legends.length > 1
        ) {

            setInterval(
                renderLegend,
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
        "sports-legends-widget__message";

    element.textContent =
        message;


    container.appendChild(
        element
    );

}


export default sportsLegends;