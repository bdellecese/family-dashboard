import {
    getCached,
    setCached
} from "../cache/cache.js";


const OURMANNA_URL =
    "https://beta.ourmanna.com/api/v1/get?format=json&order=daily";


const CACHE_KEY =
    "ourmanna:daily-verse";


const CACHE_MAX_AGE =
    86400000; // 24 hours


export async function getDailyVerse() {

    const cached =
        getCached(
            CACHE_KEY,
            CACHE_MAX_AGE
        );


    if (cached) {

        console.log(
            `[CACHE HIT] ${CACHE_KEY}`
        );

        return cached;

    }


    console.log(
        `[CACHE MISS] ${CACHE_KEY}`
    );


    const response =
        await fetch(
            OURMANNA_URL
        );


    if (!response.ok) {

        throw new Error(
            `OurManna API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    const verse =
        data?.verse?.details;


    if (!verse) {

        throw new Error(
            "Invalid OurManna response."
        );

    }


    setCached(
        CACHE_KEY,
        verse
    );


    console.log(
        `[CACHE SET] ${CACHE_KEY}`
    );


    return verse;
}