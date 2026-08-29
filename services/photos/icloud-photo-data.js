import {
    getCached,
    setCached
} from "../cache/cache.js";


const DEFAULT_ALBUM_URL =
    "https://www.icloud.com/sharedalbum/#B0k5yeZFhGG13uA";


// ============================================================
// CONFIGURATION
// ============================================================

const DEFAULT_PHOTO_COUNT =
    100;


// How often we check iCloud for album changes.
const ICLOUD_STREAM_CACHE_MAX_AGE =
    6 * 60 * 60 * 1000; // 6 hours


// ============================================================
// ICLOUD PHOTO DATA
// ============================================================

const icloudPhotoData = {

    async getPhotos(
        albumUrl = DEFAULT_ALBUM_URL,
        photoCount = DEFAULT_PHOTO_COUNT
    ) {

        const albumId =
            getAlbumId(
                albumUrl
            );


        if (!albumId) {

            throw new Error(
                "Invalid iCloud Shared Album URL"
            );

        }


        // ====================================================
        // DETERMINE REQUESTED PHOTO COUNT
        // ====================================================

        const requestedPhotoCount =
            Number(
                photoCount
            );


        const selectedPhotoCount =
            Number.isFinite(
                requestedPhotoCount
            ) &&
            requestedPhotoCount > 0

                ? Math.floor(
                    requestedPhotoCount
                )

                : DEFAULT_PHOTO_COUNT;


        // ====================================================
        // GET PHOTO STREAM
        // ====================================================

        const streamCacheKey =
            `icloud-stream:${albumId}`;


        const cachedStream =
            getCached(
                streamCacheKey,
                ICLOUD_STREAM_CACHE_MAX_AGE
            );


        let stream;
        let apiBase;


        if (cachedStream) {

            stream =
                cachedStream.stream;

            apiBase =
                cachedStream.apiBase;

        }

        else {

            // ------------------------------------------------
            // Initial request
            // ------------------------------------------------

            apiBase =
                `https://sharedstreams.icloud.com/${albumId}/sharedstreams`;


            let streamResponse =
                await fetch(
                    `${apiBase}/webstream`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                streamCtag:
                                    null
                            })
                    }
                );


            /*
             * iCloud can return HTTP 330 here.
             *
             * The response body contains:
             *
             *     X-Apple-MMe-Host
             *
             * which tells us which sharedstreams host
             * should actually be used.
             */

            stream =
                await streamResponse.json();


            // ------------------------------------------------
            // Use Apple's current stream host if provided
            // ------------------------------------------------

            const appleHost =
                stream[
                    "X-Apple-MMe-Host"
                ];


            if (appleHost) {

                apiBase =
                    `https://${appleHost}/${albumId}/sharedstreams`;


                streamResponse =
                    await fetch(
                        `${apiBase}/webstream`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    streamCtag:
                                        null
                                })
                        }
                    );


                stream =
                    await streamResponse.json();

            }


            // ------------------------------------------------
            // Cache the final stream and resolved API host.
            // ------------------------------------------------

            setCached(
                streamCacheKey,
                {
                    stream,
                    apiBase
                }
            );

        }


        // ====================================================
        // VALIDATE STREAM
        // ====================================================

        if (
            !stream ||
            !Array.isArray(
                stream.photos
            )
        ) {

            throw new Error(
                "No photos returned from iCloud Shared Album"
            );

        }


        // ====================================================
        // FILTER PHOTOS
        // ====================================================

        /*
         * iCloud Shared Albums contain both photos and videos.
         *
         * Videos have:
         *
         *     mediaAssetType === "video"
         *
         * Filter them out here so they never reach the
         * browser and never cause Image() load failures.
         */

        const availablePhotos =
            stream.photos
                .filter(
                    photo =>
                        photo &&
                        photo.photoGuid &&
                        photo.mediaAssetType !== "video"
                );


        if (
            availablePhotos.length === 0
        ) {

            return [];

        }


        // ====================================================
        // RANDOMIZE PHOTO COLLECTION
        // ====================================================

        const shuffledPhotos =
            [...availablePhotos];


        shuffle(
            shuffledPhotos
        );


        // ====================================================
        // SELECT RANDOM PHOTO BATCH
        // ====================================================

        const selectedPhotos =
            shuffledPhotos.slice(
                0,
                Math.min(
                    selectedPhotoCount,
                    shuffledPhotos.length
                )
            );


        // ====================================================
        // GET PHOTO GUIDS
        // ====================================================

        const photoGuids =
            selectedPhotos
                .map(
                    photo =>
                        photo.photoGuid
                )
                .filter(Boolean);


        if (
            photoGuids.length === 0
        ) {

            return [];

        }


        // ====================================================
        // GET ASSET URLS
        // ====================================================

        const assetsResponse =
            await fetch(
                `${apiBase}/webasseturls`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            photoGuids
                        })
                }
            );


        if (
            !assetsResponse.ok
        ) {

            throw new Error(
                `iCloud asset request returned ${assetsResponse.status}`
            );

        }


        const assets =
            await assetsResponse.json();


        // ====================================================
        // BUILD ASSET LOOKUP
        // ====================================================

        const assetLookup =
            buildAssetLookup(
                assets
            );


        // ====================================================
        // BUILD PHOTO RESULTS
        // ====================================================

        const photos =
            selectedPhotos
                .map(
                    photo => {

                        const checksum =
                            getLargestDerivativeChecksum(
                                photo
                            );


                        const url =
                            assetLookup[
                                checksum
                            ];


                        if (!url) {

                            return null;

                        }


                        return {
                            id:
                                photo.photoGuid,

                            url,

                            caption:
                                photo.caption ||
                                "",

                            date:
                                photo.dateCreated ||
                                null,

                            postedBy:
                                photo.contributorFullName ||
                                ""
                        };

                    }
                )
                .filter(Boolean);


        return photos;

    }

};


