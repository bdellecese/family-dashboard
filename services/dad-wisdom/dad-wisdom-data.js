/*
 * ============================================================
 * DAD WISDOM DATA SERVICE
 * ============================================================
 *
 * Loads a random dad joke from icanhazdadjoke.com.
 *
 * ============================================================
 */

const dadWisdomData = {


    /*
     * ========================================================
     * GET RANDOM DAD JOKE
     * ========================================================
     */

    async getDadWisdom() {

        const response =
            await fetch(
                "https://icanhazdadjoke.com/",
                {

                    method:
                        "GET",

                    headers: {

                        Accept:
                            "application/json"

                    }

                }
            );


        /*
         * ====================================================
         * CHECK RESPONSE
         * ====================================================
         */

        if (
            !response.ok
        ) {

            throw new Error(
                `Dad Wisdom request failed: ${response.status}`
            );

        }


        /*
         * ====================================================
         * PARSE RESPONSE
         * ====================================================
         */

        const data =
            await response.json();


        /*
         * ====================================================
         * VALIDATE
         * ====================================================
         */

        if (
            !data ||
            !data.joke
        ) {

            throw new Error(
                "No dad joke returned."
            );

        }


        /*
         * ====================================================
         * RETURN NORMALIZED DATA
         * ====================================================
         */

        return {

            available:
                true,

            joke:
                data.joke,

            source:
                "icanhazdadjoke"

        };

    }

};


export default dadWisdomData;