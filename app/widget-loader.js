const widgets = {};

const widgetCleanups = new WeakMap();

export async function registerWidget(
    name,
    path
) {

    const module =
        await import(path);


    widgets[name] =
        module.default;

}


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


    const cleanup =
        await widget.render(
            container,
            config
        );


    /*
     * Widgets may return a cleanup function
     * from render().
     *
     * Store it so destroyWidget() can call it
     * when the screen changes.
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

}


export async function destroyWidget(
    name,
    container
) {

    const widget =
        widgets[name];


    /*
     * First run the cleanup function returned
     * by render(), if one exists.
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
     * Keep support for widgets that implement
     * a traditional widget.destroy() method.
     */

    if (!widget) {

        return;

    }


    if (
        typeof widget.destroy ===
        "function"
    ) {

        await widget.destroy(
            container
        );

    }

}