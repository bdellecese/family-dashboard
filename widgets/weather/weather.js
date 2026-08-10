import weatherData from "../../services/weather/weather-data.js";

const weather = {

    name: "weather",

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
            "weather-widget";

        container.appendChild(
            wrapper
        );


        /*
         * LOAD WEATHER
         */

        let data;
        const updatedAt = new Date();

        try {

            data =
                await weatherData.getWeather(
                    location
                );

        }

        catch (error) {

            console.error(
                "Weather error:",
                error
            );

            const message =
                document.createElement("div");

            message.className =
                "weather-widget__error";

            message.textContent =
                "Unable to load weather";

            wrapper.appendChild(
                message
            );

            return;

        }


        /*
         * LOCATION
         */

        const locationName =
            document.createElement("div");

        locationName.className =
            "weather-widget__location";

        locationName.textContent =
            `${data.location.name}, ${getStateAbbreviation(
                data.location.state
            )}`;


        /*
         * UPDATED
         */

        const updated =
            document.createElement("div");

        updated.className =
            "weather-widget__updated";

        updated.textContent =
            `Updated ${formatUpdatedAge(
                updatedAt
            )}`;


        /*
         * CURRENT CONDITIONS
         */

        const current =
            document.createElement("div");

        current.className =
            "weather-widget__current";


        const currentIcon =
            createIcon(
                getWeatherIcon(
                    data.current.weatherCode,
                    isNight(
                        data.daily[0].sunrise,
                        data.daily[0].sunset
                    )
                )
            );

        currentIcon.className +=
            " weather-widget__current-icon";


        const currentTemp =
            document.createElement("div");

        currentTemp.className =
            "weather-widget__temperature";

        currentTemp.textContent =
            `${Math.round(
                data.current.temperature
            )}°`;


        const currentDetails =
            document.createElement("div");

        currentDetails.className =
            "weather-widget__current-details";


        const condition =
            document.createElement("div");

        condition.className =
            "weather-widget__condition";

        condition.textContent =
            getWeatherDescription(
                data.current.weatherCode
            );


        const feels =
            document.createElement("div");

        feels.className =
            "weather-widget__feels";

        feels.textContent =
            `Feels like ${Math.round(
                data.current.feelsLike
            )}°`;


        currentDetails.appendChild(
            condition
        );

        currentDetails.appendChild(
            feels
        );


        current.appendChild(
            currentIcon
        );

        current.appendChild(
            currentTemp
        );

        current.appendChild(
            currentDetails
        );


        /*
         * WEATHER DETAILS
         */

        const details =
            document.createElement("div");

        details.className =
            "weather-widget__details";


        /*
         * SUNRISE / SUNSET / MOON
         */

        const detailsRowOne =
            document.createElement("div");

        detailsRowOne.className =
            "weather-widget__details-row";


        detailsRowOne.appendChild(
            createDetail(
                "fa-sun",
                "Sunrise",
                formatTime(
                    data.daily[0].sunrise
                )
            )
        );


        detailsRowOne.appendChild(
            createDetail(
                "fa-sun",
                "Sunset",
                formatTime(
                    data.daily[0].sunset
                )
            )
        );


        detailsRowOne.appendChild(
            createDetail(
                "fa-moon",
                "Moon",
                getMoonPhase()
            )
        );


        /*
         * WIND / HUMIDITY
         */

        const detailsRowTwo =
            document.createElement("div");

        detailsRowTwo.className =
            "weather-widget__details-row";


        detailsRowTwo.appendChild(
            createDetail(
                "fa-wind",
                "Wind",
                `${Math.round(
                    data.current.windSpeed
                )} mph`
            )
        );


        detailsRowTwo.appendChild(
            createDetail(
                "fa-droplet",
                "Humidity",
                `${data.current.humidity}%`
            )
        );


        details.appendChild(
            detailsRowOne
        );

        details.appendChild(
            detailsRowTwo
        );


        /*
         * HOURLY SECTION
         */

        const hourlySection =
            document.createElement("div");

        hourlySection.className =
            "weather-widget__section";


        hourlySection.appendChild(
            createSectionTitle(
                "NEXT SEVERAL HOURS"
            )
        );


        const hourly =
            document.createElement("div");

        hourly.className =
            "weather-widget__hourly";


        const now =
            new Date();


        const hourlyForecast =
            data.hourly
                .filter(
                    hour =>
                        new Date(
                            hour.time
                        ) >= now
                )
                .slice(
                    0,
                    10
                );


        hourlyForecast.forEach(
            (hour, index) => {

                const column =
                    document.createElement(
                        "div"
                    );

                column.className =
                    "weather-widget__hour";


                const time =
                    document.createElement(
                        "div"
                    );

                time.className =
                    "weather-widget__hour-time";

                time.textContent =
                    index === 0
                        ? "Now"
                        : formatHour(
                            hour.time
                        );


                const icon =
                    createIcon(
                        getWeatherIcon(
                            hour.weatherCode,
                            isNightForTime(
                                hour.time,
                                data.daily
                            )
                        )
                    );

                icon.className +=
                    " weather-widget__hour-icon";


                const temp =
                    document.createElement(
                        "div"
                    );

                temp.className =
                    "weather-widget__hour-temp";

                temp.textContent =
                    `${Math.round(
                        hour.temperature
                    )}°`;


                const precip =
                    document.createElement(
                        "div"
                    );

                precip.className =
                    "weather-widget__hour-precip";

                precip.textContent =
                    `${hour.precipitationProbability || 0}%`;


                column.appendChild(
                    time
                );

                column.appendChild(
                    icon
                );

                column.appendChild(
                    temp
                );

                column.appendChild(
                    precip
                );


                hourly.appendChild(
                    column
                );

            }
        );


        hourlySection.appendChild(
            hourly
        );


        /*
         * DAILY FORECAST
         */

        const forecastSection =
            document.createElement("div");

        forecastSection.className =
            "weather-widget__section";


        forecastSection.appendChild(
            createSectionTitle(
                "4-DAY FORECAST"
            )
        );


        const forecast =
            document.createElement("div");

        forecast.className =
            "weather-widget__forecast";


        data.daily
            .slice(
                0,
                4
            )
            .forEach(
                (
                    day,
                    index
                ) => {

                    forecast.appendChild(
                        createForecastDay(
                            day,
                            index
                        )
                    );

                }
            );


        forecastSection.appendChild(
            forecast
        );


        /*
         * BUILD WIDGET
         */

        wrapper.appendChild(
            locationName
        );

        wrapper.appendChild(
            updated
        );

        wrapper.appendChild(
            current
        );

        wrapper.appendChild(
            details
        );

        wrapper.appendChild(
            hourlySection
        );

        wrapper.appendChild(
            forecastSection
        );

    }

};


