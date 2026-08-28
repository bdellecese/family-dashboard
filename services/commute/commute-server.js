import {
    getCommuteData
} from "./commute-data.js";

import {
    getDrivingDuration
} from "./google-routes.js";

import {
    COMMUTE_DESTINATIONS
} from "../../config/commute.js";


/*
 * ============================================
 * COMMUTE API
 * ============================================
 */

export async function getCommute() {

    /*
     * ----------------------------------------
     * Get live travel times
     * ----------------------------------------
     */

    const currentMinutesByDestination =
        {};


    for (
        const destination of
        COMMUTE_DESTINATIONS
    ) {

        try {

            currentMinutesByDestination[
                destination.id
            ] =
                await getDrivingDuration(
                    destination.address
                );

        }

        catch (error) {

            console.error(
                `Commute lookup failed for ${destination.name}:`,
                error.message
            );

        }

    }


    /*
     * ----------------------------------------
     * Calculate commute data
     * ----------------------------------------
     */

    return await getCommuteData(
        currentMinutesByDestination
    );

}