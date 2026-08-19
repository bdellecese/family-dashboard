import {
    startPerformanceTimer
}
from "./performance.js";

import {
    screens,
    screenOrder
}
from "../config/screens.js";

import {
    loadWidget,
    destroyWidget
}
from "./widget-loader.js";


let activeWidgets = [];

let screenLoadGeneration = 0;

let currentScreenIndex = 0;

let rotationTimer = null;


/*
 * ============================================================
 * BUILD REGION
 * ============================================================
 *
 * Builds a region into a detached DOM element.
 *
 * The generation number allows us to determine whether
 * the screen is still current while asynchronous widgets
 * are loading.
 *
 * widgetsForScreen tracks widgets created by this specific
 * screen load so they can be cleaned up if the load becomes
 * stale.
 * ============================================================
 */

async function buildRegion(
    regionName,
    contents,
    generation,
    widgetsForScreen
) {

    const region =
        document.createElement(
            "div"
        );


    region.className =
        regionName;


    /*
     * ========================================================
     * ARRAY = WIDGETS
     * ========================================================
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
                document.createElement(
                    "div"
                );


            container.className =
                `widget ${widget.name}`;


            container.dataset.widget =
                widget.name;


            region.appendChild(
                container
            );


            try {

                await loadWidget(
                    widget.name,
                    container,
                    widget.config
                );

            }

            catch (error) {

                /*
                 * A widget failure should not leave a
                 * partially-created widget behind.
                 */

                await destroyWidget(
                    widget.name,
                    container
                );


                throw error;

            }


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
     * ========================================================
     * OBJECT = NESTED REGIONS
     * ========================================================
     */

    else if (
        contents &&
        typeof contents ===
            "object"
    ) {

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
 * ============================================================
 * DESTROY WIDGET LIST
 * ============================================================
 */

async function destroyWidgetList(
    widgets
) {

    for (
        const widget of widgets
    ) {

        await destroyWidget(
            widget.name,
            widget.container
        );

    }

}


/*
 * ============================================================
 * DESTROY CURRENT SCREEN
 * ============================================================
 */

async function destroyCurrentScreen() {

    const widgetsToDestroy =
        activeWidgets;


    activeWidgets = [];


    await destroyWidgetList(
        widgetsToDestroy
    );

}


/*
 * ============================================================
 * LOAD SCREEN
 * ============================================================
 */

export async function loadScreen(
    screenName
) {

    const screenTimer =
        startPerformanceTimer(
            "screen-load",
            screenName
        );


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


        screenTimer.end({

            success:
                false,

            error:
                "Screen not found"

        });


        return false;

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

        screenTimer.end({

            success:
                false,

            stale:
                true

        });


        return false;

    }


    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (!dashboard) {

        console.error(
            "Dashboard element not found."
        );


        screenTimer.end({

            success:
                false,

            error:
                "Dashboard element not found"

        });


        return false;

    }


    /*
     * ========================================================
     * BUILD THE SCREEN DETACHED FROM THE DASHBOARD
     * ========================================================
     *
     * Do not clear or modify the visible dashboard yet.
     *
     * This prevents a slow-loading screen from leaving the
     * TV blank while widgets are loading.
     */

    const widgetsForScreen =
        [];


    const screenRegions =
        [];


    try {

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

                await destroyWidgetList(
                    widgetsForScreen
                );


                screenTimer.end({

                    success:
                        false,

                    stale:
                        true

                });


                return false;

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

                await destroyWidgetList(
                    widgetsForScreen
                );


                screenTimer.end({

                    success:
                        false,

                    stale:
                        true

                });


                return false;

            }


            screenRegions.push(
                region
            );

        }


        /*
         * ====================================================
         * FINAL GENERATION CHECK
         * ====================================================
         *
         * This is the last opportunity to prevent a stale
         * screen from being committed.
         */

        if (
            generation !==
            screenLoadGeneration
        ) {

            await destroyWidgetList(
                widgetsForScreen
            );


            screenTimer.end({

                success:
                    false,

                stale:
                    true

            });


            return false;

        }


        /*
         * ====================================================
         * COMMIT SCREEN
         * ====================================================
         *
         * Everything has loaded successfully.
         * The screen is still current.
         *
         * Now replace the dashboard contents in one operation.
         */

        dashboard.innerHTML =
            "";


        dashboard.className =
            screen.layout;


        dashboard.dataset.theme =
            screen.theme ||
            "dark";


        for (
            const region of screenRegions
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


        screenTimer.end({

            success:
                true,

            widgetCount:
                widgetsForScreen.length

        });


        return true;

    }

    catch (error) {

        /*
         * Something failed while building the screen.
         *
         * Clean up anything created by this load so we
         * don't leave timers, listeners, or other resources
         * running in the background.
         */

        await destroyWidgetList(
            widgetsForScreen
        );


        screenTimer.end({

            success:
                false,

            error:
                error?.message ||
                String(error)

        });


        console.error(
            `Screen load failed for ${screenName}:`,
            error
        );


        return false;

    }

}


/*
 * ============================================================
 * SHOW CURRENT SCREEN
 * ============================================================
 */

async function showCurrentScreen() {

    if (
        !screenOrder ||
        screenOrder.length === 0
    ) {

        return;

    }


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


    /*
     * Capture the generation BEFORE starting the load.
     *
     * This is important. loadScreen() increments the
     * generation internally, so checking it afterward
     * would not tell us whether another navigation action
     * occurred while the load was running.
     */

    const loadGeneration =
        screenLoadGeneration +
        1;


    const loaded =
        await loadScreen(
            screenName
        );


    /*
     * Do not schedule rotation if:
     *
     * 1. The load failed.
     * 2. Another navigation action started a newer load.
     */

    if (
        !loaded ||
        loadGeneration !==
            screenLoadGeneration
    ) {

        return;

    }


    /*
     * ========================================================
     * DETERMINE SCREEN DURATION
     * ========================================================
     */

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

        /*
         * Numeric durations are interpreted as seconds.
         */

        duration =
            durationConfig *
            1000;

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


    /*
     * Prevent invalid or zero-length timers.
     */

    if (
        !Number.isFinite(
            duration
        ) ||
        duration <= 0
    ) {

        duration =
            15000;

    }


    /*
     * ========================================================
     * SCHEDULE NEXT SCREEN
     * ========================================================
     */

    rotationTimer =
        setTimeout(
            async () => {

                /*
                 * If another screen load has started,
                 * this timer is stale.
                 */

                if (
                    loadGeneration !==
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
 * ============================================================
 * PREVIOUS SCREEN
 * ============================================================
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
     * This is important because the user may click Previous
     * while a widget is still loading.
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
 * ============================================================
 * NEXT SCREEN
 * ============================================================
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
 * ============================================================
 * SCREEN NAVIGATION UI
 * ============================================================
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


    /*
     * Prevent duplicate event listeners if
     * startScreenRotation() is called more than once.
     */

    if (
        dashboardScale.dataset.navigationInitialized ===
        "true"
    ) {

        return;

    }


    dashboardScale.dataset.navigationInitialized =
        "true";


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
 * ============================================================
 * START SCREEN ROTATION
 * ============================================================
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


    if (rotationTimer) {

        clearTimeout(
            rotationTimer
        );


        rotationTimer =
            null;

    }


    currentScreenIndex =
        0;


    initializeScreenNavigation();


    await showCurrentScreen();

}