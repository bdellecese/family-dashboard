import {
    registerWidget
}
from "./widget-loader.js";


export async function registerWidgets() {


    await registerWidget(
        "countdown",
        "../widgets/countdown/countdown.js"
    );

    await registerWidget(
        "date-time",
        "../widgets/date-time/date-time.js"
    );

    await registerWidget(
        "family-menu",
        "../widgets/family-menu/family-menu.js"
    );

    await registerWidget(
        "prayer-list",
        "../widgets/prayer-list/prayer-list.js"
    );

    await registerWidget(
        "wifi",
        "../widgets/wifi/wifi.js"
    );

    await registerWidget(
        "calendar-list",
        "../widgets/calendar-list/calendar-list.js"
    );

    await registerWidget(
        "calendar",
        "../widgets/calendar/calendar.js"
    );

    await registerWidget(
        "news",
        "../widgets/news/news.js"

    );

}