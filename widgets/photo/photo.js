import {
    startPerformanceTimer,
    recordPerformanceEvent
} from "../../performance.js";


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

        const sessionId =
            createPerformanceId("photo");


        const renderTimer =
            startPerformanceTimer(
                "photo-render",
                "photo",
                {
                    sessionId
                }
            );


        let rotationTimer =
            null;


        let destroyed =
            false;


        try {

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


            recordPerformanceEvent({

                type:
                    "photo-config",

                name:
                    "photo",

                sessionId,

                interval,

                batchCount

            });


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

            const initialBatchTimer =
                startPerformanceTimer(
                    "photo-batch",
                    "initial",
                    {
                        sessionId,
                        batchCount
                    }
                );


            let photos;

            try {

                photos =
                    await loadPhotos(
                        albumUrl,
                        batchCount,
                        sessionId
                    );


                initialBatchTimer.end({

                    success:
                        true,

                    photoCount:
                        photos.length

                });

            }

            catch (error) {

                initialBatchTimer.end({

                    success:
                        false,

                    error:
                        error?.message ||
                        String(error)

                });


                console.error(
                    "iCloud photo error:",
                    error
                );


                showError(
                    wrapper,
                    "Unable to load photos"
                );


                renderTimer.end({

                    success:
                        false,

                    error:
                        error?.message ||
                        String(error)

                });


                return;

            }


            // ====================================================
            // NO PHOTOS
            // ====================================================

            if (
                !photos ||
                photos.length === 0
            ) {

                recordPerformanceEvent({

                    type:
                        "photo-empty",

                    name:
                        "photo",

                    sessionId

                });


                showError(
                    wrapper,
                    "No photos found"
                );


                renderTimer.end({

                    success:
                        false,

                    reason:
                        "no-photos"

                });


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


            const initialPhotoTimer =
                startPerformanceTimer(
                    "photo-find",
                    "initial",
                    {
                        sessionId,
                        photoCount:
                            photos.length
                    }
                );


            const initialPhoto =
                await findLoadablePhoto(
                    photos,
                    0,
                    sessionId
                );


            if (!initialPhoto) {

                initialPhotoTimer.end({

                    success:
                        false,

                    reason:
                        "no-loadable-photo"

                });


                showError(
                    wrapper,
                    "Unable to load photos"
                );


                renderTimer.end({

                    success:
                        false,

                    reason:
                        "no-loadable-photo"

                });


                return;

            }


            initialPhotoTimer.end({

                success:
                    true,

                index:
                    initialPhoto.index

            });


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


            recordPerformanceEvent({

                type:
                    "photo-initial-display",

                name:
                    "photo",

                sessionId,

                photoId:
                    initialPhoto.photo.id,

                index:
                    initialPhoto.index

            });


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

                    const batchTimer =
                        startPerformanceTimer(
                            "photo-batch",
                            "refresh",
                            {
                                sessionId,
                                batchCount
                            }
                        );


                    try {

                        const nextPhotos =
                            await loadPhotos(
                                albumUrl,
                                batchCount,
                                sessionId
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


                            batchTimer.end({

                                success:
                                    true,

                                photoCount:
                                    nextPhotos.length

                            });


                            return true;

                        }


                        batchTimer.end({

                            success:
                                false,

                            reason:
                                "empty-batch"

                        });

                    }

                    catch (error) {

                        batchTimer.end({

                            success:
                                false,

                            error:
                                error?.message ||
                                String(error)

                        });


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

                    if (
                        destroyed
                    ) {

                        return;

                    }


                    const rotationTimer =
                        startPerformanceTimer(
                            "photo-rotation",
                            "rotate",
                            {
                                sessionId
                            }
                        );


                    let refreshedBatch =
                        false;


                    try {

                        // ====================================================
                        // REFRESH BATCH IF NECESSARY
                        // ====================================================

                        if (
                            currentIndex >=
                            photos.length - 1
                        ) {

                            refreshedBatch =
                                await loadNextBatch();


                            if (!refreshedBatch) {

                                /*
                                 * If refresh failed, restart from
                                 * the current batch.
                                 */

                                currentIndex =
                                    -1;

                            }

                        }


                        // ====================================================
                        // FIND NEXT LOADABLE PHOTO
                        // ====================================================

                        const nextPhoto =
                            await findLoadablePhoto(
                                photos,
                                currentIndex + 1,
                                sessionId
                            );


                        if (!nextPhoto) {

                            rotationTimer.end({

                                success:
                                    false,

                                reason:
                                    "no-loadable-photo",

                                refreshedBatch

                            });


                            return;

                        }


                        currentIndex =
                            nextPhoto.index;


                        // ====================================================
                        // UPDATE IMAGE
                        // ====================================================

                        setImage(
                            inactiveImage,
                            nextPhoto.photo.url
                        );


                        // ====================================================
                        // CROSSFADE
                        // ====================================================

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


                        // ====================================================
                        // SWAP LAYERS
                        // ====================================================

                        const temp =
                            activeImage;


                        activeImage =
                            inactiveImage;


                        inactiveImage =
                            temp;


                        rotationTimer.end({

                            success:
                                true,

                            photoId:
                                nextPhoto.photo.id,

                            index:
                                nextPhoto.index,

                            refreshedBatch

                        });

                    }

                    catch (error) {

                        rotationTimer.end({

                            success:
                                false,

                            error:
                                error?.message ||
                                String(error),

                            refreshedBatch

                        });


                        console.error(
                            "Photo rotation error:",
                            error
                        );

                    }

                };


            // ====================================================
            // START ROTATION TIMER
            // ====================================================

            if (
                photos.length > 1
            ) {

                rotationTimer =
                    setInterval(
                        rotate,
                        interval * 1000
                    );


                recordPerformanceEvent({

                    type:
                        "photo-rotation-start",

                    name:
                        "photo",

                    sessionId,

                    interval,

                    photoCount:
                        photos.length

                });

            }


            // ====================================================
            // RENDER COMPLETE
            // ====================================================

            renderTimer.end({

                success:
                    true,

                photoCount:
                    photos.length,

                interval,

                batchCount

            });


            // ====================================================
            // CLEANUP
            // ====================================================

            return async () => {

                destroyed =
                    true;


                if (
                    rotationTimer
                ) {

                    clearInterval(
                        rotationTimer
                    );


                    rotationTimer =
                        null;

                }


                recordPerformanceEvent({

                    type:
                        "photo-cleanup",

                    name:
                        "photo",

                    sessionId

                });

            };

        }

        catch (error) {

            renderTimer.end({

                success:
                    false,

                error:
                    error?.message ||
                    String(error)

            });


            throw error;

        }

    }

};


