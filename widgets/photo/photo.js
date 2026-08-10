import icloudPhotoData
    from "../../services/photos/icloud-photo-data.js";


const photo = {

    name: "photo",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        /*
         * CONFIGURATION
         */

        const albumUrl =
            config.albumUrl ||
            "https://www.icloud.com/sharedalbum/#B0k5yeZFhGG13uA";

        const interval =
            Number(
                config.interval || 30
            );


        /*
         * WRAPPER
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "photo-widget";

        container.appendChild(
            wrapper
        );


        /*
         * LOAD PHOTOS
         */

        let photos;

        try {

            photos =
                await icloudPhotoData.getPhotos(
                    albumUrl
                );

        }

        catch (error) {

            console.error(
                "iCloud photo error:",
                error
            );

            const message =
                document.createElement("div");

            message.className =
                "photo-widget__error";

            message.textContent =
                "Unable to load photos";

            wrapper.appendChild(
                message
            );

            return;
        }


        /*
         * NO PHOTOS
         */

        if (
            !photos ||
            photos.length === 0
        ) {

            const message =
                document.createElement("div");

            message.className =
                "photo-widget__error";

            message.textContent =
                "No photos found";

            wrapper.appendChild(
                message
            );

            return;
        }


        /*
         * RANDOMIZE
         */

        shuffle(
            photos
        );


        /*
         * CREATE TWO IMAGE LAYERS
         */

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


        /*
         * CAPTION
         */

        const caption =
            document.createElement("div");

        caption.className =
            "photo-widget__caption";

        caption.textContent =
            photos[0].caption || "";

        wrapper.appendChild(
            caption
        );


        /*
         * ROTATION STATE
         */

        let activeImage =
            imageA;

        let inactiveImage =
            imageB;

        let currentIndex =
            0;


        /*
         * ROTATE PHOTO
         */

        const rotate =
            () => {

                currentIndex =
                    (
                        currentIndex + 1
                    ) %
                    photos.length;

                const nextPhoto =
                    photos[
                        currentIndex
                    ];


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
                            nextPhoto.caption ||
                            "";


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


        /*
         * START TIMER
         */

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


/*
 * CREATE IMAGE
 */

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


/*
 * SHUFFLE
 */

function shuffle(
    array
) {

    for (
        let i = array.length - 1;
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