/*
 * CREATE FONT AWESOME ICON
 */

function createIcon(
    iconClass
) {

    const icon =
        document.createElement(
            "i"
        );

    icon.className =
        `fas ${iconClass}`;

    icon.setAttribute(
        "aria-hidden",
        "true"
    );

    return icon;
}


/*
 * DETAIL ITEM
 */

function createDetail(
    iconClass,
    label,
    value
) {

    const detail =
        document.createElement(
            "div"
        );

    detail.className =
        "weather-widget__detail";


    const icon =
        createIcon(
            iconClass
        );

    icon.className +=
        " weather-widget__detail-icon";


    const text =
        document.createElement(
            "div"
        );


    const labelElement =
        document.createElement(
            "div"
        );

    labelElement.className =
        "weather-widget__detail-label";

    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            "div"
        );

    valueElement.className =
        "weather-widget__detail-value";

    valueElement.textContent =
        value;


    text.appendChild(
        labelElement
    );

    text.appendChild(
        valueElement
    );


    detail.appendChild(
        icon
    );

    detail.appendChild(
        text
    );


    return detail;
}


/*
 * SECTION TITLE
 */

function createSectionTitle(
    text
) {

    const title =
        document.createElement(
            "div"
        );

    title.className =
        "weather-widget__section-title";

    title.textContent =
        text;

    return title;
}


