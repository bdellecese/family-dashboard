import {
    COMMUTE_SETTINGS,
    COMMUTE_DESTINATIONS
} from "../../config/commute.js";


/*
 * ============================================
 * GET COMMUTE DATA
 * ============================================
 */

export async function getCommuteData(
    currentMinutesByDestination = {},
    now = new Date()
) {

    /*
     * ----------------------------------------
     * Check schedule
     * ----------------------------------------
     */

    const day =
        new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long"
            }
        ).format(
            now
        );


    if (
        !COMMUTE_SETTINGS.activeDays.includes(
            day
        )
    ) {

        return [];

    }


    /*
     * ----------------------------------------
     * Check AM window
     * ----------------------------------------
     */

    const currentTime =
        getTimeString(now);


    if (
        currentTime <
            COMMUTE_SETTINGS.amStart ||
        currentTime >=
            COMMUTE_SETTINGS.amEnd
    ) {

        return [];

    }


    /*
     * ----------------------------------------
     * Build commute data
     * ----------------------------------------
     */

    return COMMUTE_DESTINATIONS
        .map(
            destination => {

                const currentMinutes =
                    currentMinutesByDestination[
                        destination.id
                    ];


                /*
                 * No travel data available
                 */

                if (
                    currentMinutes === undefined
                ) {

                    return null;

                }


                const delayMinutes =
                    currentMinutes -
                    destination.normalMinutes;


                const leaveBy =
                    calculateLeaveBy(
                        destination.arriveBy,
                        currentMinutes,
                        now
                    );


                return {

                    id:
                        destination.id,

                    name:
                        destination.name,

                    address:
                        destination.address,

                    currentMinutes,

                    normalMinutes:
                        destination.normalMinutes,

                    delayMinutes,

                    arriveBy:
                        destination.arriveBy,

                    leaveBy,

                    status:
                        getStatus(
                            delayMinutes
                        )

                };

            }
        )
        .filter(
            Boolean
        );

}


/*
 * ============================================
 * STATUS
 * ============================================
 */

function getStatus(
    delayMinutes
) {

    if (
        delayMinutes <= 2
    ) {

        return "normal";

    }


    if (
        delayMinutes <= 5
    ) {

        return "slower";

    }


    return "delayed";

}


/*
 * ============================================
 * LEAVE BY
 * ============================================
 */

function calculateLeaveBy(
    arriveBy,
    travelMinutes,
    now
) {

    const [
        hours,
        minutes
    ] =
        arriveBy
            .split(":")
            .map(Number);


    const arrival =
        new Date(
            now
        );


    arrival.setHours(
        hours,
        minutes,
        0,
        0
    );


    arrival.setMinutes(
        arrival.getMinutes() -
        travelMinutes
    );


    return getTimeString(
        arrival
    );

}


/*
 * ============================================
 * TIME STRING
 * ============================================
 */

function getTimeString(
    date
) {

    return new Intl.DateTimeFormat(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    )
    .format(date);

}
