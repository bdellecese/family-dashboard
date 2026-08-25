/*
 * GENERIC IN-MEMORY CACHE
 */

const cache =
    new Map();


/*
 * ============================================================
 * GET FRESH CACHE
 * ============================================================
 */

export function getCached(
    key,
    maxAge
) {

    const entry =
        cache.get(
            key
        );


    if (
        !entry
    ) {

        return null;

    }


    const age =
        Date.now() -
        entry.timestamp;


    if (
        age > maxAge
    ) {

        return null;

    }


    return entry.data;

}


/*
 * ============================================================
 * GET STALE CACHE
 * ============================================================
 *
 * Returns the most recently cached value regardless
 * of its age.
 *
 * Used as a fallback when an upstream service fails.
 */

export function getStaleCached(
    key
) {

    const entry =
        cache.get(
            key
        );


    if (
        !entry
    ) {

        return null;

    }


    return entry.data;

}


/*
 * ============================================================
 * SET CACHE
 * ============================================================
 */

export function setCached(
    key,
    data
) {

    cache.set(
        key,
        {

            data:
                data,

            timestamp:
                Date.now()

        }
    );

}


/*
 * ============================================================
 * CLEAR CACHE
 * ============================================================
 */

export function clearCache(
    key
) {

    if (
        key
    ) {

        cache.delete(
            key
        );


        return;

    }


    cache.clear();

}