const commute = {

    name:
        "commute",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        /*
         * WRAPPER
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "commute-widget";

        container.appendChild(
            wrapper
        );


        /*
         * TITLE
         */

        const title =
            document.createElement("div");

        title.className =
            "commute-widget__title";

        title.textContent =
            "Commute Times";

        wrapper.appendChild(
            title
        );


        /*
         * LOAD DATA
         */

        let data;

        try {

            const response =
                await fetch(
                    "/api/commute"
                );

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }

            data =
                await response.json();

        }

        catch (error) {

            console.error(
                "Commute error:",
                error
            );

            const message =
                document.createElement("div");

            message.className =
                "commute-widget__error";

            message.textContent =
                "Unable to load commute";

            wrapper.appendChild(
                message
            );

            return;

        }


        /*
         * NO COMMUTE DATA
         */

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            const message =
                document.createElement("div");

            message.className =
                "commute-widget__empty";

            message.textContent =
                "No commute events to display!";

            wrapper.appendChild(
                message
            );

            return;

        }


        /*
         * DESTINATIONS
         */

        const destinations =
            document.createElement("div");

        destinations.className =
            "commute-widget__destinations";


        data.forEach(
            item => {

                destinations.appendChild(
                    createDestination(
                        item
                    )
                );

            }
        );


        wrapper.appendChild(
            destinations
        );

    }

};


/*
 * DESTINATION
 */

function createDestination(
    item
) {

    const destination =
        document.createElement("div");

    destination.className =
        "commute-widget__destination";


    /*
     * NAME
     */

    const name =
        document.createElement("div");

    name.className =
        "commute-widget__name";

    name.textContent =
        item.name;


    /*
     * ADDRESS
     */

    const address =
        document.createElement("div");

    address.className =
        "commute-widget__address";

    address.textContent =
        item.address;


    /*
     * CURRENT COMMUTE
     */

    const current =
        document.createElement("div");

    current.className =
        "commute-widget__current";


    const icon =
        document.createElement("i");

    icon.className =
        "fas fa-car commute-widget__icon";

    icon.setAttribute(
        "aria-hidden",
        "true"
    );


    const minutes =
        document.createElement("span");

    minutes.className =
        "commute-widget__minutes";

    minutes.textContent =
        `${item.currentMinutes} min`;


    const status =
        document.createElement("span");

    status.className =
        `commute-widget__status commute-widget__status--${item.status}`;

    status.textContent =
        formatStatus(
            item.status,
            item.delayMinutes
        );


    current.appendChild(
        icon
    );

    current.appendChild(
        minutes
    );

    current.appendChild(
        status
    );


    /*
     * TIMES
     */

    const times =
        document.createElement("div");

    times.className =
        "commute-widget__times";


    times.appendChild(
        createTime(
            "Leave by",
            item.leaveBy
        )
    );

    times.appendChild(
        createTime(
            "Arrive by",
            item.arriveBy
        )
    );


    /*
     * BUILD
     */

    destination.appendChild(
        name
    );

    destination.appendChild(
        address
    );

    destination.appendChild(
        current
    );

    destination.appendChild(
        times
    );


    return destination;

}


/*
 * TIME
 */

function createTime(
    label,
    value
) {

    const element =
        document.createElement("div");

    element.className =
        "commute-widget__time";


    const labelElement =
        document.createElement("div");

    labelElement.className =
        "commute-widget__time-label";

    labelElement.textContent =
        label;


    const valueElement =
        document.createElement("div");

    valueElement.className =
        "commute-widget__time-value";

    valueElement.textContent =
        formatTime(
            value
        );


    element.appendChild(
        labelElement
    );

    element.appendChild(
        valueElement
    );


    return element;

}


/*
 * FORMAT TIME
 */

function formatTime(
    value
) {

    const [
        hours,
        minutes
    ] =
        value.split(":");


    const hour =
        Number(hours);

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;


    return `${displayHour}:${minutes} ${suffix}`;

}


/*
 * STATUS
 */

function formatStatus(
    status,
    delayMinutes
) {

    if (
        status === "delayed"
    ) {

        return `+${delayMinutes} min`;

    }


    if (
        status === "slower"
    ) {

        return `+${delayMinutes} min`;

    }


    if (
        delayMinutes < 0
    ) {

        return `${Math.abs(delayMinutes)} min faster`;

    }


    return "normal";

}


export default commute;