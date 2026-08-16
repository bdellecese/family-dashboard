const DEFAULT_ALBUM_URL =
    "https://www.icloud.com/sharedalbum/#B0k5yeZFhGG13uA";

const DEFAULT_ROTATION_INTERVAL =
    30;

const DEFAULT_BATCH_COUNT =
    100;


// ============================================================
// PHOTO WIDGET
// ============================================================

const photo = {

    name: "photo",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        // ====================================================
        // CONFIGURATION
        // ====================================================

        const albumUrl =
            config.albumUrl ||
            DEFAULT_ALBUM_URL;


        const interval =
            Number(
                config.interval ||
                DEFAULT_ROTATION_INTERVAL
            );


        const batchCount =
            Number(
                config.batchCount ||
                DEFAULT_BATCH_COUNT
            );


        // ====================================================
        // WRAPPER
        // ====================================================

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "photo-widget";

        container.appendChild(
            wrapper
        );


        // ====================================================
        // LOAD INITIAL PHOTO BATCH
        // ====================================================

        let photos;

        try {

            photos =
                await loadPhotos(
                    albumUrl,
                    batchCount
                );

        }

        catch (error) {

            console.error(
                "iCloud photo error:",
                error
            );


            showError(
                wrapper,
                "Unable to load photos"
            );

            return;

        }


        // ====================================================
        // NO PHOTOS
        // ====================================================

        if (
            !photos ||
            photos.length === 0
        ) {

            showError(
                wrapper,
                "No photos found"
            );

            return;

        }


        // ====================================================
        // RANDOMIZE BATCH
        // ====================================================

        shuffle(
            photos
        );


        // ====================================================
        // CREATE IMAGE LAYERS
        // ====================================================

        const imageA =
            createImageLayer();


        const imageB =
            createImageLayer();


        imageA.wrapper.classList.add(
            "photo-widget__image-layer",
            "photo-widget__image-layer--active"
        );


        imageB.wrapper.classList.add(
            "photo-widget__image-layer"
        );


        wrapper.appendChild(
            imageA.wrapper
        );

        wrapper.appendChild(
            imageB.wrapper
        );


        // ====================================================
        // CAPTION / PHOTO METADATA
        // ====================================================

        const caption =
            document.createElement("div");

        caption.className =
            "photo-widget__caption";


        wrapper.appendChild(
            caption
        );


        // ====================================================
        // LOAD FIRST VALID PHOTO
        // ====================================================

        let currentIndex =
            -1;

        const initialPhoto =
            await findLoadablePhoto(
                photos,
                0
            );


        if (!initialPhoto) {

            showError(
                wrapper,
                "Unable to load photos"
            );

            return;

        }


        currentIndex =
            initialPhoto.index;


        setImage(
            imageA,
            initialPhoto.photo.url
        );


        caption.textContent =
            formatPhotoMetadata(
                initialPhoto.photo
            );


        // ====================================================
        // ROTATION STATE
        // ====================================================

        let activeImage =
            imageA;

        let inactiveImage =
            imageB;


        // ====================================================
        // LOAD NEXT BATCH
        // ====================================================

        const loadNextBatch =
            async () => {

                try {

                    const nextPhotos =
                        await loadPhotos(
                            albumUrl,
                            batchCount
                        );


                    if (
                        nextPhotos &&
                        nextPhotos.length > 0
                    ) {

                        shuffle(
                            nextPhotos
                        );

                        photos =
                            nextPhotos;

                        currentIndex =
                            -1;

                        console.log(
                            `Photo widget loaded new batch: ${photos.length} photos`
                        );

                        return true;

                    }

                }

                catch (error) {

                    console.error(
                        "iCloud photo batch refresh error:",
                        error
                    );

                }


                return false;

            };


        // ====================================================
        // ROTATE PHOTO
        // ====================================================

        const rotate =
            async () => {

                /*
                 * If we have reached the end of the
                 * current batch, get another random batch.
                 */

                if (
                    currentIndex >=
                    photos.length - 1
                ) {

                    const loaded =
                        await loadNextBatch();


                    if (!loaded) {

                        /*
                         * If the refresh failed, start again
                         * from the current batch.
                         */

                        currentIndex =
                            -1;

                    }

                }


                /*
                 * Find the next photo that actually loads.
                 */

                const nextPhoto =
                    await findLoadablePhoto(
                        photos,
                        currentIndex + 1
                    );


                if (!nextPhoto) {

                    return;

                }


                currentIndex =
                    nextPhoto.index;


                /*
                 * The image has already been successfully
                 * preloaded.
                 *
                 * Load it into the inactive layer before
                 * making that layer visible.
                 */

                setImage(
                    inactiveImage,
                    nextPhoto.photo.url
                );


                /*
                 * Crossfade to the new image.
                 */

                activeImage.wrapper.classList.remove(
                    "photo-widget__image-layer--active"
                );


                inactiveImage.wrapper.classList.add(
                    "photo-widget__image-layer--active"
                );


                caption.textContent =
                    formatPhotoMetadata(
                        nextPhoto.photo
                    );


                /*
                 * Swap active/inactive layers.
                 */

                const temp =
                    activeImage;


                activeImage =
                    inactiveImage;


                inactiveImage =
                    temp;

            };


        // ====================================================
        // START TIMER
        // ====================================================

        if (
            photos.length > 1
        ) {

            setInterval(
                rotate,
                interval * 1000
            );

        }

    }

};