// ============================================================
// LOAD PHOTOS FROM DASHBOARD SERVER
// ============================================================

async function loadPhotos(
    albumUrl,
    batchCount,
    sessionId
) {

    const timer =
        startPerformanceTimer(
            "photo-api",
            "photos",
            {
                sessionId,
                batchCount
            }
        );


    const params =
        new URLSearchParams();


    if (albumUrl) {

        params.set(
            "albumUrl",
            albumUrl
        );

    }


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


    const url =
        `/api/photos?${params.toString()}`;


    const requestStart =
        performance.now();


    try {

        const response =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    cache:
                        "no-store"
                }
            );


        const responseMs =
            performance.now() -
            requestStart;


        if (
            !response.ok
        ) {

            const error =
                new Error(
                    `Photo API returned ${response.status}`
                );


            timer.end({

                success:
                    false,

                status:
                    response.status,

                responseMs,

                error:
                    error.message

            });


            throw error;

        }


        const jsonStart =
            performance.now();


        const data =
            await response.json();


        const jsonMs =
            performance.now() -
            jsonStart;


        if (
            data &&
            data.error
        ) {

            const error =
                new Error(
                    data.error
                );


            timer.end({

                success:
                    false,

                responseMs,

                jsonMs,

                error:
                    error.message

            });


            throw error;

        }


        const photos =
            data &&
            Array.isArray(
                data.photos
            )

                ? data.photos

                : [];


        timer.end({

            success:
                true,

            responseMs,

            jsonMs,

            photoCount:
                photos.length

        });


        return photos;

    }

    catch (error) {

        /*
         * Avoid double-counting errors that were already
         * recorded above.
         */

        if (
            error &&
            !error.__photoPerformanceRecorded
        ) {

            timer.end({

                success:
                    false,

                error:
                    error?.message ||
                    String(error)

            });

        }


        throw error;

    }

}


