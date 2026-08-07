import { screens } from "../config/screens.js";


export function loadScreen(screenName) {

    const screen = screens[screenName];

    if (!screen) {

        console.error(
            "Screen not found:",
            screenName
        );

        return;

    }


    const container =
        document.getElementById("dashboard");


    container.className =
        screen.layout;


    container.innerHTML = "";


    screen.widgets.forEach(widget => {


        const div =
            document.createElement("div");


        div.className =
            widget.className;


        div.dataset.widget =
            widget.name;


        div.innerHTML =
            `
            <div class="placeholder">
                ${widget.name}
            </div>
            `;


        container.appendChild(div);

    });

}