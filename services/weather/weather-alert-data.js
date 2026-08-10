const weatherAlertData = {

    async getAlerts(
        location = "Holden, MA"
    ) {

        /*
         * STEP 1
         * GEOCODE LOCATION
         */

        const geocodeUrl =
            `https://geocoding-api.open-meteo.com/v1/search?` +
            `name=${encodeURIComponent(location)}` +
            `&count=1` +
            `&language=en` +
            `&format=json`;

        const geocodeResponse =
            await fetch(
                geocodeUrl
            );

        if (!geocodeResponse.ok) {

            throw new Error(
                `Geocoding failed: ${geocodeResponse.status}`
            );

        }

        const geocodeData =
            await geocodeResponse.json();

        if (
            !geocodeData.results ||
            geocodeData.results.length === 0
        ) {

            throw new Error(
                `Location not found: ${location}`
            );

        }

        const place =
            geocodeData.results[0];


        /*
         * STEP 2
         * GET NWS GRID INFORMATION
         */

        const pointsUrl =
            `https://api.weather.gov/points/` +
            `${place.latitude},${place.longitude}`;

        const pointsResponse =
            await fetch(
                pointsUrl,
                {
                    headers: {
                        "Accept":
                            "application/geo+json"
                    }
                }
            );

        if (!pointsResponse.ok) {

            throw new Error(
                `NWS points lookup failed: ${pointsResponse.status}`
            );

        }

        const pointsData =
            await pointsResponse.json();


        /*
         * STEP 3
         * GET FORECAST ZONE
         */

        const forecastZone =
            pointsData.properties &&
            pointsData.properties.forecastZone;

        if (!forecastZone) {

            throw new Error(
                "No NWS forecast zone found"
            );

        }

        const zoneId =
            forecastZone
                .split("/")
                .pop();


        /*
         * STEP 4
         * GET ACTIVE ALERTS
         */

        const alertsUrl =
            `https://api.weather.gov/alerts/active?zone=${zoneId}`;

        const alertsResponse =
            await fetch(
                alertsUrl,
                {
                    headers: {
                        "Accept":
                            "application/geo+json"
                    }
                }
            );

        if (!alertsResponse.ok) {

            throw new Error(
                `NWS alerts lookup failed: ${alertsResponse.status}`
            );

        }

        const alertsData =
            await alertsResponse.json();


        /*
         * STEP 5
         * RETURN NORMALIZED DATA
         */

        return {

            location: {

                name:
                    place.name,

                state:
                    place.admin1

            },

            alerts:
                Array.isArray(
                    alertsData.features
                )
                    ? alertsData.features
                    : []

        };

    }

};


/*
 * EXPORT
 */

export default weatherAlertData;