const commute = {

    name:
        "commute",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        /*
         * ========================================================
         * WRAPPER
         * ========================================================
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "commute-widget";

        container.appendChild(
            wrapper
        );


        /*
         * ========================================================
         * TITLE
         * ========================================================
         */

        const title =
            document.createElement("div");

        title.className =
            "commute-widget__title";

        title.textContent =
            "Today's Commute";

        wrapper.appendChild(
            title
        );


        /*
         * ========================================================
         * LOAD DATA
         * ========================================================
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
         * ========================================================
         * NO COMMUTE EVENTS TO DISPLAY
         * ========================================================
         *
         * No remaining commute events today.
         */

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            const message =
                document.createElement("div");

            message.className =
                "commute-widget__empty";


            const title =
                document.createElement("div");

            title.className =
                "commute-widget__empty-title";

            title.textContent =
                "🎉 You're all done!";


            const subtitle =
                document.createElement("div");

            subtitle.className =
                "commute-widget__empty-subtitle";

            subtitle.textContent =
                "No more commutes today.";


            message.appendChild(
                title
            );

            message.appendChild(
                subtitle
            );


            wrapper.appendChild(
                message
            );

            return;

        }


        /*
         * ========================================================
         * DESTINATIONS
         * ========================================================
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
 * ============================================================
 * DESTINATION
 * ============================================================
 */

function createDestination(
    item
) {

    const destination =
        document.createElement("div");

    destination.className =
        "commute-widget__destination";


    /*
     * ========================================================
     * NAME
     * ========================================================
     */

    const name =
        document.createElement("div");

    name.className =
        "commute-widget__name";

    name.textContent =
        item.name;


    /*
     * ========================================================
     * ADDRESS
     * ========================================================
     *
     * Only show an address here when it is configured.
     *
     * For event-based destinations, the address belongs
     * to the individual event.
     */

    if (
        item.address
    ) {

        const address =
            document.createElement("div");

        address.className =
            "commute-widget__address";

        address.textContent =
            item.address;

        destination.appendChild(
            address
        );

    }


    /*
     * ========================================================
     * UPCOMING EVENTS
     * ========================================================
     */

    const events =
        document.createElement("div");

    events.className =
        "commute-widget__events";


    /*
     * Render each upcoming event.
     */

    item.events.forEach(
        event => {

            events.appendChild(
                createEvent(
                    event,
                    item.arrivalBufferMinutes,
                    item.address
                )
            );

        }
    );


    /*
     * ========================================================
     * BUILD
     * ========================================================
     */

    destination.insertBefore(
        name,
        destination.firstChild
    );

    destination.appendChild(
        events
    );


    return destination;

}


/*
 * ============================================================
 * EVENT
 * ============================================================
 */

function createEvent(
    event,
    arrivalBufferMinutes,
    configuredAddress
) {

    const element =
        document.createElement("div");

    element.className =
        "commute-widget__event";


    /*
     * ========================================================
     * EVENT TITLE
     * ========================================================
     */

    const title =
        document.createElement("div");

    title.className =
        "commute-widget__event-title";

    title.textContent =
        event.title;


    /*
     * ========================================================
     * EVENT LOCATION
     * ========================================================
     *
     * Only show the event location when the destination
     * itself does not have a configured address.
     *
     * This keeps fixed destinations clean while allowing
     * sports events to show their actual location.
     */

    if (
        event.address &&
        !configuredAddress
    ) {

        const address =
            document.createElement("div");

        address.className =
            "commute-widget__event-address";

        address.textContent =
            event.address;

        element.appendChild(
            address
        );

    }


    /*
     * ========================================================
     * CURRENT TRAVEL TIME
     * ========================================================
     */

    if (
        event.currentMinutes !== null &&
        event.currentMinutes !== undefined
    ) {

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
            `${event.currentMinutes} min`;


        current.appendChild(
            icon
        );

        current.appendChild(
            minutes
        );


        /*
         * STATUS
         */

        if (
            event.status &&
            event.delayMinutes !== undefined
        ) {

            const status =
                document.createElement("span");

            status.className =
                `commute-widget__status commute-widget__status--${event.status}`;

            status.textContent =
                formatStatus(
                    event.status,
                    event.delayMinutes
                );

            current.appendChild(
                status
            );

        }


        element.appendChild(
            current
        );

    }


    /*
     * ========================================================
     * TIMES
     * ========================================================
     */

    const times =
        document.createElement("div");

    times.className =
        "commute-widget__event-times";


    times.appendChild(
        createTime(
            "Leave",
            event.leaveBy
        )
    );


    times.appendChild(
        createTime(
            "Arrive",
            event.arriveBy,
            arrivalBufferMinutes
        )
    );


    /*
     * ========================================================
     * BUILD
     * ========================================================
     */

    element.appendChild(
        title
    );

    element.appendChild(
        times
    );


    return element;

}


/*
 * ============================================================
 * TIME
 * ============================================================
 */

function createTime(
    label,
    value,
    arrivalBufferMinutes = 0
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


    if (
        value
    ) {

        valueElement.textContent =
            formatTime(
                value
            );

    }
    else {

        valueElement.textContent =
            "--";

    }


    element.appendChild(
        labelElement
    );

    element.appendChild(
        valueElement
    );


    /*
     * ========================================================
     * ARRIVAL BUFFER
     * ========================================================
     */

    if (
        label === "Arrive" &&
        arrivalBufferMinutes > 0
    ) {

        const bufferElement =
            document.createElement("div");

        bufferElement.className =
            "commute-widget__time-buffer";

        bufferElement.textContent =
            `${arrivalBufferMinutes} min buffer`;

        element.appendChild(
            bufferElement
        );

    }


    return element;

}


/*
 * ============================================================
 * FORMAT TIME
 * ============================================================
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
 * ============================================================
 * STATUS
 * ============================================================
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