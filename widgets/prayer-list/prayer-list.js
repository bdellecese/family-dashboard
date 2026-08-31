import {
    getSheetRows
} from "../../services/google-sheets/sheets.js";

import {
    getDailyVerse
} from "../../services/ourmanna/ourmanna-data.js";


const SHEET_NAME =
    "PrayerList";


const prayerList = {

    async render(container) {

        container.innerHTML = "";


        const wrapper =
            document.createElement("div");


        wrapper.className =
            "prayer-list-widget";


        container.appendChild(
            wrapper
        );


        /*
         * ----------------------------------------
         * Load both data sources
         * ----------------------------------------
         *
         * OurManna is optional.
         *
         * If it is unavailable, the prayer list
         * should still render.
         */

        const rowsPromise =
            getSheetRows(
                SHEET_NAME
            );

        const versePromise =
            getDailyVerse();


        const rows =
            await rowsPromise;


        let verse = null;


        try {

            verse =
                await versePromise;

        }

        catch (error) {

            console.error(
                "Unable to load daily verse:",
                error
            );

        }

        /*
         * ----------------------------------------
         * Today's Prayer
         * ----------------------------------------
         */

        const prayerTitle =
            document.createElement("div");


        prayerTitle.className =
            "prayer-list-widget__section-title";


        prayerTitle.textContent =
            "Today's Prayer";


        wrapper.appendChild(
            prayerTitle
        );


        /*
         * ----------------------------------------
         * Verse
         * ----------------------------------------
         */

        const verseText =
            document.createElement("div");


        verseText.className =
            "prayer-list-widget__verse";


        if (verse) {

            verseText.textContent =
                `"${verse.text}"`;

        }

        else {

            verseText.textContent =
                "Today's verse is temporarily unavailable.";

        }


        wrapper.appendChild(
            verseText
        );


        /*
         * ----------------------------------------
         * Verse reference
         * ----------------------------------------
         */

        if (verse) {

            const verseReference =
                document.createElement("div");


            verseReference.className =
                "prayer-list-widget__reference";


            verseReference.textContent =
                `${verse.reference} — ${verse.version}`;


            wrapper.appendChild(
                verseReference
            );

        }


        /*
         * ----------------------------------------
         * Prayer List
         * ----------------------------------------
         */

        const title =
            document.createElement("div");


        title.className =
            "prayer-list-widget__section-title prayer-list-widget__prayer-title";


        title.textContent =
            "Prayer List:";


        wrapper.appendChild(
            title
        );


        const list =
            document.createElement("div");


        list.className =
            "prayer-list-widget__list";


        wrapper.appendChild(
            list
        );


        /*
         * ----------------------------------------
         * Extract names from Google Sheet
         * ----------------------------------------
         */

        const names = [];


        for (const row of rows) {

            const value =
                row.c?.[0]?.v;


            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                names.push(
                    String(value).trim()
                );

            }

        }


        /*
         * ----------------------------------------
         * Render prayer list
         * ----------------------------------------
         */

        names.forEach(
            name => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "prayer-list-widget__item";


                const icon =
                    document.createElement(
                        "i"
                    );


                icon.className =
                    "fa-fw fa-solid fa-praying-hands";


                item.appendChild(
                    icon
                );


                const text =
                    document.createElement(
                        "span"
                    );


                text.textContent =
                    name;


                item.appendChild(
                    text
                );


                list.appendChild(
                    item
                );

            }
        );

    }

};


export default prayerList;