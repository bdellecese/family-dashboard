/*
 * ============================================================
 * QUOTE OF THE DAY DATA SERVICE
 * ============================================================
 *
 * Loads the daily Quote of the Day through the reusable RSS
 * service.
 *
 * FixQuotes RSS format:
 *
 * title       = author
 * description = quote
 * link        = quote page
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

            /*
             * ====================================================
             * LOAD RSS FEED
             * ====================================================
             */

            const stories =
                await rssData.getFeed(
                    feedUrl
                );


            /*
             * ====================================================
             * CHECK RESULTS
             * ====================================================
             */

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
            * ============================================================
            * FIND TODAY'S QUOTE
            * ============================================================
            *
            * FixQuotes may publish tomorrow's quote first.
            * Select the story whose publication date matches today.
            */

            const today =
                new Date();

            const todayDate =
                `${today.getFullYear()}-${String(
                    today.getMonth() + 1
                ).padStart(2, "0")}-${String(
                    today.getDate()
                ).padStart(2, "0")}`;

            const story =
                stories.find(
                    item => {

                        if (
                            !item.published
                        ) {

                            return false;

                        }

                        const publishedDate =
                            new Date(
                                item.published
                            )
                                .toISOString()
                                .slice(0, 10);

                        return (
                            publishedDate ===
                            todayDate
                        );

                    }
                );


            /*
            * ============================================================
            * NO QUOTE FOR TODAY
            * ============================================================
            */

            if (
                !story
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
             * EXTRACT DATA
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
                    story.source ||
                    "FixQuotes",

                link:
                    story.link,

                published:
                    story.published,

                image:
                    story.image || ""

            };

        }

        catch (error) {

            console.error(
                "Quote of the Day feed error:",
                error
            );


            return {

                available:
                    false,

                message:
                    "Quote of the Day is unavailable."

            };

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


    return value
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