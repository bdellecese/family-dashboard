const DESIGN_WIDTH = 3840;
const DESIGN_HEIGHT = 2160;


export function scaleDashboard() {

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (!dashboard) {

        return;

    }


    const scaleX =
        window.innerWidth /
        DESIGN_WIDTH;


    const scaleY =
        window.innerHeight /
        DESIGN_HEIGHT;


    const scale =
        Math.min(
            scaleX,
            scaleY
        );


    dashboard.style.transform =
        `scale(${scale})`;

}


export function initializeDashboardScaling() {

    scaleDashboard();


    window.addEventListener(
        "resize",
        scaleDashboard
    );

}