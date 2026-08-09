const widgets = {};

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


    await widget.render(
        container,
        config
    );

}

export async function destroyWidget(
    name,
    container
) {

    const widget =
        widgets[name];


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