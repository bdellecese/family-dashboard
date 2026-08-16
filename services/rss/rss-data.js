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
                        "",

                    image:
                        getImageUrl(
                            item
                        )

                })
            )
            .filter(
                story =>
                    story.title
            );

    }

};


/*
 * GET IMAGE URL
 *
 * rss2json can expose images in
 * several different places depending
 * on the source feed.
 */

function getImageUrl(
    item
) {

    /*
     * Thumbnail
     */

    if (
        item.thumbnail
    ) {

        return item.thumbnail;

    }


    /*
     * Enclosure
     */

    if (
        item.enclosure?.link
    ) {

        return item.enclosure.link;

    }


    /*
     * Media content
     */

    if (
        item.media?.content?.url
    ) {

        return item.media.content.url;

    }


    /*
     * Media thumbnail
     */

    if (
        item.media?.thumbnail?.url
    ) {

        return item.media.thumbnail.url;

    }


    /*
     * IMAGE IN DESCRIPTION
     *
     * Some RSS feeds, including
     * EyeFootball, embed the image
     * directly inside the description HTML.
     */

    if (
        item.description
    ) {

        const match =
            item.description.match(
                /<img[^>]+src=["']([^"']+)["']/i
            );

        if (
            match &&
            match[1]
        ) {

            return match[1];

        }

    }


    /*
     * IMAGE IN CONTENT
     *
     * Fallback for feeds that put
     * the image in content instead.
     */

    if (
        item.content
    ) {

        const match =
            item.content.match(
                /<img[^>]+src=["']([^"']+)["']/i
            );

        if (
            match &&
            match[1]
        ) {

            return match[1];

        }

    }


    /*
     * No image available
     */

    return null;

}


export default rssData;