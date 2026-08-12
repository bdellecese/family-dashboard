/*
 * ============================================================
 * QUOTE OF THE DAY DATA SERVICE
 * ============================================================
 *
 * Loads the daily Quote of the Day using the reusable
 * RSS data service.
 *
 * FixQuotes RSS format:
 *
 * title       = author
 * description = quote
 *
 * ============================================================
 */

import rssData
from "../rss/rss-data.js";


const quoteOfDayData = {


    /*
     * ========================================================
     * GET QUOTE OF THE DAY
     * ========================================================
     */

    async getQuoteOfDay() {

        const feedUrl =
            "https://fixquotes.com/feeds/qotd.rss";


        try {

            const stories =
                await rssData.getFeed(
                    feedUrl
                );


            if (
                !stories ||
                stories.length === 0
            ) {

                return {

                    available:
                        false,

                    message:
                        "Quote of the Day is unavailable."

                };

            }


            /*
             * ====================================================
             * FIRST STORY
             * ====================================================
             */

            const story =
                stories[0];


            /*
             * ====================================================
             * FIXQUOTES FORMAT
             *
             * title       = author
             * description = quote
             * ====================================================
             */

            const quote =
                cleanText(
                    story.description
                );


            const author =
                cleanText(
                    story.title
                );


            /*
             * ====================================================
             * VALIDATE
             * ====================================================
             */

            if (
                !quote
            ) {

                return {

                    available:
                        false,

                    message:
                        "Quote of the Day is unavailable."

                };

            }


            /*
             * ====================================================
             * FINAL DATA
             * ====================================================
             */

            return {

                available:
                    true,

                quote:
                    quote,

                author:
                    author,

                source:
                    "FixQuotes",

                link:
                    story.link || ""

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
        .trim()
        .replace(
            /^["“”]+|["“”]+$/g,
            ""
        );

}


export default quoteOfDayData;