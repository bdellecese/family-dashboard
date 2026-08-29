/*
 * RSS DATA SERVICE
 *
 * Reusable RSS feed loader.
 *
 * Responsibilities:
 *
 * - Load RSS feeds directly
 * - Normalize stories
 * - Cache successful responses
 * - Expire stale RSS cache entries
 * - Log cache activity
 *
 * The generic cache mechanics live in
 * services/cache/cache.js.
 */

import {
    getCached,
    setCached,
    clearCache
} from "../cache/cache.js";


/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

/*
 * Keep RSS data for 30 minutes.
 *
 * This is intentionally much longer than the
 * dashboard screen rotation interval.
 */

const RSS_CACHE_MAX_AGE =
    30 * 60 * 1000;


/*
 * ============================================================
 * RSS DATA SERVICE
 * ============================================================
 */

const rssData = {

    async getFeed(
        feedUrl
    ) {

        if (
            !feedUrl
        ) {

            throw new Error(
                "RSS feed URL is required."
            );

        }


        /*
         * --------------------------------------------------------
         * CACHE
         * --------------------------------------------------------
         */

        const cached =
            getCached(
                feedUrl,
                RSS_CACHE_MAX_AGE
            );


        if (
            cached
        ) {

            return cached;

        }



        /*
         * --------------------------------------------------------
         * FETCH
         * --------------------------------------------------------
         */

        try {

            const stories =
                await fetchFeed(
                    feedUrl
                );


            /*
             * ----------------------------------------------------
             * CACHE SUCCESSFUL RESULT
             * ----------------------------------------------------
             *
             * Never cache failed requests.
             */

            setCached(
                feedUrl,
                stories
            );

            return stories;

        }

        catch (error) {

            console.error(
                `[RSS] FETCH ERROR: ${feedUrl} - ${error.message}`
            );


            throw error;

        }

    },


    /*
     * ============================================================
     * CLEAR CACHE
     * ============================================================
     *
     * Useful during testing or if a feed needs to be
     * manually refreshed.
     */

    clearCache(
        feedUrl
    ) {

        if (
            feedUrl
        ) {


            clearCache(
                feedUrl
            );


            return;

        }


        clearCache();

    }

};


/*
 * ============================================================
 * FETCH RSS FEED
 * ============================================================
 */

async function fetchFeed(
    feedUrl
) {

    const isBrowser =
        typeof window !== "undefined";

    const requestUrl =
        isBrowser
            ? `/api/rss?url=${encodeURIComponent(feedUrl)}`
            : feedUrl;

    /*
     * --------------------------------------------------------
     * REQUEST RSS 
     * --------------------------------------------------------
     *
     * We intentionally do NOT use rss2json.
     *
     * This avoids rss2json rate limits and keeps RSS
     * retrieval under our control.
     */

    const response =
        await fetch(
            requestUrl,
            {
                headers: {

                    "User-Agent":
                        "Family Dashboard RSS Reader/1.0",

                    "Accept":
                        "application/rss+xml, application/xml, text/xml, */*"

                }

            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `RSS request failed: ${response.status}`
        );

    }


    /*
    * --------------------------------------------------------
    * BROWSER API RESPONSE
    * --------------------------------------------------------
    *
    * Browser requests go through /api/rss.
    *
    * The API returns normalized JSON rather than
    * raw RSS XML, so return the stories directly.
    */

    if (
        isBrowser
    ) {

        const data =
            await response.json();

        if (
            !data ||
            !Array.isArray(data.stories)
        ) {

            throw new Error(
                "RSS API returned an invalid response."
            );

        }

        return data.stories;

    }


    /*
     * --------------------------------------------------------
     * READ XML
     * --------------------------------------------------------
     */

    const xml =
        await response.text();


    if (
        !xml
    ) {

        throw new Error(
            "RSS feed returned an empty response."
        );

    }


    /*
     * --------------------------------------------------------
     * PARSE CHANNEL
     * --------------------------------------------------------
     */

    const source =
        decodeXml(
            getTagValue(
                xml,
                "title"
            ) || ""
        );


    /*
     * --------------------------------------------------------
     * FIND ITEMS
     * --------------------------------------------------------
     */

    const itemBlocks =
        getTagBlocks(
            xml,
            "item"
        );


    /*
     * Some feeds use Atom rather than RSS.
     *
     * We can support Atom as a fallback if no RSS
     * items were found.
     */

    if (
        itemBlocks.length === 0
    ) {

        const atomEntries =
            getTagBlocks(
                xml,
                "entry"
            );


        if (
            atomEntries.length > 0
        ) {

            const stories =
                atomEntries
                    .map(
                        entry =>
                            normalizeAtomEntry(
                                entry,
                                source
                            )
                    )
                    .filter(
                        story =>
                            story.title
                    );



                return stories;

        }

    }


    /*
     * --------------------------------------------------------
     * NORMALIZE RSS ITEMS
     * --------------------------------------------------------
     */

    const stories =
        itemBlocks
            .map(
                item =>
                    normalizeRssItem(
                        item,
                        source
                    )
            )
            .filter(
                story =>
                    story.title
            );


    return stories;

}