// ============================================================
// FIND LOADABLE PHOTO
// ============================================================

async function findLoadablePhoto(
    photos,
    startIndex,
    sessionId
) {

    if (
        !photos ||
        photos.length === 0
    ) {

        return null;

    }


    const timer =
        startPerformanceTimer(
            "photo-find",
            "loadable",
            {
                sessionId,
                photoCount:
                    photos.length
            }
        );


    let attempts =
        0;

    let failures =
        0;


    try {

        /*
         * Try each photo once, wrapping around to the beginning.
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


            attempts++;


            try {

                await preloadImage(
                    photo.url,
                    sessionId,
                    photo.id
                );


                timer.end({

                    success:
                        true,

                    attempts,

                    failures,

                    index

                });


                return {
                    photo,
                    index
                };

            }

            catch (error) {

                failures++;


                console.warn(
                    "Photo failed to load, skipping:",
                    photo.url,
                    error
                );

            }

        }


        timer.end({

            success:
                false,

            attempts,

            failures,

            reason:
                "all-photos-failed"

        });


        return null;

    }

    catch (error) {

        timer.end({

            success:
                false,

            attempts,

            failures,

            error:
                error?.message ||
                String(error)

        });


        throw error;

    }

}


// ============================================================
// PRELOAD IMAGE
// ============================================================

function preloadImage(
    url,
    sessionId,
    photoId
) {

    const timer =
        startPerformanceTimer(
            "photo-preload",
            "image",
            {
                sessionId,
                photoId
            }
        );


    return new Promise(
        (
            resolve,
            reject
        ) => {

            const image =
                new Image();


            const startedAt =
                performance.now();


            let settled =
                false;


            const finish =
                (
                    success,
                    error
                ) => {

                    if (
                        settled
                    ) {

                        return;

                    }


                    settled =
                        true;


                    const durationMs =
                        performance.now() -
                        startedAt;


                    timer.end({

                        success,

                        durationMs,

                        error:
                            error?.message ||
                            undefined

                    });


                    if (
                        success
                    ) {

                        resolve();

                    }

                    else {

                        reject(
                            error ||
                            new Error(
                                "Image failed to load"
                            )
                        );

                    }

                };


            image.onload =
                () => {

                    /*
                     * Decode gives us a better indication that
                     * the browser has actually processed the image,
                     * rather than merely receiving the bytes.
                     */

                    if (
                        typeof image.decode ===
                        "function"
                    ) {

                        image.decode()
                            .then(
                                () => {

                                    finish(
                                        true
                                    );

                                }
                            )
                            .catch(
                                () => {

                                    /*
                                     * The image successfully loaded
                                     * even if decode() isn't available
                                     * or fails on this browser.
                                     */

                                    finish(
                                        true
                                    );

                                }
                            );

                    }

                    else {

                        finish(
                            true
                        );

                    }

                };


            image.onerror =
                () => {

                    finish(
                        false,
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

    image.decoding =
        "async";

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


// ============================================================
// PERFORMANCE ID
// ============================================================

function createPerformanceId(
    prefix
) {

    return (
        `${prefix}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`
    );

}


export default photo;