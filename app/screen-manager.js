import { screens } from "../config/screens.js";
import { loadWidget } from "./widget-loader.js";


async function buildRegion(
    regionName,
    contents
) {

    const region =
        document.createElement("div");


    region.className =
        regionName;


    // Array = widgets
    if (Array.isArray(contents)) {

        for (const widget of contents) {

            const container =
                document.createElement("div");


            container.className =
                `widget ${widget.name}`;


            container.dataset.widget =
                widget.name;


            region.appendChild(
                container
            );


            await loadWidget(
                widget.name,
                container,
                widget.config
            );

        }

    }


    // Object = nested regions
    else {

        for (const [childName, childContents]
            of Object.entries(contents)) {


            const child =
                await buildRegion(
                    childName,
                    childContents
                );


            region.appendChild(
                child
            );

        }

    }


    return region;

}



export async function loadScreen(
    screenName
) {


    const screen =
        screens[screenName];


    if (!screen) {

        console.error(
            "Screen not found:",
            screenName
        );

        return;

    }


    const dashboard =
        document.getElementById(
            "dashboard"
        );


    dashboard.className =
        screen.layout;


    dashboard.innerHTML =
        "";


    for (const [regionName, contents]
        of Object.entries(screen.regions)) {


        const region =
            await buildRegion(
                regionName,
                contents
            );


        dashboard.appendChild(
            region
        );

    }

}