/*
 * ============================================================
 * NORMALIZE RSS ITEM
 * ============================================================
 */

function normalizeRssItem(
    item,
    source
) {

    const title =
        decodeXml(
            getTagValue(
                item,
                "title"
            ) || ""
        );


    const link =
        decodeXml(
            getTagValue(
                item,
                "link"
            ) || ""
        );


    const description =
        getTagValue(
            item,
            "description"
        ) || "";


    const published =
        decodeXml(
            getTagValue(
                item,
                "pubDate"
            ) ||
            getTagValue(
                item,
                "published"
            ) ||
            getTagValue(
                item,
                "date"
            ) ||
            ""
        );


    const image =
        getImageUrl(
            item
        );


    return {

        title,

        link,

        description,

        published,

        source,

        image

    };

}


/*
 * ============================================================
 * NORMALIZE ATOM ENTRY
 * ============================================================
 */

function normalizeAtomEntry(
    entry,
    source
) {

    const title =
        decodeXml(
            getTagValue(
                entry,
                "title"
            ) || ""
        );


    /*
     * Atom links are often represented as:
     *
     * <link href="..." />
     *
     * rather than:
     *
     * <link>...</link>
     */

    let link =
        getTagValue(
            entry,
            "link"
        ) || "";


    if (
        !link
    ) {

        const linkMatch =
            entry.match(
                /<link\b[^>]*href=["']([^"']+)["'][^>]*>/i
            );


        if (
            linkMatch
        ) {

            link =
                decodeXml(
                    linkMatch[1]
                );

        }

    }


    const description =
        getTagValue(
            entry,
            "summary"
        ) ||
        getTagValue(
            entry,
            "content"
        ) ||
        "";


    const published =
        decodeXml(
            getTagValue(
                entry,
                "published"
            ) ||
            getTagValue(
                entry,
                "updated"
            ) ||
            ""
        );


    const image =
        getImageUrl(
            entry
        );


    return {

        title,

        link,

        description,

        published,

        source,

        image

    };

}


/*
 * ============================================================
 * GET IMAGE URL
 * ============================================================
 *
 * RSS feeds can expose images in several different places.
 */

function getImageUrl(
    item
) {

    /*
     * --------------------------------------------------------
     * MEDIA CONTENT
     * --------------------------------------------------------
     */

    const mediaContent =
        getAttributeUrl(
            item,
            "media:content"
        );


    if (
        mediaContent
    ) {

        return mediaContent;

    }


    /*
     * --------------------------------------------------------
     * MEDIA THUMBNAIL
     * --------------------------------------------------------
     */

    const mediaThumbnail =
        getAttributeUrl(
            item,
            "media:thumbnail"
        );


    if (
        mediaThumbnail
    ) {

        return mediaThumbnail;

    }


    /*
     * --------------------------------------------------------
     * ENCLOSURE
     * --------------------------------------------------------
     */

    const enclosure =
        getAttributeUrl(
            item,
            "enclosure"
        );


    if (
        enclosure
    ) {

        return enclosure;

    }


    /*
     * --------------------------------------------------------
     * IMAGE TAG
     * --------------------------------------------------------
     */

    const imageTag =
        item.match(
            /<image[^>]*>[\s\S]*?<url>([\s\S]*?)<\/url>[\s\S]*?<\/image>/i
        );


    if (
        imageTag &&
        imageTag[1]
    ) {

        return decodeXml(
            imageTag[1].trim()
        );

    }


    /*
     * --------------------------------------------------------
     * IMAGE IN DESCRIPTION
     * --------------------------------------------------------
     *
     * Some feeds, including EyeFootball,
     * embed the image directly inside
     * the description HTML.
     */

    const description =
        getTagValue(
            item,
            "description"
        );


    if (
        description
    ) {

        const match =
            description.match(
                /<img[^>]+src=["']([^"']+)["']/i
            );


        if (
            match &&
            match[1]
        ) {

            return decodeXml(
                match[1]
            );

        }

    }


    /*
     * --------------------------------------------------------
     * IMAGE IN CONTENT
     * --------------------------------------------------------
     */

    const content =
        getTagValue(
            item,
            "content:encoded"
        ) ||
        getTagValue(
            item,
            "content"
        );


    if (
        content
    ) {

        const match =
            content.match(
                /<img[^>]+src=["']([^"']+)["']/i
            );


        if (
            match &&
            match[1]
        ) {

            return decodeXml(
                match[1]
            );

        }

    }


    /*
     * --------------------------------------------------------
     * NO IMAGE
     * --------------------------------------------------------
     */

    return null;

}


