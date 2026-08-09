const cache = new Map();


export function getCached(
    key,
    maxAge
) {

    const entry =
        cache.get(key);


    if (!entry) {

        return null;

    }


    const age =
        Date.now() -
        entry.timestamp;


    if (age > maxAge) {

        cache.delete(key);

        return null;

    }


    return entry.data;

}


export function setCached(
    key,
    data
) {

    cache.set(
        key,
        {
            data: data,
            timestamp: Date.now()
        }
    );

}


export function clearCache(
    key
) {

    if (key) {

        cache.delete(key);

        return;

    }


    cache.clear();

}