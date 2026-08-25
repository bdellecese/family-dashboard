/*
 * ============================================================
 * SPORTS LEGENDS WIDGET
 * ============================================================
 *
 * Displays rotating sports legends.
 *
 * Selection and repeat-avoidance are handled by the
 * Sports Legends data service.
 *
 * ============================================================
 */

let rotationTimer = null;
let isRendering = false;

import sportsLegendsData
    from "../../services/sports-legends/sports-legends-data.js";


const sportsLegends = {

    name:
        "sports-legends",


    async render(
        container,
        config = {}
    ) {

        if (rotationTimer) {

            clearInterval(
                rotationTimer
            );

            rotationTimer = null;

        }

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
         * IMAGE
         * ====================================================
         */

        const image =
            document.createElement(
                "img"
            );

        image.className =
            "sports-legends-widget__image";

        image.alt =
            "";


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
            image
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
         *
         * The data service is responsible for:
         *
         *   - Random selection
         *   - Avoiding recently displayed players
         *   - Persisting display history
         *   - Resetting the cycle when all players
         *     have been displayed
         *
         * The widget simply asks for the next player.
         *
         * ====================================================
         */

        async function renderLegend() {

            if (isRendering) {
                return;
            }

            isRendering = true;

            try {

                const legend =
                    await sportsLegendsData.getNextLegend(
                        {
                            sports:
                                config.sports
                        }
                    );


                if (
                    !legend
                ) {

                    renderMessage(
                        content,
                        "No sports legends available."
                    );

                    return;

                }


                /*
                 * ==================================================
                 * REMOVE FADE CLASSES
                 * ==================================================
                 */

                image.classList.remove(
                    "sports-legends-widget__fade"
                );

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
                 * ==================================================
                 * IMAGE
                 * ==================================================
                 */

                if (
                    legend.image
                ) {

                    image.src =
                        legend.image;

                    image.alt =
                        legend.name;

                    image.style.display =
                        "block";

                }

                else {

                    image.removeAttribute(
                        "src"
                    );

                    image.alt =
                        "";

                    image.style.display =
                        "none";

                }


                /*
                 * ==================================================
                 * SPORT
                 * ==================================================
                 */

                sport.textContent =
                    legend.sport;


                /*
                 * ==================================================
                 * NAME
                 * ==================================================
                 */

                name.textContent =
                    legend.name;


                /*
                 * ==================================================
                 * TEAM
                 * ==================================================
                 */

                team.textContent =
                    legend.team || "";


                /*
                 * ==================================================
                 * DETAILS
                 * ==================================================
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
                 * ==================================================
                 * STATS
                 * ==================================================
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
                 * ==================================================
                 * FADE IN
                 * ==================================================
                 */

                image.classList.add(
                    "sports-legends-widget__fade"
                );

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

            }

            catch (error) {

                console.error(
                    "Failed to render Sports Legend:",
                    error
                );

                renderMessage(
                    content,
                    "Sports legends are temporarily unavailable."
                );

            }

            finally {

                isRendering = false;

            }

        }



        /*
         * ====================================================
         * INITIAL LEGEND
         * ====================================================
         */

        await renderLegend();


        /*
         * ====================================================
         * ROTATION
         * ====================================================
         */

        rotationTimer =
            setInterval(
                renderLegend,
                rotationSeconds * 1000
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

    container.innerHTML =
        "";


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


export default
    sportsLegends;