/*
 * ============================================================
 * GET TAG BLOCKS
 * ============================================================
 */

function getTagBlocks(
    xml,
    tagName
) {

    const escapedTag =
        escapeRegExp(
            tagName
        );


    const regex =
        new RegExp(
            `<${escapedTag}\\b[^>]*>[\\s\\S]*?<\\/${escapedTag}>`,
            "gi"
        );


    return [
        ...xml.matchAll(
            regex
        )
    ]
        .map(
            match =>
                match[0]
        );

}


/*
 * ============================================================
 * GET TAG VALUE
 * ============================================================
 *
 * Handles:
 *
 * <title>Hello</title>
 *
 * and namespaced tags such as:
 *
 * <content:encoded>...</content:encoded>
 */

function getTagValue(
    xml,
    tagName
) {

    const escapedTag =
        escapeRegExp(
            tagName
        );


    const regex =
        new RegExp(
            `<${escapedTag}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`,
            "i"
        );


    const match =
        xml.match(
            regex
        );


    if (
        !match
    ) {

        return "";

    }


    return match[1].trim();

}


/*
 * ============================================================
 * GET ATTRIBUTE URL
 * ============================================================
 */

function getAttributeUrl(
    xml,
    tagName
) {

    const escapedTag =
        escapeRegExp(
            tagName
        );


    const regex =
        new RegExp(
            `<${escapedTag}\\b([^>]*)>`,
            "i"
        );


    const match =
        xml.match(
            regex
        );


    if (
        !match
    ) {

        return null;

    }


    const attributes =
        match[1];


    /*
     * Prefer URL attribute.
     */

    const urlMatch =
        attributes.match(
            /\burl=["']([^"']+)["']/i
        );


    if (
        urlMatch
    ) {

        return decodeXml(
            urlMatch[1]
        );

    }


    /*
     * Enclosures use href in some feeds.
     */

    const hrefMatch =
        attributes.match(
            /\bhref=["']([^"']+)["']/i
        );


    if (
        hrefMatch
    ) {

        return decodeXml(
            hrefMatch[1]
        );

    }


    return null;

}


/*
 * ============================================================
 * XML DECODER
 * ============================================================
 */

function decodeXml(
    value
) {

    if (
        !value
    ) {

        return "";

    }


    return value
        .replace(
            /<!\[CDATA\[([\s\S]*?)\]\]>/g,
            "$1"
        )
        .replace(
            /&amp;/g,
            "&"
        )
        .replace(
            /&lt;/g,
            "<"
        )
        .replace(
            /&gt;/g,
            ">"
        )
        .replace(
            /&quot;/g,
            '"'
        )
        .replace(
            /&#39;/g,
            "'"
        )
        .replace(
            /&#x27;/gi,
            "'"
        )

        .replace(
            /&apos;/g,
            "'"
        )
        .replace(
            /&#(\d+);/g,
            (
                match,
                code
            ) =>
                String.fromCharCode(
                    Number(code)
                )
        )
        .replace(
            /&#x([0-9a-f]+);/gi,
            (
                match,
                code
            ) =>
                String.fromCharCode(
                    parseInt(
                        code,
                        16
                    )
                )
        )
        .trim();

}


/*
 * ============================================================
 * ESCAPE REGULAR EXPRESSION
 * ============================================================
 */

function escapeRegExp(
    value
) {

    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


export default rssData;