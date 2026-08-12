/*
 * ============================================================
 * ON THIS DAY DATA SERVICE
 * ============================================================
 *
 * Loads historical events for today's month and day.
 *
 * Uses the Wikipedia "On This Day" API.
 *
 * ============================================================
 */

const onThisDayData = {

    /*
     * ========================================================
     * GET EVENTS
     * ========================================================
     */

    async getEvents() {

        const now =
            new Date();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );


        const url =
            `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;


        try {

            const response =
                await fetch(
                    url
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `On This Day request failed: ${response.status}`
                );

            }


            const data =
                await response.json();


            if (
                !data ||
                !Array.isArray(
                    data.events
                )
            ) {

                return {

                    available:
                        false,

                    message:
                        "On This Day is unavailable."

                };

            }


            /*
             * ====================================================
             * FILTER / NORMALIZE EVENTS
             * ====================================================
             */

            const events =
                data.events
                    .filter(
                        event =>
                            event &&
                            event.year &&
                            event.text
                    )
                    .map(
                        event => ({

                            year:
                                event.year,

                            text:
                                cleanText(
                                    event.text
                                ),

                            pages:
                                Array.isArray(
                                    event.pages
                                )
                                    ? event.pages
                                    : []

                        })
                    );


            if (
                events.length === 0
            ) {

                return {

                    available:
                        false,

                    message:
                        "No historical events found."

                };

            }


            return {

                available:
                    true,

                events:
                    events

            };

        }

        catch (error) {

            throw error;

        }

    }

};


/*
 * ============================================================
 * CLEAN TEXT
 * ============================================================
 */

function cleanText(
    value
) {

    if (
        !value
    ) {

        return "";

    }


    const temp =
        document.createElement(
            "div"
        );


    temp.innerHTML =
        value;


    return (
        temp.textContent ||
        temp.innerText ||
        ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


export default onThisDayData;