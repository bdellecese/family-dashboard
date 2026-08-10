import {
    getCalendars,
    getEventsForRange
} from "./calendar-data.js";


export function createCalendarTestButton(
    container
) {

    const button =
        document.createElement("button");


    button.textContent =
        "Connect Google Calendar";


    button.style.position =
        "fixed";

    button.style.top =
        "20px";

    button.style.right =
        "20px";

    button.style.zIndex =
        "99999";

    button.style.padding =
        "12px 20px";

    button.style.fontSize =
        "16px";


    button.addEventListener(
        "click",
        async () => {

            button.disabled =
                true;

            button.textContent =
                "Connecting...";


            try {

                /*
                 * GET CALENDARS
                 */

                const calendars =
                    await getCalendars();


                console.log(
                    "Google Calendar authentication successful."
                );


                console.table(

                    calendars.map(
                        calendar => ({

                            id:
                                calendar.id,

                            name:
                                calendar.name,

                            primary:
                                calendar.primary,

                            accessRole:
                                calendar.accessRole,

                            color:
                                calendar.color

                        })
                    )

                );


                /*
                 * FIND PRIMARY CALENDAR
                 */

                const primaryCalendar =
                    calendars.find(
                        calendar =>
                            calendar.primary === true
                    );


                /*
                 * GET EVENTS
                 */

                if (
                    primaryCalendar
                ) {

                    const start =
                        new Date();


                    const end =
                        new Date();


                    end.setDate(
                        end.getDate() + 14
                    );


                    const events =
                        await getEventsForRange(
                            primaryCalendar.id,
                            start,
                            end
                        );


                    console.log(
                        "Events for next 14 days:"
                    );


                    

                    console.table(

                        events.map(
                            event => ({

                                title:
                                    event.title,

                                start:
                                    event.start,

                                end:
                                    event.end,

                                location:
                                    event.location

                            })
                        )

                    );

                }


                button.textContent =
                    "Google Calendar Connected";

            }


            catch (error) {

                console.error(
                    "Google Calendar test failed:",
                    error
                );


                button.disabled =
                    false;

                button.textContent =
                    "Try Again";

            }

        }
    );


    container.appendChild(
        button
    );

}