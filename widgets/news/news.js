import rssData from "../../services/rss/rss-data.js";


const news = {

    name: "news",

    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";

        /*
         * CONFIGURATION
         */

        const feedUrl =
            config.feed ||
            "http://feeds.bbci.co.uk/news/world/rss.xml";

        const rotationSeconds =
            config.rotationSeconds ||
            30;


        /*
         * WRAPPER
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "news-widget";

        container.appendChild(
            wrapper
        );


        /*
         * LOAD FEED
         */

        let stories;

        try {

            stories =
                await rssData.getFeed(
                    feedUrl
                );

        }
        catch (error) {

            console.error(
                "News feed error:",
                error
            );

            const errorMessage =
                document.createElement("div");

            errorMessage.className =
                "news-widget__error";

            errorMessage.textContent =
                "Unable to load news";

            wrapper.appendChild(
                errorMessage
            );

            return;

        }


        /*
         * NO STORIES
         */

        if (
            !stories ||
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
         * UI
         */

        const label =
            document.createElement("div");

        label.className =
            "news-widget__label";

        label.textContent =
            "WORLD NEWS";


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


        wrapper.appendChild(
            label
        );

        wrapper.appendChild(
            headline
        );

        wrapper.appendChild(
            description
        );

        wrapper.appendChild(
            metadata
        );

        wrapper.appendChild(
            progress
        );


        /*
         * STORY ROTATION
         */

        let currentIndex =
            0;


        function renderStory() {

            if (
                !stories ||
                stories.length === 0
            ) {

                return;

            }


            if (
                currentIndex >= stories.length
            ) {

                currentIndex = 0;

            }


            const story =
                stories[currentIndex];


            if (!story) {

                return;

            }


            /*
             * Remove fade classes
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


            /*
             * Force animation restart
             */

            void headline.offsetWidth;


            /*
             * HEADLINE
             */

            headline.textContent =
                story.title;


            /*
             * DESCRIPTION
             */

            description.textContent =
                cleanDescription(
                    story.description
                );


            /*
             * METADATA
             */

            metadata.textContent =
                `${story.source}  •  ${formatAge(
                    story.published
                )}`;


            /*
             * Fade in
             */

            headline.classList.add(
                "news-widget__fade"
            );

            description.classList.add(
                "news-widget__fade"
            );

            metadata.classList.add(
                "news-widget__fade"
            );


            /*
             * Reset progress bar
             */

            progressBar.style.animation =
                "none";

            void progressBar.offsetWidth;

            progressBar.style.animation =
                `news-progress ${rotationSeconds}s linear`;


            /*
             * NEXT STORY
             */

            currentIndex =
                (
                    currentIndex + 1
                ) %
                stories.length;

        }


        /*
         * INITIAL STORY
         */

        renderStory();


        /*
         * ROTATION
         */

        setInterval(
            renderStory,
            rotationSeconds * 1000
        );

    }

};


/*
 * CLEAN RSS DESCRIPTION
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
 * FORMAT STORY AGE
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
                now - date
            ) / 60000
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
            minutes / 60
        );


    if (
        hours < 24
    ) {

        return `${hours} hr ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    return `${days} day${
        days === 1
            ? ""
            : "s"
    } ago`;

}


export default news;