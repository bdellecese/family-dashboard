import fs from "fs";

import path from "path";

const CACHE_DIR =
    path.resolve(
        process.cwd(),
        "data/sports/mlb"
    );

const CURRENT_SEASON =
    new Date().getFullYear();

const DRY_RUN = false;

function logAction(
    action,
    filename
) {
    console.log(
        `${action}: ${filename}`
    );
}

function getSeasonFromFilename(
    filename
) {
    const match =
        filename.match(
            /-(20\d{2})(?:[-.]|$)/
        );

    return match
        ? Number(match[1])
        : null;
}

function getDateFromFilename(
    filename
) {
    const match =
        filename.match(
            /(\d{4}-\d{2}-\d{2})/
        );

    return match
        ? new Date(
            `${match[1]}T00:00:00`
        )
        : null;
}

function isOlderThanDays(
    date,
    days
) {
    if (!date) {
        return false;
    }

    const cutoff =
        new Date(
            Date.now() -
            days *
            24 *
            60 *
            60 *
            1000
        );

    return date < cutoff;
}

function shouldDelete(
    filename
) {
    if (
        filename ===
        ".DS_Store"
    ) {
        return true;
    }

    const season =
        getSeasonFromFilename(
            filename
        );

    /*
     * Keep current-season
     * standings, wildcard,
     * postseason metadata,
     * and postseason bracket data.
     */
    if (
        filename.startsWith(
            "standings-"
        ) ||
        filename.startsWith(
            "wildcard-"
        ) ||
        filename.startsWith(
            "postseason-seeds-"
        ) ||
        filename.startsWith(
            "postseason-"
        )
    ) {
        return (
            season !== null &&
            season !==
                CURRENT_SEASON
        );
    }

    /*
     * Schedule and postseason-game
     * caches are operational date
     * caches. Keep the recent
     * seven-day window.
     */
    if (
        filename.startsWith(
            "schedule-"
        ) ||
        filename.startsWith(
            "postseason-games-"
        )
    ) {
        const date =
            getDateFromFilename(
                filename
            );

        return isOlderThanDays(
            date,
            7
        );
    }

    /*
     * Game feeds contain the
     * season and actual game date
     * inside the cached MLB response.
     *
     * Keep current-season game feeds
     * from the recent seven-day
     * operational window. Remove
     * older game feeds and
     * future-dated test data.
     */
    if (
        filename.startsWith(
            "game-"
        )
    ) {
        try {
            const filenamePath =
                path.join(
                    CACHE_DIR,
                    filename
                );

            const contents =
                fs.readFileSync(
                    filenamePath,
                    "utf8"
                );

            const cache =
                JSON.parse(
                    contents
                );

            const gameSeason =
                Number(
                    cache?.data?.gameData?.game?.season
                );

            const officialDate =
                cache?.data?.gameData?.datetime?.officialDate;

            if (
                gameSeason !==
                CURRENT_SEASON
            ) {
                return true;
            }

            if (
                !officialDate
            ) {
                console.warn(
                    `Unable to determine game date for ${filename}`
                );

                return false;
            }

            const gameDate =
                new Date(
                    `${officialDate}T00:00:00`
                );

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            const cutoff =
                new Date(
                    today.getTime() -
                    7 *
                    24 *
                    60 *
                    60 *
                    1000
                );

            return (
                gameDate < cutoff ||
                gameDate > today
            );
        }
        catch (
            error
        ) {
            console.warn(
                `Unable to inspect ${filename}: ${error.message}`
            );

            return false;
        }
    }

    /*
     * Pitcher caches contain the
     * season explicitly.
     */
    if (
        filename.startsWith(
            "pitcher-"
        )
    ) {
        return (
            season !== null &&
            season !==
                CURRENT_SEASON
        );
    }

    return false;
}

function main() {
    if (
        !fs.existsSync(
            CACHE_DIR
        )
    ) {
        console.log(
            `MLB cache directory not found: ${CACHE_DIR}`
        );

        return;
    }

    const files =
        fs.readdirSync(
            CACHE_DIR
        );

    let deleteCount = 0;

    console.log(
        `MLB cache cleanup — ${DRY_RUN ? "DRY RUN" : "LIVE"}`
    );

    console.log(
        `Cache directory: ${CACHE_DIR}`
    );

    console.log(
        `Current season: ${CURRENT_SEASON}`
    );

    console.log("");

    for (
        const filename of files
    ) {
        if (
            shouldDelete(
                filename
            )
        ) {
            logAction(
                DRY_RUN
                    ? "WOULD DELETE"
                    : "DELETE",
                filename
            );

            deleteCount++;

            if (!DRY_RUN) {
                fs.unlinkSync(
                    path.join(
                        CACHE_DIR,
                        filename
                    )
                );
            }
        }
    }

    console.log("");

    console.log(
        `${DRY_RUN ? "Would delete" : "Deleted"} ${deleteCount} files.`
    );
}

main();