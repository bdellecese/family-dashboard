const intervals = new WeakMap();


const dateTime = {

    render(container, options = {}) {

        const defaults = {

            timezone: "America/New_York",

            color: "black",

            time: {
                format: "12h",
                size: 48,
                weight: "normal"
            },

            date: {
                format: "weekday-month-day",
                size: 18,
                weight: "normal"
            },

            alignment: "center"
        };


        const config = {

            ...defaults,

            ...options,

            time: {
                ...defaults.time,
                ...(options.time || {})
            },

            date: {
                ...defaults.date,
                ...(options.date || {})
            }

        };


        container.classList.add(
            "date-time-widget"
        );


        container.innerHTML = `
            <div class="date-time-widget__time"></div>
            <div class="date-time-widget__date"></div>
        `;


        const timeElement =
            container.querySelector(
                ".date-time-widget__time"
            );


        const dateElement =
            container.querySelector(
                ".date-time-widget__date"
            );


        container.style.textAlign =
            config.alignment;


        container.style.color =
            config.color;


        timeElement.style.fontSize =
            `${config.time.size}px`;


        timeElement.style.fontWeight =
            config.time.weight;


        dateElement.style.fontSize =
            `${config.date.size}px`;


        dateElement.style.fontWeight =
            config.date.weight;


        function update() {

            const now =
                new Date();


            updateTime(now);
            updateDate(now);

        }


        function updateTime(date) {

            if (
                config.time.format ===
                "disabled"
            ) {

                timeElement.style.display =
                    "none";

                return;

            }


            timeElement.style.display =
                "";


            const options = {

                hour:
                    config.time.format ===
                    "24h"
                        ? "2-digit"
                        : "numeric",

                minute: "2-digit",

                hour12:
                    config.time.format !==
                    "24h"

            };


            if (
                config.timezone !==
                "local"
            ) {

                options.timeZone =
                    config.timezone;

            }


            timeElement.textContent =
                new Intl.DateTimeFormat(
                    "en-US",
                    options
                ).format(date);

        }


        function updateDate(date) {

            if (
                config.date.format ===
                "disabled"
            ) {

                dateElement.style.display =
                    "none";

                return;

            }


            dateElement.style.display =
                "";


            const options =
                getDateFormatOptions(
                    config.date.format
                );


            if (
                config.timezone !==
                "local"
            ) {

                options.timeZone =
                    config.timezone;

            }


            dateElement.textContent =
                new Intl.DateTimeFormat(
                    "en-US",
                    options
                ).format(date);

        }


        function getDateFormatOptions(
            format
        ) {

            switch (format) {

                case "weekday-month-day":

                    return {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    };


                case "weekday-full":

                    return {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    };


                case "month-day":

                    return {
                        month: "long",
                        day: "numeric"
                    };


                case "short":

                    return {
                        month: "short",
                        day: "numeric"
                    };


                case "numeric":

                    return {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit"
                    };


                case "numeric-full":

                    return {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric"
                    };


                default:

                    return {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    };

            }

        }


        update();


        const interval =
            setInterval(
                update,
                1000
            );


        intervals.set(
            container,
            interval
        );

    },


    destroy(container) {

        const interval =
            intervals.get(
                container
            );


        if (interval) {

            clearInterval(
                interval
            );

            intervals.delete(
                container
            );

        }

    }

};


export default dateTime;