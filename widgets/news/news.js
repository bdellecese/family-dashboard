/*
 * NEWS WIDGET
 *
 * Loads RSS stories through the dashboard server.
 *
 * RSS fetching and caching are handled server-side
 * by services/rss/rss-data.js.
 */

const news = {

    name: "news",

    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        /*
         * ========================================================
         * CONFIGURATION
         * ========================================================
         */

        let feedUrls;

        if (
            Array.isArray(
                config.feeds
            ) &&
            config.feeds.length > 0
        ) {

            feedUrls =
                config.feeds;

        }

        else {

            feedUrls = [

                config.feed ||
                "http://feeds.bbci.co.uk/news/world/rss.xml"

            ];

        }


        const rotationSeconds =
            config.rotationSeconds ||
            30;


        const includeImage =
            config.includeImage === true;


        /*
         * ========================================================
         * WRAPPER
         * ========================================================
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "news-widget";

        container.appendChild(
            wrapper
        );


        /*
         * ========================================================
         * LOAD FEEDS
         * ========================================================
         *
         * RSS requests go through the dashboard server.
         *
         * The server-side RSS service is responsible for:
         *
         * - fetching rss2json
         * - caching
         * - cache expiration
         * - stale-cache fallback
         */

        let feedResults;

        try {

            feedResults =
                await Promise.allSettled(

                    feedUrls.map(
                        async feedUrl => {

                            const response =
                                await fetch(
                                    `/api/rss?url=${encodeURIComponent(
                                        feedUrl
                                    )}`
                                );


                            if (
                                !response.ok
                            ) {

                                throw new Error(
                                    `RSS API request failed: ${response.status}`
                                );

                            }


                            const data =
                                await response.json();


                            return (
                                data.stories ||
                                []
                            );

                        }
                    )

                );

        }

        catch (error) {

            console.error(
                "News feed error:",
                error
            );


            feedResults = [];

        }


        /*
         * ========================================================
         * COMBINE STORIES
         * ========================================================
         */

        const stories =
            feedResults
                .filter(
                    result =>
                        result.status ===
                        "fulfilled"
                )
                .flatMap(
                    result =>
                        result.value ||
                        []
                );


        /*
         * ========================================================
         * LOG FAILED FEEDS
         * ========================================================
         */

        feedResults
            .forEach(
                (result, index) => {

                    if (
                        result.status ===
                        "rejected"
                    ) {

                        console.error(
                            `News feed error (${feedUrls[index]}):`,
                            result.reason
                        );

                    }

                }
            );


        /*
         * ========================================================
         * SORT STORIES
         * ========================================================
         *
         * Newest stories first.
         */

        stories.sort(
            (
                a,
                b
            ) => {

                const dateA =
                    new Date(
                        a.published
                    ).getTime();

                const dateB =
                    new Date(
                        b.published
                    ).getTime();

                return (
                    dateB -
                    dateA
                );

            }
        );


        /*
         * ========================================================
         * NO STORIES
         * ========================================================
         */

        if (
            stories.length === 0
        ) {

            const empty =
                document.createElement("div");

            empty.className =
                "news-widget__error";

            empty.textContent =
                "No news available";

            wrapper.appendChild(
                empty
            );

            return;

        }


        /*
         * ========================================================
         * UI
         * ========================================================
         */

        const label =
            document.createElement("div");

        label.className =
            "news-widget__label";

        label.textContent =
            config.label ||
            "WORLD NEWS";


        /*
         * ========================================================
         * STORY CONTENT
         * ========================================================
         */

        const storyContent =
            document.createElement("div");

        storyContent.className =
            "news-widget__story";


        /*
         * ========================================================
         * IMAGE
         * ========================================================
         */

        let image = null;

        if (
            includeImage
        ) {

            image =
                document.createElement("img");

            image.className =
                "news-widget__image";

            image.alt =
                "";

            image.loading =
                "eager";

            storyContent.appendChild(
                image
            );

        }


        /*
         * ========================================================
         * TEXT
         * ========================================================
         */

        const textContent =
            document.createElement("div");

        textContent.className =
            "news-widget__text";


        const headline =
            document.createElement("div");

        headline.className =
            "news-widget__headline";


        const description =
            document.createElement("div");

        description.className =
            "news-widget__description";


        const metadata =
            document.createElement("div");

        metadata.className =
            "news-widget__metadata";


        textContent.appendChild(
            headline
        );

        textContent.appendChild(
            description
        );

        textContent.appendChild(
            metadata
        );


        storyContent.appendChild(
            textContent
        );


        /*
         * ========================================================
         * PROGRESS
         * ========================================================
         */

        const progress =
            document.createElement("div");

        progress.className =
            "news-widget__progress";


        const progressBar =
            document.createElement("div");

        progressBar.className =
            "news-widget__progress-bar";


        progress.appendChild(
            progressBar
        );


        /*
         * ========================================================
         * BUILD WIDGET
         * ========================================================
         */

        wrapper.appendChild(
            label
        );

        wrapper.appendChild(
            storyContent
        );

        wrapper.appendChild(
            progress
        );


        /*
         * ========================================================
         * STORY ROTATION
         * ========================================================
         */

        let currentIndex =
            Math.floor(
                Math.random() *
                stories.length
            );


        function renderStory() {

            if (
                !stories ||
                stories.length === 0
            ) {

                return;

            }


            if (
                currentIndex >=
                stories.length
            ) {

                currentIndex =
                    0;

            }


            const story =
                stories[
                    currentIndex
                ];


            if (
                !story
            ) {

                return;

            }


            /*
             * ----------------------------------------------------
             * REMOVE FADE CLASSES
             * ----------------------------------------------------
             */

            headline.classList.remove(
                "news-widget__fade"
            );

            description.classList.remove(
                "news-widget__fade"
            );

            metadata.classList.remove(
                "news-widget__fade"
            );


            if (
                image
            ) {

                image.classList.remove(
                    "news-widget__fade"
                );

            }


            /*
             * ----------------------------------------------------
             * IMAGE
             * ----------------------------------------------------
             */

            if (
                image
            ) {

                if (
                    story.image
                ) {

                    image.src =
                        story.image;

                    image.style.display =
                        "block";

                    storyContent.classList.add(
                        "news-widget__story--image"
                    );

                }

                else {

                    image.removeAttribute(
                        "src"
                    );

                    image.style.display =
                        "none";

                    storyContent.classList.remove(
                        "news-widget__story--image"
                    );

                }

            }


            /*
             * ----------------------------------------------------
             * HEADLINE
             * ----------------------------------------------------
             */

            headline.textContent =
                story.title;


            /*
             * ----------------------------------------------------
             * DESCRIPTION
             * ----------------------------------------------------
             */

            description.textContent =
                cleanDescription(
                    story.description
                );


            /*
             * ----------------------------------------------------
             * METADATA
             * ----------------------------------------------------
             */

            metadata.textContent =
                `${story.source} • ${formatAge(
                    story.published
                )}`;


            /*
             * ----------------------------------------------------
             * START ANIMATIONS
             * ----------------------------------------------------
             */

            requestAnimationFrame(
                () => {

                    headline.classList.add(
                        "news-widget__fade"
                    );

                    description.classList.add(
                        "news-widget__fade"
                    );

                    metadata.classList.add(
                        "news-widget__fade"
                    );


                    if (
                        image &&
                        story.image
                    ) {

                        image.classList.add(
                            "news-widget__fade"
                        );

                    }


                    /*
                     * ------------------------------------------------
                     * RESET PROGRESS BAR
                     * ------------------------------------------------
                     */

                    progressBar.style.animation =
                        "none";


                    requestAnimationFrame(
                        () => {

                            progressBar.style.animation =
                                `news-progress ${rotationSeconds}s linear`;

                        }
                    );

                }
            );


            /*
             * ----------------------------------------------------
             * NEXT STORY
             * ----------------------------------------------------
             */

            currentIndex =
                (
                    currentIndex +
                    1
                ) %
                stories.length;

        }


        /*
         * ========================================================
         * INITIAL STORY
         * ========================================================
         */

        renderStory();


        /*
         * ========================================================
         * ROTATION
         * ========================================================
         */

        setInterval(
            renderStory,
            rotationSeconds * 1000
        );

    }

};


/*
 * ============================================================
 * CLEAN RSS DESCRIPTION
 * ============================================================
 */

function cleanDescription(
    description
) {

    if (
        !description
    ) {

        return "";

    }


    const temp =
        document.createElement(
            "div"
        );


    temp.innerHTML =
        description;


    return temp.textContent
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/*
 * ============================================================
 * FORMAT STORY AGE
 * ============================================================
 */

function formatAge(
    published
) {

    if (
        !published
    ) {

        return "";

    }


    const date =
        new Date(
            published
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const now =
        new Date();


    const minutes =
        Math.floor(
            (
                now -
                date
            ) /
            60000
        );


    if (
        minutes < 1
    ) {

        return "just now";

    }


    if (
        minutes < 60
    ) {

        return `${minutes} min ago`;

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (
        hours < 24
    ) {

        return `${hours} hr ago`;

    }


    const days =
        Math.floor(
            hours /
            24
        );


    return `\
${days} day${
        days === 1
            ? ""
            : "s"
    } ago`;

}


export default news;