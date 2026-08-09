import {
    getCached,
    setCached
} from "../cache/cache.js";


const GOOGLE_SHEET_ID =
    "1LxStcCNQLawP81a4fiNdVTtxW7XA0ejR9ENyJ7dzG0I";


const DEFAULT_CACHE_DURATION =
    30 * 60 * 1000;


export async function getSheetRows(
    sheetName,
    options = {}
) {

    const cacheDuration =
        options.cacheDuration ??
        DEFAULT_CACHE_DURATION;


    const cacheKey =
        `google-sheet:${sheetName}`;


    const cached =
        getCached(
            cacheKey,
            cacheDuration
        );


    if (cached) {

        return cached;

    }


    try {

        const url =
            `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;


        const response =
            await fetch(url);


        const text =
            await response.text();


        const json =
            JSON.parse(

                text.substring(

                    text.indexOf("{"),

                    text.lastIndexOf("}") + 1

                )

            );


        const rows =
            json.table.rows;


        setCached(
            cacheKey,
            rows
        );


        return rows;

    }


    catch(error) {

        console.error(
            "Unable to load Google Sheet:",
            error
        );


        return [];

    }

}