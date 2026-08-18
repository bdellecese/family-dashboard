/*
 * ============================================================
 * ON THIS DAY IN SPORTS DATA SERVICE
 * ============================================================
 *
 * Finds interesting sporting events that occurred on today's
 * date in previous years.
 *
 * The browser calls our local server proxy rather than
 * On-This-Day.com directly. This avoids the source site's
 * CORS restrictions.
 *
 * Flow:
 *
 *   Browser
 *      ↓
 *   /api/on-this-day-sports
 *      ↓
 *   On-This-Day.com
 *
 * The service then parses and scores the returned history.
 *
 * ============================================================
 */

const onThisDaySportsData = {

    /*
     * ========================================================
     * CONFIGURATION
     * ========================================================
     */

    sourceUrl:
        "/api/on-this-day-sports",

    maxEvents:
        3,


    /*
     * ========================================================
     * GET EVENTS
     * ========================================================
     */

    async getEvents() {

        const today =
            new Date();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        try {

            const response =
                await fetch(
                    `${this.sourceUrl}?month=${month}&day=${day}`
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const html =
                await response.text();


            const rawEvents =
                parseSportsHistory(
                    html,
                    month,
                    day
                );


            const curatedEvents =
                rawEvents
                    .map(
                        scoreEvent
                    )
                    .filter(
                        event =>
                            event !== null
                    )
                    .sort(
                        (a, b) =>
                            b.significance.score -
                            a.significance.score
                    )
                    .slice(
                        0,
                        this.maxEvents
                    );


            if (
                curatedEvents.length === 0
            ) {

                return {

                    available:
                        false,

                    date:
                        `${month}-${day}`,

                    source:
                        "On-This-Day.com",

                    events:
                        [],

                    message:
                        "No particularly interesting sports history found for today."

                };

            }


            return {

                available:
                    true,

                date:
                    `${month}-${day}`,

                source:
                    "On-This-Day.com",

                events:
                    curatedEvents

            };

        }

        catch (error) {

            console.warn(
                "On-This-Day sports history failed:",
                error.message
            );


            return {

                available:
                    false,

                date:
                    `${month}-${day}`,

                source:
                    "On-This-Day.com",

                events:
                    [],

                message:
                    "Sports history is temporarily unavailable."

            };

        }

    }

};


/*
 * ============================================================
 * PARSE SPORTS HISTORY
 * ============================================================
 *
 * Looks for:
 *
 * <br><b>1973</b> -  Lee Trevino...
 *
 * This intentionally keeps the parser simple because the
 * source page is very small and predictable.
 * ============================================================
 */

function parseSportsHistory(
    html,
    month,
    day
) {

    const events =
        [];


    /*
     * Extract the main sports-history section.
     */

    const historyStart =
        html.indexOf(
            "Today in<br>Sports History"
        );


    if (
        historyStart < 0
    ) {

        return events;

    }


    const historyEnd =
        html.indexOf(
            "<!under history>",
            historyStart
        );


    const history =
        html.substring(
            historyStart,
            historyEnd > historyStart
                ? historyEnd
                : html.length
        );


    /*
     * Match:
     *
     * <b>1973</b> -  Some historical event.
     */

    const pattern =
        /<br>\s*<b>(\d{4})<\/b>\s*-\s*(.*?)\s*(?=<br>|$)/gis;


    let match;


    while (
        (match = pattern.exec(history)) !== null
    ) {

        const year =
            Number(
                match[1]
            );


        const event =
            cleanHtml(
                match[2]
            );


        if (
            !event
        ) {

            continue;

        }


        events.push({

            id:
                `sports-otd-${year}`,

            year,

            date:
                `${year}-${month}-${day}`,

            sport:
                detectSport(
                    event
                ),

            event

        });

    }


    return events;

}


/*
 * ============================================================
 * CLEAN HTML
 * ============================================================
 */

function cleanHtml(
    value
) {

    return String(
        value
    )
        .replace(
            /<[^>]+>/g,
            " "
        )
        .replace(
            /&nbsp;/gi,
            " "
        )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/*
 * ============================================================
 * SPORT DETECTION
 * ============================================================
 */

function detectSport(
    event
) {

    const text =
        event.toLowerCase();


    if (
        /\b(baseball|major league|pitcher|home run|batting|strikeout|no-hitter)\b/
            .test(text)
    ) {

        return "Baseball";

    }


    if (
        /\b(golf|hole in one|golf classic|masters|pga|open championship)\b/
            .test(text)
    ) {

        return "Golf";

    }


    if (
        /\b(football|nfl|super bowl|touchdown|quarterback)\b/
            .test(text)
    ) {

        return "Football";

    }


    if (
        /\b(basketball|nba|ncaa basketball|slam dunk)\b/
            .test(text)
    ) {

        return "Basketball";

    }


    if (
        /\b(hockey|nhl|stanley cup|goalie|puck)\b/
            .test(text)
    ) {

        return "Hockey";

    }


    if (
        /\b(tennis|wimbledon|us open|french open)\b/
            .test(text)
    ) {

        return "Tennis";

    }


    if (
        /\b(boxing|knockout|heavyweight)\b/
            .test(text)
    ) {

        return "Boxing";

    }


    if (
        /\b(olympic|olympics)\b/
            .test(text)
    ) {

        return "Olympics";

    }


    return "Sports";

}


/*
 * ============================================================
 * SCORE EVENT
 * ============================================================
 */

function scoreEvent(
    event
) {

    if (
        !event ||
        !event.event
    ) {

        return null;

    }


    const text =
        event.event.toLowerCase();


    let score =
        0;


    const reasons =
        [];


    /*
     * ========================================================
     * MAJOR HISTORICAL ACHIEVEMENTS
     * ========================================================
     */

    if (
        /\b(first|first-ever|first ever)\b/
            .test(text)
    ) {

        score += 5;

        reasons.push(
            "first"
        );

    }


    if (
        /\b(last|last ever|final|final at bat|final game)\b/
            .test(text)
    ) {

        score += 3;

        reasons.push(
            "last"
        );

    }


    if (
        /\b(record|recorded a record|set a record)\b/
            .test(text)
    ) {

        score += 5;

        reasons.push(
            "record"
        );

    }


    if (
        /\b(champion|championship|won the title|title)\b/
            .test(text)
    ) {

        score += 5;

        reasons.push(
            "championship"
        );

    }


    /*
     * ========================================================
     * RARE / UNUSUAL ACHIEVEMENTS
     * ========================================================
     */

    if (
        /\b(hole in one|perfect game|no-hitter|no hitter|20 strikeouts|triple play)\b/
            .test(text)
    ) {

        score += 6;

        reasons.push(
            "rare achievement"
        );

    }


    /*
     * ========================================================
     * MILESTONES
     * ========================================================
 */

    if (
        /\b(1,000|2,000|3,000|4,000|5,000)\b/
            .test(text)
    ) {

        score += 4;

        reasons.push(
            "career milestone"
        );

    }


    /*
     * ========================================================
     * FAMOUS PEOPLE
     * ========================================================
     */

    const famousNames = [

        "babe ruth",
        "jackie robinson",
        "ted williams",
        "willie mays",
        "hank aaron",
        "mickey mantle",
        "pete rose",
        "lou gehrig",
        "joe dimaggio",
        "bobby orr",
        "wayne gretzky",
        "michael jordan",
        "magic johnson",
        "larry bird",
        "kareem abdul-jabbar",
        "bill russell",
        "tom brady",
        "joe montana",
        "peyton manning",
        "walter payton",
        "tiger woods",
        "jack nicklaus",
        "lee trevino",
        "arnold palmer",
        "serena williams",
        "roger federer",
        "rafael nadal",
        "novak djokovic",
        "muhammad ali"

    ];


    if (
        famousNames.some(
            name =>
                text.includes(
                    name
                )
        )
    ) {

        score += 3;

        reasons.push(
            "famous athlete"
        );

    }


    /*
     * ========================================================
     * NEW ENGLAND CONNECTION
     * ========================================================
     */

    const newEnglandPlaces = [

        "massachusetts",
        "sutton, ma",
        "boston",
        "new england",
        "connecticut",
        "rhode island",
        "vermont",
        "new hampshire",
        "maine"

    ];


    if (
        newEnglandPlaces.some(
            place =>
                text.includes(
                    place
                )
        )
    ) {

        score += 3;

        reasons.push(
            "New England connection"
        );

    }


    /*
     * ========================================================
     * BIG SPORTS MOMENTS
     * ========================================================
     */

    if (
        /\b(olympic|olympics|super bowl|world series|stanley cup|wimbledon)\b/
            .test(text)
    ) {

        score += 4;

        reasons.push(
            "major sporting event"
        );

    }


    /*
     * ========================================================
     * SURPRISING NUMBERS
     * ========================================================
     */

    if (
        /\b(28|30|40|50|60|70|80|90|100)\b/
            .test(text)
    ) {

        score += 2;

        reasons.push(
            "unusual statistic"
        );

    }


    /*
     * ========================================================
     * PENALIZE ORDINARY GAME RESULTS
     * ========================================================
     */

    const ordinaryGamePattern =
        /\b(defeated|beat|beats|won|lost to|victory over)\b/;


    const hasInterestingSignal =
        reasons.length > 0;


    if (
        ordinaryGamePattern.test(text) &&
        !hasInterestingSignal
    ) {

        score -= 10;

        reasons.push(
            "ordinary game result"
        );

    }


    /*
     * ========================================================
     * MINIMUM QUALITY THRESHOLD
     * ========================================================
     */

    if (
        score < 7
    ) {

        return null;

    }


    return {

        ...event,

        significance: {

            score,

            reasons

        }

    };

}


export default onThisDaySportsData;