function getNextOccurrence(event) {

    let eventDate = event.date;

    // Normalize string dates from Google Sheets
    if (typeof eventDate === "string") {
        eventDate = new Date(eventDate + "T00:00:00");
    }

    if (!eventDate && event.recurringRule !== "easter") {
        console.warn(
            "Missing date for recurring event:",    
            event.event
        );
        return null;
    }

    // Non-recurring events use the original date
    if (!event.recurring || !event.recurringRule) {
        return eventDate;
    }

    const today = new Date();
    const year = today.getFullYear();

    switch(event.recurringRule) {

        case "yearly":

            let yearlyDate = new Date(
                year,
                eventDate.getMonth(),
                eventDate.getDate()
            );

            if (yearlyDate < today) {
                yearlyDate = new Date(
                    year + 1,
                    eventDate.getMonth(),
                    eventDate.getDate()
                );
            }

            return yearlyDate;

        case "nth_weekday":

            let weekdayDate = getNthWeekday(
                year,
                event.recurringMonth,
                event.recurringWeek,
                event.recurringWeekday
            );

            if (weekdayDate < today) {
                weekdayDate = getNthWeekday(
                    year + 1,
                    event.recurringMonth,
                    event.recurringWeek,
                    event.recurringWeekday
                );
            }

            return weekdayDate;

        case "last_weekday":

            let lastWeekdayDate = getLastWeekday(
                year,
                event.recurringMonth,
                event.recurringWeekday
            );

            if (lastWeekdayDate < today) {
                lastWeekdayDate = getLastWeekday(
                    year + 1,
                    event.recurringMonth,
                    event.recurringWeekday
                );
            }

            return lastWeekdayDate;

        case "easter":

            let easterDate = getEaster(year);

            if (easterDate < today) {
                easterDate = getEaster(year + 1);
            }

            return easterDate;

        case "election_day":

            let electionDate = getElectionDay(year);

            if (electionDate < today) {
                electionDate = getElectionDay(year + 1);
            }

            return electionDate;

        case "relative":

            let relativeDate = getRelativeDate(
                event,
                year
            );

            if (relativeDate < today) {

                relativeDate = getRelativeDate(
                    event,
                    year + 1
                );

            }

            return relativeDate;

        default:
            return eventDate;
    }
}

function getNthWeekday(year, month, week, weekday) {

    // Normalize values from Google Sheets
    week = String(week).trim().toLowerCase();
    weekday = String(weekday).trim();

    const weekdays = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6
    };

    const targetDay = weekdays[weekday];

    if (targetDay === undefined) {
        console.error("Invalid weekday:", weekday);
        return null;
    }

    // Last occurrence of weekday in month
    if (week === "last") {

        const lastDay = new Date(
            year,
            month,
            0
        );

        while (lastDay.getDay() !== targetDay) {
            lastDay.setDate(lastDay.getDate() - 1);
        }

        return lastDay;
    }

    // Convert week to a number
    const weekNumber = Number(week);

    if (Number.isNaN(weekNumber) || weekNumber < 1 || weekNumber > 5) {
        console.error("Invalid week:", week);
        return null;
    }

    // Find nth occurrence
    let date = new Date(
        year,
        month - 1,
        1
    );

    let count = 0;

    // A month can never require more than 31 iterations
    for (let i = 0; i < 31; i++) {

        if (date.getDay() === targetDay) {

            count++;

            if (count === weekNumber) {
                return new Date(date);
            }
        }

        date.setDate(date.getDate() + 1);
    }

    console.error(
        "Unable to calculate nth weekday:",
        { year, month, week, weekday }
    );

    return null;
}

function getLastWeekday(year, month, weekday) {

    const weekdays = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6
    };

    const targetDay = weekdays[weekday];

    let date = new Date(
        year,
        month,
        0
    );

    while (date.getDay() !== targetDay) {
        date.setDate(date.getDate() - 1);
    }

    return date;
}

function getEaster(year) {

    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    const month = Math.floor((h + l - 7 * m + 114) / 31);

    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(
        year,
        month - 1,
        day
    );

}

function getElectionDay(year) {

    // November 1
    let date = new Date(year, 10, 1);

    // Find first Monday
    while (date.getDay() !== 1) {
        date.setDate(date.getDate() + 1);
    }

    // Election Day is the Tuesday after
    date.setDate(date.getDate() + 1);

    return date;

}

function getRelativeDate(event, year) {

    let referenceDate;

    switch(event.recurringReference) {

        case "easter":
            referenceDate = getEaster(year);
            break;

        default:
            return null;

    }

    referenceDate.setDate(
        referenceDate.getDate() +
        Number(event.recurringOffsetDays)
    );

    return referenceDate;

}