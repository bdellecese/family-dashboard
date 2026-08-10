const DEFAULT_ALBUM_URL =
    "https://www.icloud.com/sharedalbum/#B0k5yeZFhGG13uA";

const icloudPhotoData = {

    async getPhotos(
        albumUrl = DEFAULT_ALBUM_URL
    ) {

        const albumId =
            getAlbumId(albumUrl);

        if (!albumId) {
            throw new Error(
                "Invalid iCloud Shared Album URL"
            );
        }

        let apiBase =
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
                            streamCtag: null
                        })
                }
            );

        let stream =
            await streamResponse.json();

        const appleHost =
            stream["X-Apple-MMe-Host"];

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
                                streamCtag: null
                            })
                    }
                );

            stream =
                await streamResponse.json();
        }

        if (
            !stream ||
            !Array.isArray(stream.photos)
        ) {
            throw new Error(
                "No photos returned from iCloud Shared Album"
            );
        }

        const photoGuids =
            stream.photos
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

        const assets =
            await assetsResponse.json();

        const assetLookup =
            buildAssetLookup(assets);

        const photos =
            stream.photos
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
                                null
                        };
                    }
                )
                .filter(Boolean);

        return photos;
    }
};


/*
 * GET ALBUM ID
 */

function getAlbumId(
    albumUrl
) {

    if (!albumUrl) {
        return null;
    }

    const hashIndex =
        albumUrl.indexOf("#");

    if (hashIndex >= 0) {

        return albumUrl
            .substring(hashIndex + 1)
            .trim();
    }

    if (!albumUrl.includes("/")) {
        return albumUrl.trim();
    }

    return null;
}


/*
 * FIND LARGEST IMAGE
 */

function getLargestDerivativeChecksum(
    photo
) {

    if (
        !photo ||
        !Array.isArray(
            photo.derivatives
        )
    ) {
        return null;
    }

    const derivatives =
        photo.derivatives
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
                    a.fileSize || 0
                );

            const bSize =
                Number(
                    b.fileSize || 0
                );

            return bSize - aSize;
        }
    );

    return derivatives[0].checksum;
}


/*
 * BUILD ASSET LOOKUP
 */

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

    if (
        !Array.isArray(
            assets.items
        )
    ) {

        Object.entries(
            assets.items
        ).forEach(
            ([key, value]) => {

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


/*
 * BUILD IMAGE URL
 */

function buildAssetUrl(
    asset
) {

    const location =
        asset.url_location
            .startsWith("http")
            ? asset.url_location
            : `https://${asset.url_location}`;

    return (
        location +
        asset.url_path
    );
}


export default icloudPhotoData;