// ============================================================
// LOAD PHOTOS FROM DASHBOARD SERVER
// ============================================================

async function loadPhotos(
    albumUrl,
    batchCount
) {

    const params =
        new URLSearchParams();


    if (albumUrl) {

        params.set(
            "albumUrl",
            albumUrl
        );

    }


    /*
     * Request the configured batch size from the
     * dashboard server.
     */

    if (
        Number.isFinite(
            Number(batchCount)
        ) &&
        Number(batchCount) > 0
    ) {

        params.set(
            "photoCount",
            String(
                Math.floor(
                    Number(batchCount)
                )
            )
        );

    }


    const response =
        await fetch(
            `/api/photos?${params.toString()}`,
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Photo API returned ${response.status}`
        );

    }


    const data =
        await response.json();


    if (
        data &&
        data.error
    ) {

        throw new Error(
            data.error
        );

    }


    return (
        data &&
        Array.isArray(
            data.photos
        )

            ? data.photos

            : []
    );

}


// ============================================================
// FIND LOADABLE PHOTO
// ============================================================

async function findLoadablePhoto(
    photos,
    startIndex
) {

    if (
        !photos ||
        photos.length === 0
    ) {

        return null;

    }


    /*
     * Try each photo once, wrapping around to the beginning
     * if necessary.
     */

    for (
        let offset = 0;
        offset < photos.length;
        offset++
    ) {

        const index =
            (
                startIndex +
                offset
            ) % photos.length;


        const photo =
            photos[index];


        if (
            !photo ||
            !photo.url
        ) {

            continue;

        }


        try {

            await preloadImage(
                photo.url
            );


            return {
                photo,
                index
            };

        }

        catch (error) {

            console.warn(
                "Photo failed to load, skipping:",
                photo.url,
                error
            );

        }

    }


    return null;

}


// ============================================================
// PRELOAD IMAGE
// ============================================================

function preloadImage(
    url
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const image =
                new Image();


            image.onload =
                () => {

                    resolve();

                };


            image.onerror =
                () => {

                    reject(
                        new Error(
                            "Image failed to load"
                        )
                    );

                };


            image.src =
                url;

        }
    );

}


// ============================================================
// CREATE IMAGE LAYER
// ============================================================

function createImageLayer() {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "photo-widget__image-layer";


    /*
     * Blurred background.
     *
     * This is a CSS background rather than a second
     * <img>. This prevents the iCloud image from being
     * requested twice.
     */

    const background =
        document.createElement("div");

    background.className =
        "photo-widget__image-background";


    /*
     * Actual photo.
     */

    const image =
        document.createElement("img");

    image.className =
        "photo-widget__image";

    image.alt =
        "Shared album photo";

    image.loading =
        "eager";

    image.draggable =
        false;


    wrapper.appendChild(
        background
    );

    wrapper.appendChild(
        image
    );


    return {
        wrapper,
        background,
        image
    };

}


// ============================================================
// SET IMAGE
// ============================================================

function setImage(
    layer,
    url
) {

    /*
     * Use the same photo for both layers.
     *
     * Background:
     *     cover + blur
     *
     * Foreground:
     *     contain
     */

    layer.background.style.backgroundImage =
        `url("${url}")`;


    layer.image.src =
        url;

}


// ============================================================
// CAPTION
// ============================================================

function formatPhotoMetadata(
    photo
) {

    if (!photo) {
        return "";
    }


    const caption =
        photo.caption ||
        "";


    const date =
        photo.date
            ? new Date(
                photo.date
            ).toLocaleDateString(
                undefined,
                {
                    month:
                        "short",
                    day:
                        "numeric",
                    year:
                        "numeric",
                    timeZone:
                        "UTC"
                }
            )
            : "";


    const postedBy =
        photo.postedBy
            ? `Posted by ${photo.postedBy}`
            : "";


    return [
        caption,
        date,
        postedBy
    ]
        .filter(Boolean)
        .join(" | ");

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


export default photo;