/*
 * ============================================================
 * WORD OF THE DAY DATA SERVICE
 * ============================================================
 *
 * Retrieves the Merriam-Webster Word of the Day
 * through the reusable RSS service.
 *
 * Returns normalized data for the widget.
 *
 * ============================================================
 */

import rssData
from "../rss/rss-data.js";


const wordOfDayData = {

    async getWordOfDay() {

        /*
         * ====================================================
         * MERRIAM-WEBSTER WORD OF THE DAY RSS
         * ====================================================
         */

        const feedUrl =
            "https://www.merriam-webster.com/wotd/feed/rss2";


        try {

            /*
             * ====================================================
             * LOAD RSS FEED
             * ====================================================
             */

            const stories =
                await rssData.getFeed(
                    feedUrl
                );


            /*
             * ====================================================
             * CHECK RESULTS
             * ====================================================
             */

            if (
                !stories ||
                stories.length === 0
            ) {

                return {

                    available:
                        false,

                    message:
                        "Word of the Day is unavailable."

                };

            }


            /*
             * ====================================================
             * FIRST STORY
             *
             * Merriam-Webster publishes the current
             * Word of the Day as the first RSS item.
             * ====================================================
             */

            const story =
                stories[0];


            /*
             * ====================================================
             * PARSE DESCRIPTION
             * ====================================================
             */

            const parsed =
                parseWordOfDay(
                    story.description
                );


            /*
             * ====================================================
             * RETURN NORMALIZED DATA
             * ====================================================
             */

            return {

                available:
                    true,

                word:
                    story.title,

                pronunciation:
                    parsed.pronunciation,

                partOfSpeech:
                    parsed.partOfSpeech,

                definition:
                    parsed.definition,

                source:
                    story.source ||
                    "Merriam-Webster",

                published:
                    story.published,

                link:
                    story.link

            };

        }

        catch (error) {

            console.error(
                "Failed to load Word of the Day:",
                error
            );


            return {

                available:
                    false,

                message:
                    "Word of the Day is unavailable."

            };

        }

    }

};


/*
 * ============================================================
 * PARSE WORD OF THE DAY
 * ============================================================
 *
 * Example RSS content:
 *
 * Merriam-Webster's Word of the Day for August 12, 2026 is:
 *
 * gnomic • \NOH-mik\ • adjective Gnomic is a formal word
 * that describes something cryptically said or written in
 * few words.
 *
 * ============================================================
 */

function parseWordOfDay(
    description
) {

    if (
        !description
    ) {

        return {

            pronunciation:
                "",

            partOfSpeech:
                "",

            definition:
                ""

        };

    }


    /*
     * ====================================================
     * CONVERT HTML TO TEXT
     * ====================================================
     */

    const temp =
        document.createElement("div");

    temp.innerHTML =
        description;


    let text =
        temp.textContent ||
        temp.innerText ||
        "";


    /*
     * ====================================================
     * NORMALIZE WHITESPACE
     * ====================================================
     */

    text =
        text
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    /*
     * ====================================================
     * REMOVE RSS INTRO
     * ====================================================
     */

    text =
        text.replace(
            /^Merriam-Webster's Word of the Day.*?is:\s*/i,
            ""
        );


    /*
     * ====================================================
     * FIND PRONUNCIATION
     *
     * We don't rely on the RSS bullet character.
     *
     * Example:
     *
     * gnomic  \NOH-mik\  adjective Gnomic is...
     *
     * ====================================================
     */

    const pronunciationMatch =
        text.match(
            /\\([^\\]+)\\/
        );


    let pronunciation =
        "";

    let partOfSpeech =
        "";

    let definition =
        "";


    if (
        pronunciationMatch
    ) {

        pronunciation =
            pronunciationMatch[1]
                .trim();


        /*
         * ====================================================
         * EVERYTHING AFTER PRONUNCIATION
         * ====================================================
         */

        const afterPronunciation =
            text
                .substring(
                    pronunciationMatch.index +
                    pronunciationMatch[0].length
                )
                .trim();


        /*
         * ====================================================
         * FIND PART OF SPEECH
         *
         * We don't care what character separates it
         * from the pronunciation.
         * ====================================================
         */

        const partOfSpeechMatch =
            afterPronunciation.match(
                /^(?:[^\w]*)?(noun|verb|adjective|adverb|preposition|conjunction|interjection|pronoun|determiner)\b\s*/i
            );


        if (
            partOfSpeechMatch
        ) {

            partOfSpeech =
                partOfSpeechMatch[1];


            definition =
                afterPronunciation
                    .substring(
                        partOfSpeechMatch[0].length
                    )
                    .trim();

        }

        else {

            definition =
                afterPronunciation;

        }

    }

    else {

        /*
         * ====================================================
         * FALLBACK
         * ====================================================
         */

        definition =
            text;

    }


    /*
     * ====================================================
     * REMOVE TRAILING CONTENT
     * ====================================================
     */

    definition =
        definition.split(
            "//"
        )[0];


    definition =
        definition.split(
            "Examples:"
        )[0];


    definition =
        definition.split(
            "Did you know?"
        )[0];


    /*
     * ====================================================
     * REMOVE LEADING BULLET / WORD IF PRESENT
     * ====================================================
     */

    definition =
        definition
            .replace(
                /^[^\w]+/,
                ""
            )
            .trim();


    return {

        pronunciation:
            pronunciation,

        partOfSpeech:
            partOfSpeech,

        definition:
            definition

    };

}


/*
 * ============================================================
 * CLEAN PRONUNCIATION
 * ============================================================
 */

function cleanPronunciation(
    value
) {

    return (
        value || ""
    )
        .replace(
            /\\/g,
            ""
        )
        .trim();

}


export default wordOfDayData;