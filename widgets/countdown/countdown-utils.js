import { getNextOccurrence } from "./recurrence.js";


export function daysUntil(dateValue) {

    let eventDate;


    if (dateValue instanceof Date) {

        eventDate = new Date(dateValue);

    } else {

        const [
            year,
            month,
            day
        ] = dateValue.split("-");


        eventDate = new Date(
            year,
            month - 1,
            day
        );

    }


    const today = new Date();


    today.setHours(0,0,0,0);
    eventDate.setHours(0,0,0,0);


    const diff =
        eventDate - today;


    return Math.ceil(
        diff / (1000 * 60 * 60 * 24)
    );

}



export function formatCountdown(days) {

    if (days === 0) {

        return "TODAY!";

    }


    if (days === 1) {

        return "Tomorrow";

    }


    return `${days} Days`;

}



export function prepareEvents(events) {


    return events

        .filter(event => event.enabled)


        .map(event => {


            const nextDate =
                getNextOccurrence(event);



            if (!nextDate) {

                return null;

            }


            return {

                ...event,

                date: nextDate,

                days:
                    daysUntil(nextDate)

            };


        })


        .filter(
            event => event !== null
        )


        .filter(
            event => event.days >= 0
        )


        .sort(
            (a,b) =>
                a.days - b.days
        );

}