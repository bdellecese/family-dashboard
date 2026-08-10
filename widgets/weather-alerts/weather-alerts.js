import weatherAlertDataModule from "../../services/weather/weather-alert-data.js";


/*
 * WEATHER ALERT DATA MODULE
 *
 * Support both:
 *
 * export default {...}
 *
 * and
 *
 * export {...}
 */

const weatherAlertData =
    weatherAlertDataModule?.default ||
    weatherAlertDataModule;


const weatherAlerts = {

    name: "weather-alerts",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        /*
         * CONFIGURATION
         */

        const location =
            config.location ||
            "Holden, MA";


        /*
         * WRAPPER
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "weather-alerts-widget";

        container.appendChild(
            wrapper
        );


        /*
         * LOAD ALERTS
         */

        let result;

        try {

            if (
                !weatherAlertData ||
                typeof weatherAlertData.getAlerts !== "function"
            ) {

                throw new Error(
                    "weather-alert-data.js does not expose getAlerts()"
                );

            }


            result =
                await weatherAlertData.getAlerts(
                    location
                );

        }

        catch (error) {

            console.error(
                "Weather alert error:",
                error
            );


            const message =
                document.createElement("div");

            message.className =
                "weather-alerts-widget__message";

            message.textContent =
                "Unable to load weather alerts";

            wrapper.appendChild(
                message
            );

            return;

        }


        /*
         * EXTRACT ALERTS
         */

        const alerts =
            Array.isArray(
                result?.alerts
            )
                ? result.alerts
                : [];


        /*
         * NO ALERTS
         */

        if (
            alerts.length === 0
        ) {

            const message =
                document.createElement("div");

            message.className =
                "weather-alerts-widget__message";

            message.textContent =
                "No active weather alerts";

            wrapper.appendChild(
                message
            );

            return;

        }


        /*
         * HEADER
         */

        const header =
            document.createElement("div");

        header.className =
            "weather-alerts-widget__header";

        header.textContent =
            alerts.length === 1
                ? "WEATHER ALERT"
                : "WEATHER ALERTS";

        wrapper.appendChild(
            header
        );


        /*
         * RENDER ALERTS
         */

        alerts.forEach(
            alert => {

                wrapper.appendChild(
                    createAlert(
                        alert
                    )
                );

            }
        );

    }

};


/*
 * CREATE ALERT
 */

function createAlert(
    alert
) {

    const container =
        document.createElement("div");

    container.className =
        "weather-alerts-widget__alert";


    /*
     * ALERT PROPERTIES
     */

    const properties =
        alert?.properties ||
        alert;


    /*
     * DETERMINE SEVERITY
     */

    const severity =
        getSeverity(
            properties
        );

    container.dataset.severity =
        severity;


    /*
     * WHAT
     */

    const event =
        document.createElement("div");

    event.className =
        "weather-alerts-widget__event";

    event.textContent =
        getAlertEvent(
            properties
        );


    /*
     * WHERE
     */

    const where =
        document.createElement("div");

    where.className =
        "weather-alerts-widget__row";


    const whereLabel =
        document.createElement("span");

    whereLabel.className =
        "weather-alerts-widget__label";

    whereLabel.textContent =
        "WHERE";


    const whereValue =
        document.createElement("span");

    whereValue.className =
        "weather-alerts-widget__value";

    whereValue.textContent =
        getAlertArea(
            properties
        );


    where.appendChild(
        whereLabel
    );

    where.appendChild(
        whereValue
    );


    /*
     * WHEN
     */

    const when =
        document.createElement("div");

    when.className =
        "weather-alerts-widget__row";


    const whenLabel =
        document.createElement("span");

    whenLabel.className =
        "weather-alerts-widget__label";

    whenLabel.textContent =
        "WHEN";


    const whenValue =
        document.createElement("span");

    whenValue.className =
        "weather-alerts-widget__value";

    whenValue.textContent =
        getAlertTime(
            properties
        );


    when.appendChild(
        whenLabel
    );

    when.appendChild(
        whenValue
    );


    /*
     * IMPACTS
     */

    const impacts =
        document.createElement("div");

    impacts.className =
        "weather-alerts-widget__impacts";


    const impactsLabel =
        document.createElement("span");

    impactsLabel.className =
        "weather-alerts-widget__label";

    impactsLabel.textContent =
        "IMPACTS";


    const impactsValue =
        document.createElement("span");

    impactsValue.className =
        "weather-alerts-widget__value";

    impactsValue.textContent =
        getImpacts(
            properties
        );


    impacts.appendChild(
        impactsLabel
    );

    impacts.appendChild(
        impactsValue
    );


    /*
     * BUILD ALERT
     */

    container.appendChild(
        event
    );

    container.appendChild(
        where
    );

    container.appendChild(
        when
    );

    container.appendChild(
        impacts
    );


    return container;

}


/*
 * ALERT EVENT / WHAT
 */

