import {
    prepareEvents
}
from "./countdown-utils.js";

import {
    COUNTDOWN_CONFIG
}
from "./config.js";


import {
    getCountdownEvents
}
from "./countdown-data.js";



function getSpecialCountdown(event) {

    let prefix = "";


    switch(event.type) {

        case "birthday":
            prefix = "🎂 ";
            break;

        case "trip":
            prefix = "✈️ ";
            break;

        case "sports":
            prefix = "🏆 ";
            break;

        case "holiday":
            prefix = "🎉 ";
            break;

        default:
            prefix = "";

    }


    if (event.days === 0) {

        return `${prefix}TODAY!`;

    }


    if (event.days === 1) {

        return `${prefix}TOMORROW!`;

    }


    return "";

}



export default {

    name: "countdown",


    async render(container) {

        container.innerHTML = "";

        const countdownContainer =
        document.createElement("div");


        countdownContainer.className =
        "countdown-container";

        container.appendChild(
            countdownContainer
        );

        const sourceEvents =
            await getCountdownEvents();

        const events =
            prepareEvents(sourceEvents)
            .slice(
                0,
                COUNTDOWN_CONFIG.maxEvents
            );

        if (COUNTDOWN_CONFIG.debug) {

            console.table(events);

        }

        events.forEach(event => {

            const slot =
                document.createElement(
                    "div"
                );

            slot.className =
                "countdown-slot";

            slot.innerHTML = `

                <div class="countdown-image-frame">

                    <img
                        class="countdown-image"
                        src="${event.image}"
                    >

                </div>


                <div class="event-name">

                    ${event.event}

                </div>


                <div class="countdown-text">

                ${
                    event.days <= 1

                    ?

                    `
                    <div class="special-countdown">
                        ${getSpecialCountdown(event)}
                    </div>
                    `

                    :

                    `

                    <div class="countdown-number">
                        ${event.days}
                    </div>


                    <div class="countdown-label">

                        DAYS

                    </div>

                    `

                }

                </div>
            `;

            countdownContainer.appendChild(slot);
        });
    }
};