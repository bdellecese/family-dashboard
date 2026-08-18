/*
 * ============================================================
 * QUOTE OF THE DAY DATA SERVICE
 * ============================================================
 *
 * Loads the daily Quote of the Day directly from FixQuotes.
 *
 * FixQuotes RSS format:
 *
 * title       = author
 * description = quote
 * link        = quote page
 *
 * ============================================================
 */

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
             * FETCH RSS FEED DIRECTLY
             * ====================================================
             */

            const response =
                await fetch(
                    feedUrl,
                    {
                        cache:
                            "no-store"
                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `Quote feed request failed: ${response.status}`
                );

            }


            /*
             * ====================================================
             * READ RSS
             * ====================================================
             */

            const xml =
                await response.text();


            const parser =
                new DOMParser();


            const document =
                parser.parseFromString(
                    xml,
                    "application/xml"
                );


            /*
             * ====================================================
             * CHECK FOR PARSE ERRORS
             * ====================================================
             */

            const parserError =
                document.querySelector(
                    "parsererror"
                );


            if (
                parserError
            ) {

                throw new Error(
                    "Unable to parse Quote of the Day feed."
                );

            }


            /*
             * ====================================================
             * GET FIRST ITEM
             * ====================================================
 */

            const item =
                document.querySelector(
                    "item"
                );


            if (
                !item
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
             * EXTRACT FIELDS
             * ====================================================
 */

            const quote =
                cleanText(
                    getElementText(
                        item,
                        "description"
                    )
                );


            const author =
                cleanText(
                    getElementText(
                        item,
                        "title"
                    )
                );


            const link =
                getElementText(
                    item,
                    "link"
                );


            const published =
                getElementText(
                    item,
                    "pubDate"
                );


            /*
             * ====================================================
             * IMAGE
             * ====================================================
 */

            const mediaContent =
                item.querySelector(
                    "media\\:content"
                );


            const enclosure =
                item.querySelector(
                    "enclosure"
                );


            const image =
                mediaContent?.getAttribute(
                    "url"
                ) ||
                enclosure?.getAttribute(
                    "url"
                ) ||
                "";


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
                    link,

                published:
                    published,

                image:
                    image

            };

        }

        catch (error) {

            console.error(
                "Quote of the Day feed error:",
                error
            );


            throw error;

        }

    }

};


/*
 * ============================================================
 * GET ELEMENT TEXT
 * ============================================================
 */

function getElementText(
    parent,
    selector
) {

    const element =
        parent.querySelector(
            selector
        );


    if (
        !element
    ) {

        return "";

    }


    return (
        element.textContent ||
        ""
    ).trim();

}


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