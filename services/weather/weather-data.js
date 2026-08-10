/*
 * WEATHER DATA SERVICE
 *
 * Uses Open-Meteo for:
 * - Geocoding
 * - Current conditions
 * - Hourly forecast
 * - Daily forecast
 */

const weatherData = {

    async getWeather(
        location
    ) {

        /*
         * GEOCODE LOCATION
         */

        const geocodeUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                location
            )}&count=1&language=en&format=json`;

        const geocodeResponse =
            await fetch(
                geocodeUrl
            );

        if (
            !geocodeResponse.ok
        ) {

            throw new Error(
                `Weather geocoding failed: ${geocodeResponse.status}`
            );

        }

        const geocode =
            await geocodeResponse.json();

        if (
            !geocode.results ||
            geocode.results.length === 0
        ) {

            throw new Error(
                `Unable to find location: ${location}`
            );

        }

        const place =
            geocode.results[0];


        /*
         * WEATHER REQUEST
         */

        const weatherUrl =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${place.latitude}` +
            `&longitude=${place.longitude}` +
            "&current=" +
            [
                "temperature_2m",
                "apparent_temperature",
                "relative_humidity_2m",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m"
            ].join(",") +
            "&hourly=" +
            [
                "temperature_2m",
                "apparent_temperature",
                "precipitation_probability",
                "precipitation",
                "weather_code"
            ].join(",") +
            "&daily=" +
            [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_probability_max",
                "precipitation_sum",
                "sunrise",
                "sunset"
            ].join(",") +
            "&temperature_unit=fahrenheit" +
            "&wind_speed_unit=mph" +
            "&precipitation_unit=inch" +
            "&timezone=auto" +
            "&forecast_days=5";

        const weatherResponse =
            await fetch(
                weatherUrl
            );

        if (
            !weatherResponse.ok
        ) {

            throw new Error(
                `Weather request failed: ${weatherResponse.status}`
            );

        }

        const data =
            await weatherResponse.json();


        /*
         * NORMALIZE RESPONSE
         */

        return {

            location: {

                name:
                    place.name,

                state:
                    place.admin1 || "",

                country:
                    place.country || "",

                latitude:
                    place.latitude,

                longitude:
                    place.longitude

            },

            current:
                normalizeCurrent(
                    data.current
                ),

            hourly:
                normalizeHourly(
                    data.hourly
                ),

            daily:
                normalizeDaily(
                    data.daily
                )

        };

    }

};


/*
 * CURRENT CONDITIONS
 */

function normalizeCurrent(
    current
) {

    return {

        temperature:
            current.temperature_2m,

        feelsLike:
            current.apparent_temperature,

        humidity:
            current.relative_humidity_2m,

        windSpeed:
            current.wind_speed_10m,

        windDirection:
            current.wind_direction_10m,

        weatherCode:
            current.weather_code

    };

}


/*
 * HOURLY FORECAST
 */

function normalizeHourly(
    hourly
) {

    const results = [];

    for (
        let i = 0;
        i < hourly.time.length;
        i++
    ) {

        results.push({

            time:
                hourly.time[i],

            temperature:
                hourly.temperature_2m[i],

            feelsLike:
                hourly.apparent_temperature[i],

            precipitationProbability:
                hourly.precipitation_probability[i],

            precipitation:
                hourly.precipitation[i],

            weatherCode:
                hourly.weather_code[i]

        });

    }

    return results;

}


/*
 * DAILY FORECAST
 */

function normalizeDaily(
    daily
) {

    const results = [];

    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        results.push({

            date:
                daily.time[i],

            weatherCode:
                daily.weather_code[i],

            high:
                daily.temperature_2m_max[i],

            low:
                daily.temperature_2m_min[i],

            precipitationProbability:
                daily.precipitation_probability_max[i],

            precipitation:
                daily.precipitation_sum[i],

            sunrise:
                daily.sunrise[i],

            sunset:
                daily.sunset[i]

        });

    }

    return results;

}

export default weatherData;