import {
    screens,
    screenOrder
} from "../config/screens.js";

import {
    loadWidget,
    destroyWidget
} from "./widget-loader.js";


let activeWidgets = [];

let screenLoadGeneration = 0;

let currentScreenIndex = 0;

let rotationTimer = null;


/*
 * BUILD REGION
 *
 * Builds a region into a detached DOM element.
 *
 * The generation number allows us to determine whether
 * the screen is still current while asynchronous widgets
 * are loading.
 */

async function buildRegion(
    regionName,
    contents,
    generation,
    widgetsForScreen
) {

    const region =
        document.createElement("div");


    region.className =
        regionName;


    /*
     * Array = widgets
     */

    if (
        Array.isArray(
            contents
        )
    ) {

        for (
            const widget of contents
        ) {

            /*
             * Stop immediately if another screen has
             * started loading.
             */

            if (
                generation !==
                screenLoadGeneration
            ) {

                return null;

            }


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


            /*
             * The widget may have taken a while to load.
             *
             * Check again before registering it.
             */

            if (
                generation !==
                screenLoadGeneration
            ) {

                /*
                 * The widget loaded after the screen
                 * became stale. Clean it up immediately.
                 */

                await destroyWidget(
                    widget.name,
                    container
                );


                return null;

            }


            widgetsForScreen.push({
                name:
                    widget.name,

                container:
                    container
            });

        }

    }


    /*
     * Object = nested regions
     */

    else {

        for (
            const [
                childName,
                childContents
            ]
            of Object.entries(
                contents
            )
        ) {

            if (
                generation !==
                screenLoadGeneration
            ) {

                return null;

            }


            const child =
                await buildRegion(
                    childName,
                    childContents,
                    generation,
                    widgetsForScreen
                );


            if (
                !child
            ) {

                return null;

            }


            region.appendChild(
                child
            );

        }

    }


    return region;

}


/*
 * DESTROY CURRENT SCREEN
 */

async function destroyCurrentScreen() {

    const widgetsToDestroy =
        activeWidgets;


    activeWidgets = [];


    for (
        const widget of
        widgetsToDestroy
    ) {

        await destroyWidget(
            widget.name,
            widget.container
        );

    }

}


/*
 * LOAD SCREEN
 */

export async function loadScreen(
    screenName
) {

    /*
     * Every load gets a new generation.
     *
     * Any previous screen load is now considered stale.
     */

    const generation =
        ++screenLoadGeneration;


    const screen =
        screens[screenName];


    if (!screen) {

        console.error(
            "Screen not found:",
            screenName
        );

        return;

    }


    /*
     * Stop the current screen's timers/listeners/widgets.
     */

    await destroyCurrentScreen();


    /*
     * The screen may have changed while cleanup
     * was running.
     */

    if (
        generation !==
        screenLoadGeneration
    ) {

        return;

    }


    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (!dashboard) {

        console.error(
            "Dashboard element not found."
        );

        return;

    }


    /*
     * Clear the dashboard BEFORE building the new screen.
     *
     * This ensures every screen starts with a clean DOM.
     */

    dashboard.innerHTML =
        "";


    dashboard.className =
        screen.layout;


    dashboard.dataset.theme =
        screen.theme || "dark";


    /*
     * Keep widgets created by this particular
     * screen load separate from the global list.
     */

    const widgetsForScreen =
        [];


    /*
     * Build the entire screen while it is detached
     * from the dashboard.
     *
     * Nothing gets displayed until all widgets have
     * finished loading.
     */

    const screenRegions =
        [];


    for (
        const [
            regionName,
            contents
        ]
        of Object.entries(
            screen.regions
        )
    ) {

        if (
            generation !==
            screenLoadGeneration
        ) {

            /*
             * Clean up anything this stale screen
             * managed to create.
             */

            for (
                const widget of
                widgetsForScreen
            ) {

                await destroyWidget(
                    widget.name,
                    widget.container
                );

            }


            return;

        }


        const region =
            await buildRegion(
                regionName,
                contents,
                generation,
                widgetsForScreen
            );


        if (
            !region
        ) {

            /*
             * Another screen took over.
             *
             * Clean up widgets belonging to this
             * abandoned screen.
             */

            for (
                const widget of
                widgetsForScreen
            ) {

                await destroyWidget(
                    widget.name,
                    widget.container
                );

            }


            return;

        }


        screenRegions.push(
            region
        );

    }


    /*
     * Final generation check immediately before
     * committing the new screen to the dashboard.
     */

    if (
        generation !==
        screenLoadGeneration
    ) {

        for (
            const widget of
            widgetsForScreen
        ) {

            await destroyWidget(
                widget.name,
                widget.container
            );

        }


        return;

    }


    /*
     * The screen is fully built and still current.
     *
     * Now attach it to the dashboard in one operation.
     */

    for (
        const region of
        screenRegions
    ) {

        dashboard.appendChild(
            region
        );

    }


    /*
     * Only now does this screen become the
     * active screen.
     */

    activeWidgets =
        widgetsForScreen;

}


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


    /*
     * Invalidate any existing rotation timer.
     */

    if (rotationTimer) {

        clearTimeout(
            rotationTimer
        );

        rotationTimer =
            null;

    }


    await loadScreen(
        screenName
    );


    /*
     * loadScreen() may have become stale because
     * another navigation action occurred while it
     * was loading.
     *
     * Only schedule rotation if this screen is still
     * the current one.
     */

    const expectedGeneration =
        screenLoadGeneration;


    if (
        expectedGeneration !==
        screenLoadGeneration
    ) {

        return;

    }


    const durationConfig =
        screen.duration ||
        {
            seconds:
                15
        };


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


    rotationTimer =
        setTimeout(
            async () => {

                /*
                 * If another screen load has started,
                 * this timer is stale.
                 */

                if (
                    expectedGeneration !==
                    screenLoadGeneration
                ) {

                    return;

                }


                currentScreenIndex =
                    (
                        currentScreenIndex +
                        1
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


    /*
     * Invalidate the current screen load immediately.
     *
     * This is important because the user may click
     * Previous while a widget is still loading.
     */

    ++screenLoadGeneration;


    if (rotationTimer) {

        clearTimeout(
            rotationTimer
        );

        rotationTimer =
            null;

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


    /*
     * Invalidate the current screen load immediately.
     */

    ++screenLoadGeneration;


    if (rotationTimer) {

        clearTimeout(
            rotationTimer
        );

        rotationTimer =
            null;

    }


    currentScreenIndex =
        (
            currentScreenIndex +
            1
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


    let hideTimer =
        null;


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
            passive:
                true
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
            passive:
                true
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


    /*
     * Invalidate any previous screen load.
     */

    ++screenLoadGeneration;


    currentScreenIndex =
        0;


    initializeScreenNavigation();


    await showCurrentScreen();

}