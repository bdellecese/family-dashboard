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
    startPerformanceTimer
} from "./performance.js";


initializeDashboardScaling();


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const startupTimer =
            startPerformanceTimer(
                "application-startup",
                "dashboard"
            );


        try {

            await registerWidgets();

            await startScreenRotation();


            startupTimer.end({

                success:
                    true

            });

        }

        catch (error) {

            startupTimer.end({

                success:
                    false,

                error:
                    error?.message ||
                    String(error)

            });


            console.error(
                "Application startup failed:",
                error
            );

        }

    }
);