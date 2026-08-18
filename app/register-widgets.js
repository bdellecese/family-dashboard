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

    await registerWidget(
        "weather",
        "../widgets/weather/weather.js"
    );

    await registerWidget(
        "weather-alerts",
        "../widgets/weather-alerts/weather-alerts.js"
    );

    await registerWidget(
        "large-calendar",
        "../widgets/large-calendar/large-calendar.js"
    );

    await registerWidget(
        "kids-chores",
        "../widgets/kids-chores/kids-chores.js"
    );

        await registerWidget(
        "text",
        "../widgets/text/text.js"
    );

    await registerWidget(
        "household-chores",
        "../widgets/household-chores/household-chores.js"
    );

    await registerWidget(
        "school-lunch",
        "../widgets/school-lunch/school-lunch.js"
    );

    await registerWidget(
        "word-of-day",
        "../widgets/word-of-day/word-of-day.js"
    );

    await registerWidget(
        "quote-of-day",
        "../widgets/quote-of-day/quote-of-day.js"
    );

    await registerWidget(
        "dad-wisdom",
        "../widgets/dad-wisdom/dad-wisdom.js"
    );

    await registerWidget(
        "playing-time",
        "../widgets/playing-time/playing-time.js"
    );

    await registerWidget(
        "on-this-day",
        "../widgets/on-this-day/on-this-day.js"
    );

    await registerWidget(
        "did-you-know",
        "../widgets/did-you-know/did-you-know.js"
    );

    await registerWidget(
        "photo",
        "../widgets/photo/photo.js"
    );

    await registerWidget(
        "sonos-status",
        "../widgets/sonos-status/sonos-status.js"
    );

    await registerWidget(
        "sports-scoreboard",
        "../widgets/sports-scoreboard/sports-scoreboard.js"
    );

    await registerWidget(
        "sports-standings",
        "../widgets/sports-standings/sports-standings.js"
    );

    await registerWidget(
        "on-this-day-sports",
        "../widgets/on-this-day-sports/on-this-day-sports.js"
    );

    await registerWidget(
        "sports-legends",
        "../widgets/sports-legends/sports-legends.js"
    );

}