/*
 * FORECAST DAY
 */

function createForecastDay(
    day,
    index
) {

    const column =
        document.createElement(
            "div"
        );

    column.className =
        "weather-widget__forecast-day";


    const name =
        document.createElement(
            "div"
        );

    name.className =
        "weather-widget__forecast-name";

    name.textContent =
        index === 0
            ? "Today"
            : new Date(
                `${day.date}T12:00:00`
            ).toLocaleDateString(
                undefined,
                {
                    weekday:
                        "short"
                }
            );


    const icon =
        createIcon(
            getWeatherIcon(
                day.weatherCode,
                isNightForTime(
                    `${day.date}T12:00:00`,
                    [day]
                )
            )
        );

    icon.className +=
        " weather-widget__forecast-icon";


    const precip =
        document.createElement(
            "div"
        );

    precip.className =
        "weather-widget__forecast-precip";

    precip.textContent =
        `${day.precipitationProbability || 0}%`;


    const amount =
        document.createElement(
            "div"
        );

    amount.className =
        "weather-widget__forecast-amount";

    amount.textContent =
        formatPrecipitation(
            day.precipitation
        );


    const temperatures =
        document.createElement(
            "div"
        );

    temperatures.className =
        "weather-widget__forecast-temp";

    temperatures.textContent =
        `${Math.round(
            day.high
        )}° / ${Math.round(
            day.low
        )}°`;


    column.appendChild(
        name
    );

    column.appendChild(
        icon
    );

    column.appendChild(
        precip
    );

    column.appendChild(
        amount
    );

    column.appendChild(
        temperatures
    );


    return column;
}


/*
 * WEATHER ICONS
 */

function getWeatherIcon(
    code,
    night = false
) {

    if (code === 0) {

        return night
            ? "fa-moon"
            : "fa-sun";

    }

    if (code === 1) {

        return night
            ? "fa-moon"
            : "fa-sun";

    }

    if (code === 2) {

        return night
            ? "fa-cloud-moon"
            : "fa-cloud-sun";

    }

    if (code === 3) {

        return "fa-cloud";

    }

    if (code === 45 || code === 48) {

        return "fa-smog";

    }

    if (code >= 51 && code <= 57) {

        return "fa-cloud-rain";

    }

    if (code >= 61 && code <= 67) {

        return "fa-cloud-rain";

    }

    if (code >= 71 && code <= 77) {

        return "fa-snowflake";

    }

    if (code >= 80 && code <= 82) {

        return "fa-cloud-showers-heavy";

    }

    if (code >= 85 && code <= 86) {

        return "fa-snowflake";

    }

    if (code >= 95) {

        return "fa-bolt";

    }

    return night
        ? "fa-cloud-moon"
        : "fa-cloud-sun";
}


/*
 * WEATHER DESCRIPTION
 */

function getWeatherDescription(
    code
) {

    if (code === 0)
        return "Clear";

    if (code === 1)
        return "Mostly clear";

    if (code === 2)
        return "Partly cloudy";

    if (code === 3)
        return "Overcast";

    if (code === 45 || code === 48)
        return "Foggy";

    if (code >= 51 && code <= 57)
        return "Drizzle";

    if (code >= 61 && code <= 67)
        return "Rain";

    if (code >= 71 && code <= 77)
        return "Snow";

    if (code >= 80 && code <= 82)
        return "Rain showers";

    if (code >= 85 && code <= 86)
        return "Snow showers";

    if (code >= 95)
        return "Thunderstorms";

    return "Unknown";
}


/*
 * FORMAT TIME
 */

function formatTime(
    value
) {

    return new Date(
        value
    )
        .toLocaleTimeString(
            undefined,
            {
                hour:
                    "numeric",

                minute:
                    "2-digit",

                hour12:
                    true
            }
        )
        .toLowerCase();
}


/*
 * FORMAT HOUR
 */

