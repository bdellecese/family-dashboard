import {
    initializeDashboardScaling
} from "../services/dashboard/dashboard-scale.js";

import {
    registerWidgets
} from "./register-widgets.js";

import {
    startScreenRotation
} from "./screen-manager.js";


initializeDashboardScaling();


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await registerWidgets();

        await startScreenRotation();

    }
);