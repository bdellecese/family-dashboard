/*
 * ============================================================
 * SPORTS STANDINGS
 *
 * Parent standings widget.
 *
 * Responsibilities:
 * - Manage rotation between sports
 * - Load the appropriate sport-specific standings widget
 * - Pass configuration through to the sport widget
 *
 * Sport-specific rendering lives under:
 *
 * widgets/sports-standings/<sport>/
 * ============================================================
 */


const sports = {};


async function loadSport(
    sport
) {

    if (
        sports[sport]
    ) {

        return sports[sport];

    }

    switch (sport) {

                case "mlb": {

            const module =
                await import(
                    "./mlb/mlb-standings.js"
                );


            sports[sport] =
                module.default;


            break;

        }

        case "nfl": {

            const module =
                await import(
                    "./nfl/nfl-standings.js"
                );


            sports[sport] =
                module.default;


            break;

        }

        default:

            throw new Error(
                `Unsupported standings sport: ${sport}`
            );

    }


    return sports[sport];

}


export default {

    async render(
        container,
        config = {}
    ) {

        container.innerHTML =
            "";


        container.classList.add(
            "sports-standings"
        );


        const configuredSports =
            Array.isArray(
                config.sports
            )
                ? config.sports
                : [];


        if (
            configuredSports.length === 0
        ) {

            container.innerHTML =
                `
                <div class="sports-standings-message">
                    NO STANDINGS CONFIGURED
                </div>
                `;

            return;

        }


        let currentIndex =
            0;


        let currentWidget =
            null;


        let rotationTimer =
            null;


        const renderCurrentSport =
            async () => {

                const sport =
                    configuredSports[
                        currentIndex
                    ];


                /*
                * Destroy the currently rendered sport.
                */

                if (
                    currentWidget &&
                    typeof currentWidget.destroy ===
                        "function"
                ) {

                    await currentWidget.destroy(
                        container
                    );

                }


                /*
                * Completely reset the shared container.
                *
                * Sport-specific widgets add their own classes
                * (for example --nfl). Those must not survive
                * when the next sport is rendered.
                */

                container.innerHTML =
                    "";

                container.className =
                    "sports-standings";


                /*
                * Load and render the next sport.
                */

                currentWidget =
                    await loadSport(
                        sport
                    );


                await currentWidget.render(
                    container,
                    {
                        ...config,
                        sport
                    }
                );

            };


        await renderCurrentSport();


        /*
         * Only rotate when there is more than
         * one configured sport.
         */

        if (
            configuredSports.length > 1
        ) {

            const rotationSeconds =
                Number(
                    config.rotationSeconds
                ) || 30;

            rotationTimer =
                setInterval(
                    async () => {

                        currentIndex =
                            (
                                currentIndex + 1
                            )
                            %
                            configuredSports.length;


                        await renderCurrentSport();

                    },
                    rotationSeconds * 1000
                );

        }


        /*
         * Store cleanup information on the
         * container so destroy() can stop
         * the rotation.
         */

        container._sportsStandings =
            {

                get rotationTimer() {

                    return rotationTimer;

                },

                stopRotation() {

                    if (
                        rotationTimer
                    ) {

                        clearInterval(
                            rotationTimer
                        );

                        rotationTimer =
                            null;

                    }

                }

            };

    },


    async destroy(
        container
    ) {

        const state =
            container._sportsStandings;


        if (
            state
        ) {

            state.stopRotation();

        }


        container._sportsStandings =
            null;


        container.innerHTML =
            "";


        container.classList.remove(
            "sports-standings"
        );

    }

};