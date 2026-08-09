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