function getAlertEvent(
    alert
) {

    /*
     * The NWS event field is the
     * authoritative alert name.
     */

    const event =
        String(
            alert?.event ||
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();


    if (
        event
    ) {

        return event;

    }


    return "Weather Alert";

}


/*
 * ALERT AREA / WHERE
 */

function getAlertArea(
    alert
) {

    const area =
        String(
            alert?.areaDesc ||
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();


    return area ||
        "Local area";

}


/*
 * ALERT TIME / WHEN
 */

function getAlertTime(
    alert
) {

    const effective =
        alert?.effective;

    const expires =
        alert?.expires;


    if (
        effective &&
        expires
    ) {

        return `${formatAlertTime(
            effective
        )} – ${formatAlertTime(
            expires
        )}`;

    }


    if (
        expires
    ) {

        return `Until ${formatAlertTime(
            expires
        )}`;

    }


    if (
        effective
    ) {

        return `From ${formatAlertTime(
            effective
        )}`;

    }


    return "Time not specified";

}


/*
 * ALERT IMPACTS
 */

function getImpacts(
    alert
) {

    const description =
        alert?.description ||
        "";

    const instruction =
        alert?.instruction ||
        "";


    let text =
        cleanAlertText(
            description
        );


    if (
        !text
    ) {

        text =
            cleanAlertText(
                instruction
            );

    }


    return summarizeImpact(
        text
    );

}


/*
 * CLEAN ALERT TEXT
 */

function cleanAlertText(
    text
) {

    return String(
        text || ""
    )
    .replace(
        /\r?\n/g,
        " "
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();

}


/*
 * SUMMARIZE IMPACT
 */

function summarizeImpact(
    text
) {

    if (
        !text
    ) {

        return "Hazardous weather conditions expected.";

    }


    /*
     * NORMALIZE NWS TEXT
     */

    const cleaned =
        String(
            text
        )
        .replace(
            /\r?\n/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();


    /*
     * EXTRACT THE IMPACTS SECTION
     *
     * NWS commonly formats alerts like:
     *
     * - WHAT...Something happens.
     * - WHERE...Affected area.
     * - WHEN...Time period.
     * - IMPACTS...What it means.
     */

    const impactsMatch =
        cleaned.match(
            /(?:^|\s)[-•]?\s*IMPACTS\s*(?:\.\.\.|:)\s*(.*?)(?=\s[-•]?\s*(?:ADDITIONAL DETAILS|PRECAUTIONARY\/PREPAREDNESS ACTIONS|PRECAUTIONARY|WHAT|WHERE|WHEN)\s*(?:\.\.\.|:)|$)/i
        );


    if (
        impactsMatch &&
        impactsMatch[1]
    ) {

        return cleanImpactText(
            impactsMatch[1]
        );

    }


    /*
     * FALLBACK
     *
     * If there is no explicit IMPACTS
     * section, look for a useful sentence.
     */

    const sentences =
        cleaned
            .split(
                /(?<=[.!?])\s+/
            )
            .map(
                sentence =>
                    sentence.trim()
            )
            .filter(
                sentence =>
                    sentence.length > 0
            );


    const impactKeywords = [

        "impact",
        "travel",
        "damage",
        "flood",
        "visibility",
        "wind",
        "snow",
        "ice",
        "rain",
        "storm",
        "hazard",
        "danger",
        "road",
        "power",
        "property",
        "conditions",
        "heat",
        "illness"

    ];


    const impactSentence =
        sentences.find(
            sentence =>
                impactKeywords.some(
                    keyword =>
                        sentence
                            .toLowerCase()
                            .includes(
                                keyword
                            )
                )
        );


    if (
        impactSentence
    ) {

        return cleanImpactText(
            impactSentence
        );

    }


    return cleanImpactText(
        sentences[0] ||
        "Hazardous weather conditions expected."
    );

}


/*
 * CLEAN IMPACT TEXT
 */

function cleanImpactText(
    text
) {

    return String(
        text || ""
    )
    .replace(
        /^[-•]?\s*(?:IMPACTS|IMPACT)\s*(?:\.\.\.|:)\s*/i,
        ""
    )
    .replace(
        /^[-•]\s*/,
        ""
    )
    .trim();

}


/*
 * SEVERITY
 */

function getSeverity(
    alert
) {

    const event =
        (
            alert?.event ||
            ""
        ).toLowerCase();


    /*
     * WARNING
     */

    if (
        event.includes(
            "warning"
        )
    ) {

        return "warning";

    }


    /*
     * WATCH
     */

    if (
        event.includes(
            "watch"
        )
    ) {

        return "watch";

    }


    /*
     * ADVISORY
     */

    if (
        event.includes(
            "advisory"
        )
    ) {

        return "advisory";

    }


    /*
     * FALLBACK TO NWS SEVERITY
     */

    const severity =
        (
            alert?.severity ||
            ""
        ).toLowerCase();


    if (
        severity === "extreme" ||
        severity === "severe"
    ) {

        return "warning";

    }


    if (
        severity === "moderate"
    ) {

        return "watch";

    }


    return "advisory";

}


/*
 * FORMAT ALERT TIME
 */

function formatAlertTime(
    value
) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown";

    }


    return date.toLocaleString(
        undefined,
        {
            weekday:
                "short",

            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


/*
 * EXPORT
 */

export default weatherAlerts;