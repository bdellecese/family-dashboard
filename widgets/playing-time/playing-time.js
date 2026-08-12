/*
 * ============================================================
 * PLAYING TIME WIDGET
 * ============================================================
 *
 * Displays the family's house saying over rotating
 * sports background images.
 *
 * Images rotate every 30 seconds.
 *
 * ============================================================
 */

const playingTime = {

    name:
        "playing-time",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML =
            "";


        /*
         * ====================================================
         * CONFIGURATION
         * ====================================================
         */

        const rotationSeconds =
            config.rotationSeconds ||
            30;


        const images = [

            "baseball.jpeg",

            "basketball.jpg",

            "flag-football.jpeg",

            "soccer.jpeg",

            "softball.jpg",

            "track.jpeg"

        ];


        /*
         * ====================================================
         * WIDGET
         * ====================================================
         */

        const widget =
            document.createElement(
                "div"
            );

        widget.className =
            "playing-time-widget";


        /*
         * ====================================================
         * BACKGROUND IMAGE
         * ====================================================
         */

        const background =
            document.createElement(
                "div"
            );

        background.className =
            "playing-time-widget__background";


        widget.appendChild(
            background
        );


        /*
         * ====================================================
         * OVERLAY
         * ====================================================
         */

        const overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "playing-time-widget__overlay";


        widget.appendChild(
            overlay
        );


        /*
         * ====================================================
         * CONTENT
         * ====================================================
         */

        const content =
            document.createElement(
                "div"
            );

        content.className =
            "playing-time-widget__content";


        /*
         * ====================================================
         * SAYING
         * ====================================================
         */

        const saying =
            document.createElement(
                "div"
            );

        saying.className =
            "playing-time-widget__saying";


        saying.innerHTML =
            `
            <div>If your screen time</div>
            <div>is more than your</div>
            <div>practice time,</div>

            <div class="playing-time-widget__spacer"></div>

            <div>you have no business</div>
            <div>complaining about</div>
            <div>playing time.</div>
            `;


        content.appendChild(
            saying
        );


        widget.appendChild(
            content
        );


        /*
         * ====================================================
         * ADD WIDGET
         * ====================================================
         */

        container.appendChild(
            widget
        );


        /*
         * ====================================================
         * IMAGE ROTATION
         * ====================================================
         */

        let currentIndex =
            Math.floor(
                Math.random() * images.length
            );


        function showImage() {

            const image =
                images[currentIndex];


            background.classList.remove(
                "playing-time-widget__background--fade"
            );


            /*
             * Force animation restart.
             */

            void background.offsetWidth;


            background.style.backgroundImage =
                `url("assets/images/sports/${image}")`;


            background.classList.add(
                "playing-time-widget__background--fade"
            );


            currentIndex =
                (
                    currentIndex + 1
                ) %
                images.length;

        }


        /*
         * ====================================================
         * INITIAL IMAGE
         * ====================================================
         */

        showImage();


        /*
         * ====================================================
         * ROTATION
         * ====================================================
         */

        setInterval(
            showImage,
            rotationSeconds * 1000
        );

    }

};


export default playingTime;