// ============================================================
// GET ALBUM ID
// ============================================================

function getAlbumId(
    albumUrl
) {

    if (!albumUrl) {

        return null;

    }


    const hashIndex =
        albumUrl.indexOf(
            "#"
        );


    if (
        hashIndex >= 0
    ) {

        return albumUrl
            .substring(
                hashIndex + 1
            )
            .trim();

    }


    if (
        !albumUrl.includes("/")
    ) {

        return albumUrl.trim();

    }


    return null;

}


// ============================================================
// FIND LARGEST DERIVATIVE
// ============================================================

function getLargestDerivativeChecksum(
    photo
) {

    if (
        !photo ||
        !photo.derivatives ||
        typeof photo.derivatives !== "object" ||
        Array.isArray(photo.derivatives)
    ) {

        return null;

    }


    const derivatives =
        Object.values(
            photo.derivatives
        )
        .filter(
            derivative =>
                derivative &&
                derivative.checksum
        );


    if (
        derivatives.length === 0
    ) {

        return null;

    }


    derivatives.sort(
        (a, b) => {

            const aSize =
                Number(
                    a.fileSize ||
                    0
                );


            const bSize =
                Number(
                    b.fileSize ||
                    0
                );


            return bSize - aSize;

        }
    );


    return derivatives[0].checksum;

}


// ============================================================
// BUILD ASSET LOOKUP
// ============================================================

function buildAssetLookup(
    assets
) {

    const lookup = {};


    if (
        !assets ||
        !assets.items
    ) {

        return lookup;

    }


    // --------------------------------------------------------
    // iCloud normally returns items as an object keyed
    // by checksum.
    // --------------------------------------------------------

    if (
        !Array.isArray(
            assets.items
        )
    ) {

        Object.entries(
            assets.items
        ).forEach(
            (
                [
                    key,
                    value
                ]
            ) => {

                if (
                    value &&
                    value.url_location &&
                    value.url_path
                ) {

                    lookup[key] =
                        buildAssetUrl(
                            value
                        );

                }

            }
        );


        return lookup;

    }


    // --------------------------------------------------------
    // Also support an array response.
    // --------------------------------------------------------

    assets.items.forEach(
        item => {

            if (
                item &&
                item.checksum &&
                item.url_location &&
                item.url_path
            ) {

                lookup[
                    item.checksum
                ] =
                    buildAssetUrl(
                        item
                    );

            }

        }
    );


    return lookup;

}


// ============================================================
// BUILD IMAGE URL
// ============================================================

function buildAssetUrl(
    asset
) {

    const location =
        asset.url_location
            .startsWith(
                "http"
            )

            ? asset.url_location

            : `https://${asset.url_location}`;


    return (
        location +
        asset.url_path
    );

}


// ============================================================
// SHUFFLE
// ============================================================

function shuffle(
    array
) {

    for (
        let i =
            array.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;

}


export default icloudPhotoData;