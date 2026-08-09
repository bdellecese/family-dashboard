import {
    registerWidgets
}
from "./register-widgets.js";


import {
    loadScreen
}
from "./screen-manager.js";



document.addEventListener(
    "DOMContentLoaded",
    async () => {


        await registerWidgets();


        await loadScreen(
            "information"
        );


    }
);