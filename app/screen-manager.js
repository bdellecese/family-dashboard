import {
    screens,
    screenOrder
} from "../config/screens.js";

import {
    loadWidget,
    destroyWidget
} from "./widget-loader.js";


let activeWidgets = [];

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

            activeWidgets.push({
                name: widget.name,
                container: container
            });

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

async function destroyCurrentScreen() {

    for (
        const widget of activeWidgets
    ) {

        await destroyWidget(
            widget.name,
            widget.container
        );

    }


    activeWidgets = [];

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

    await destroyCurrentScreen();


    const dashboard =
        document.getElementById(
            "dashboard"
        );


    dashboard.className =
        screen.layout;


    dashboard.dataset.theme =
        screen.theme || "dark";


    dashboard.innerHTML =
        "";


    for (
        const [regionName, contents]
        of Object.entries(
            screen.regions
        )
    ) {

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

let currentScreenIndex = 0;

let rotationTimer = null;


/*
 * SHOW CURRENT SCREEN
 */

async function showCurrentScreen() {

    const screenName =
        screenOrder[
            currentScreenIndex
        ];


    const screen =
        screens[screenName];


    if (!screen) {

        console.error(
            "Screen not found:",
            screenName
        );

        return;

    }


    await loadScreen(
        screenName
    );


    const durationConfig =
        screen.duration || { seconds: 15 };


    let duration;


    if (
        typeof durationConfig ===
        "number"
    ) {

        duration =
            durationConfig;

    }


    else if (
        durationConfig.minutes
    ) {

        duration =
            durationConfig.minutes *
            60 *
            1000;

    }


    else if (
        durationConfig.seconds
    ) {

        duration =
            durationConfig.seconds *
            1000;

    }


    else {

        duration =
            15000;

    }


    if (rotationTimer) {

        clearTimeout(
            rotationTimer
        );

    }


    rotationTimer =
        setTimeout(
            async () => {

                currentScreenIndex =
                    (
                        currentScreenIndex + 1
                    )
                    %
                    screenOrder.length;


                await showCurrentScreen();

            },
            duration
        );

}


/*
 * PREVIOUS SCREEN
 */

export async function previousScreen() {

    if (
        !screenOrder ||
        screenOrder.length === 0
    ) {

        return;

    }


    currentScreenIndex =
        (
            currentScreenIndex -
            1 +
            screenOrder.length
        )
        %
        screenOrder.length;


    await showCurrentScreen();

}


/*
 * NEXT SCREEN
 */

export async function nextScreen() {

    if (
        !screenOrder ||
        screenOrder.length === 0
    ) {

        return;

    }


    currentScreenIndex =
        (
            currentScreenIndex + 1
        )
        %
        screenOrder.length;


    await showCurrentScreen();

}


/*
 * SCREEN NAVIGATION UI
 */

function initializeScreenNavigation() {

    const dashboardScale =
        document.getElementById(
            "dashboard-scale"
        );


    const previousButton =
        document.getElementById(
            "prev-screen"
        );


    const nextButton =
        document.getElementById(
            "next-screen"
        );


    if (
        !dashboardScale ||
        !previousButton ||
        !nextButton
    ) {

        console.error(
            "Screen navigation controls not found."
        );

        return;

    }


    let hideTimer = null;


    function showNavigation() {

        dashboardScale.classList.add(
            "screen-navigation-visible"
        );


        if (hideTimer) {

            clearTimeout(
                hideTimer
            );

        }


        hideTimer =
            setTimeout(
                () => {

                    dashboardScale.classList.remove(
                        "screen-navigation-visible"
                    );

                },
                10000
            );

    }


    previousButton.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            showNavigation();

            await previousScreen();

        }
    );


    nextButton.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            showNavigation();

            await nextScreen();

        }
    );


    /*
     * Reveal controls after touch.
     */

    window.addEventListener(
        "touchstart",
        showNavigation,
        {
            passive: true
        }
    );


    /*
     * Reveal controls while developing
     * with a mouse.
     */

    window.addEventListener(
        "mousemove",
        showNavigation,
        {
            passive: true
        }
    );

}


/*
 * START SCREEN ROTATION
 */

export async function startScreenRotation() {

    if (
        !screenOrder ||
        screenOrder.length === 0
    ) {

        console.error(
            "No screens configured."
        );

        return;

    }


    currentScreenIndex = 0;


    initializeScreenNavigation();


    await showCurrentScreen();

}
