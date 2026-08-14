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
            createImage(
                photos[0]
            );

        imageA.classList.add(
            "photo-widget__image",
            "photo-widget__image--active"
        );


        const imageB =
            createImage(
                photos[
                    photos.length > 1
                        ? 1
                        : 0
                ]
            );

        imageB.classList.add(
            "photo-widget__image"
        );


        wrapper.appendChild(
            imageA
        );

        wrapper.appendChild(
            imageB
        );

        // ====================================================
        // CAPTION / PHOTO METADATA
        // ====================================================

        const caption =
            document.createElement("div");

        caption.className =
            "photo-widget__caption";

        caption.textContent =
            formatPhotoMetadata(
                photos[0]
            );

        wrapper.appendChild(
            caption
        );

        // ====================================================
        // ROTATION STATE
        // ====================================================

        let activeImage =
            imageA;

        let inactiveImage =
            imageB;

        let currentIndex =
            0;


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
                            0;

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
                         * If the refresh failed, keep using
                         * the current batch rather than
                         * breaking the slideshow.
                         */

                        currentIndex =
                            0;

                    }

                    else {

                        /*
                         * The new batch has been loaded.
                         * Start with its first photo.
                         */

                        currentIndex =
                            0;

                    }

                }

                else {

                    currentIndex += 1;

                }


                const nextPhoto =
                    photos[
                        currentIndex
                    ];


                if (!nextPhoto) {
                    return;
                }


                /*
                 * Load the next image into the inactive
                 * layer before switching visibility.
                 */

                inactiveImage.src =
                    nextPhoto.url;


                inactiveImage.onload =
                    () => {

                        activeImage.classList.remove(
                            "photo-widget__image--active"
                        );


                        inactiveImage.classList.add(
                            "photo-widget__image--active"
                        );


                        caption.textContent =
                            formatPhotoMetadata(
                                nextPhoto
                            );


                        const temp =
                            activeImage;


                        activeImage =
                            inactiveImage;


                        inactiveImage =
                            temp;


                        inactiveImage.onload =
                            null;

                    };

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
// SHOW ERROR
// ============================================================

function showError(
    wrapper,
    message
) {

    const error =
        document.createElement("div");

    error.className =
        "photo-widget__error";

    error.textContent =
        message;

    wrapper.appendChild(
        error
    );

}


// ============================================================
// CREATE IMAGE
// ============================================================

function createImage(
    photo
) {

    const image =
        document.createElement("img");


    image.src =
        photo.url;


    image.alt =
        photo.caption ||
        "Shared album photo";


    image.loading =
        "eager";


    image.draggable =
        false;


    return image;

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