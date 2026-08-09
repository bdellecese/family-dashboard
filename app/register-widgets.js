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

}