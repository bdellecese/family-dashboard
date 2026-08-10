/*
 * RSS DATA SERVICE
 *
 * Reusable RSS feed loader.
 *
 * Returns a normalized array of stories.
 */

const rssData = {

    async getFeed(feedUrl) {

        /*
         * RSS-TO-JSON SERVICE
         */

        const url =
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
                feedUrl
            )}`;


        /*
         * FETCH FEED
         */

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `RSS request failed: ${response.status}`
            );

        }


        /*
         * PARSE RESPONSE
         */

        const data =
            await response.json();


        /*
         * CHECK SERVICE RESPONSE
         */

        if (
            data.status !== "ok"
        ) {

            throw new Error(
                data.message ||
                "Unable to retrieve RSS feed."
            );

        }


        /*
         * MAKE SURE ITEMS IS AN ARRAY
         */

        if (
            !Array.isArray(data.items)
        ) {

            return [];

        }


        /*
         * NORMALIZE STORIES
         *
         * Filter out any invalid
         * RSS items.
         */

        return data.items
            .filter(
                item =>
                    item &&
                    typeof item === "object"
            )
            .map(
                item => ({

                    title:
                        item.title ||
                        "",

                    link:
                        item.link ||
                        "",

                    description:
                        item.description ||
                        "",

                    published:
                        item.pubDate ||
                        "",

                    source:
                        data.feed?.title ||
                        ""

                })
            )
            .filter(
                story =>
                    story.title
            );

    }

};


export default rssData;