function formatHour(
    value
) {

    return new Date(
        value
    )
        .toLocaleTimeString(
            undefined,
            {
                hour:
                    "numeric",

                hour12:
                    true
            }
        )
        .toLowerCase();
}


/*
 * FORMAT PRECIPITATION
 */

function formatPrecipitation(
    value
) {

    if (
        !value ||
        value < 0.01
    ) {

        return '0.00"';

    }

    return `${value.toFixed(2)}"`;
}


/*
 * MOON PHASE
 */

function getMoonPhase() {

    const now =
        new Date();

    const knownNewMoon =
        new Date(
            "2000-01-06T18:14:00Z"
        );

    const synodicMonth =
        29.53058867;

    const days =
        (
            now -
            knownNewMoon
        ) /
        86400000;

    const phase =
        (
            days %
            synodicMonth +
            synodicMonth
        ) %
        synodicMonth;


    if (phase < 1.85)
        return "New Moon";

    if (phase < 7.38)
        return "Waxing Crescent";

    if (phase < 9.22)
        return "First Quarter";

    if (phase < 14.77)
        return "Waxing Gibbous";

    if (phase < 16.61)
        return "Full Moon";

    if (phase < 22.15)
        return "Waning Gibbous";

    if (phase < 23.99)
        return "Last Quarter";

    return "Waning Crescent";
}


/*
 * STATE ABBREVIATION
 */

function getStateAbbreviation(
    state
) {

    const states = {

        Alabama: "AL",
        Alaska: "AK",
        Arizona: "AZ",
        Arkansas: "AR",
        California: "CA",
        Colorado: "CO",
        Connecticut: "CT",
        Delaware: "DE",
        Florida: "FL",
        Georgia: "GA",
        Hawaii: "HI",
        Idaho: "ID",
        Illinois: "IL",
        Indiana: "IN",
        Iowa: "IA",
        Kansas: "KS",
        Kentucky: "KY",
        Louisiana: "LA",
        Maine: "ME",
        Maryland: "MD",
        Massachusetts: "MA",
        Michigan: "MI",
        Minnesota: "MN",
        Mississippi: "MS",
        Missouri: "MO",
        Montana: "MT",
        Nebraska: "NE",
        Nevada: "NV",
        "New Hampshire": "NH",
        "New Jersey": "NJ",
        "New Mexico": "NM",
        "New York": "NY",
        "North Carolina": "NC",
        "North Dakota": "ND",
        Ohio: "OH",
        Oklahoma: "OK",
        Oregon: "OR",
        Pennsylvania: "PA",
        "Rhode Island": "RI",
        "South Carolina": "SC",
        "South Dakota": "SD",
        Tennessee: "TN",
        Texas: "TX",
        Utah: "UT",
        Vermont: "VT",
        Virginia: "VA",
        Washington: "WA",
        "West Virginia": "WV",
        Wisconsin: "WI",
        Wyoming: "WY"
    };


    return (
        states[state] ||
        state
    );
}


/*
 * DETERMINE IF CURRENT TIME IS NIGHT
 */

function isNight(
    sunrise,
    sunset
) {

    const now =
        new Date();

    const sunriseTime =
        new Date(
            sunrise
        );

    const sunsetTime =
        new Date(
            sunset
        );

    return (
        now < sunriseTime ||
        now > sunsetTime
    );
}


/*
 * DETERMINE IF FORECAST TIME IS NIGHT
 */

function isNightForTime(
    time,
    daily
) {

    const date =
        new Date(
            time
        );

    const day =
        daily.find(
            item =>
                item.date ===
                date.toISOString().slice(0, 10)
        );

    if (!day) {

        return false;

    }

    return (
        date < new Date(day.sunrise) ||
        date > new Date(day.sunset)
    );
}


/*
 * FORMAT UPDATED AGE
 */

function formatUpdatedAge(
    value
) {

    const minutes =
        Math.floor(
            (
                new Date() -
                value
            ) / 60000
        );

    if (minutes < 1) {

        return "just now";

    }

    if (minutes === 1) {

        return "1 min ago";

    }

    return `${minutes} min ago`;
}


export default weather;