const DESIGN_WIDTH =
    3840;

const DESIGN_HEIGHT =
    2160;

const NAV_RAIL_WIDTH =
    52;


export function scaleDashboard() {

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (!dashboard) {

        return;

    }


    /*
     * ========================================================
     * AVAILABLE DASHBOARD SPACE
     * ========================================================
     *
     * The navigation rail occupies the left side of the
     * physical display.
     *
     * The dashboard should therefore scale only within the
     * remaining space.
     * ========================================================
     */

    const availableWidth =
        Math.max(
            0,
            window.innerWidth -
            NAV_RAIL_WIDTH
        );


    const scaleX =
        availableWidth /
        DESIGN_WIDTH;


    const scaleY =
        window.innerHeight /
        DESIGN_HEIGHT;


    const scale =
        Math.min(
            scaleX,
            scaleY
        );


    /*
     * ========================================================
     * SCALE DASHBOARD
     * ========================================================
     */

    dashboard.style.transform =
        `scale(${scale})`;


    /*
     * ========================================================
     * POSITION DASHBOARD
     * ========================================================
     *
     * Keep the scaled dashboard aligned to the top-left of
     * the area remaining after the navigation rail.
     * ========================================================
     */

    dashboard.style.transformOrigin =
        "top left";

}


export function initializeDashboardScaling() {

    scaleDashboard();


    window.addEventListener(
        "resize",
        scaleDashboard
    );

}