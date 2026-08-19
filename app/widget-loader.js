import {
    startPerformanceTimer
}
from "./performance.js";


const widgets = {};

const widgetCleanups = new WeakMap();


/*
 * ============================================================
 * REGISTER WIDGET
 * ============================================================
 */

export async function registerWidget(
    name,
    path
) {

    const timer =
        startPerformanceTimer(
            "widget-register",
            name,
            {
                path
            }
        );


    try {

        const module =
            await import(path);


        widgets[name] =
            module.default;


        timer.end({

            success:
                true

        });

    }

    catch (error) {

        timer.end({

            success:
                false,

            error:
                error?.message ||
                String(error)

        });


        throw error;

    }

}


/*
 * ============================================================
 * LOAD WIDGET
 * ============================================================
 */

export async function loadWidget(
    name,
    container,
    config = {}
) {

    const widget =
        widgets[name];


    if (!widget) {

        console.warn(
            "Widget not registered:",
            name
        );

        return;

    }


    /*
     * Make sure this container does not retain
     * a cleanup function from an earlier widget.
     */

    widgetCleanups.delete(
        container
    );


    /*
     * ========================================================
     * INSTRUMENT WIDGET RENDER
     *
     * Measures the complete widget.render() operation,
     * including any asynchronous data/API work performed
     * by the widget.
     * ========================================================
     */

    const timer =
        startPerformanceTimer(
            "widget-render",
            name
        );


    try {

        const cleanup =
            await widget.render(
                container,
                config
            );


        /*
         * Widgets may return a cleanup function
         * from render().
         */

        if (
            typeof cleanup ===
            "function"
        ) {

            widgetCleanups.set(
                container,
                cleanup
            );

        }


        timer.end({

            success:
                true

        });

    }

    catch (error) {

        timer.end({

            success:
                false,

            error:
                error?.message ||
                String(error)

        });


        console.error(
            `Widget render failed for ${name}:`,
            error
        );


        throw error;

    }

}


/*
 * ============================================================
 * DESTROY WIDGET
 * ============================================================
 */

export async function destroyWidget(
    name,
    container
) {

    const timer =
        startPerformanceTimer(
            "widget-destroy",
            name
        );


    let success =
        true;


    /*
     * ========================================================
     * CLEANUP FUNCTION
     * ========================================================
     */

    const cleanup =
        widgetCleanups.get(
            container
        );


    if (
        typeof cleanup ===
        "function"
    ) {

        try {

            await cleanup();

        }

        catch (error) {

            success =
                false;


            console.error(
                `Widget cleanup failed for ${name}:`,
                error
            );

        }

    }


    widgetCleanups.delete(
        container
    );


    /*
     * ========================================================
     * TRADITIONAL DESTROY METHOD
     * ========================================================
     */

    const widget =
        widgets[name];


    if (
        widget &&
        typeof widget.destroy ===
        "function"
    ) {

        try {

            await widget.destroy(
                container
            );

        }

        catch (error) {

            success =
                false;


            console.error(
                `Widget destroy failed for ${name}:`,
                error
            );

        }

    }


    /*
     * ========================================================
     * PERFORMANCE RECORD
     * ========================================================
     */

    timer.end({

        success

    });

}