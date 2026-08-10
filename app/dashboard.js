import {
    initializeDashboardScaling
} from "../services/dashboard/dashboard-scale.js";

import {
    registerWidgets
} from "./register-widgets.js";

import {
    startScreenRotation
} from "./screen-manager.js";

import {
    createCalendarTestButton
} from "../services/google-calendar/test-calendar-auth.js";

createCalendarTestButton(
    document.body
);

initializeDashboardScaling();


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await registerWidgets();

        await startScreenRotation();

    }
);