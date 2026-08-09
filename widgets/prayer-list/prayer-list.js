import {
    getSheetRows
} from "../../services/google-sheets/sheets.js";


const SHEET_NAME =
    "PrayerList";


const prayerList = {

    async render(container) {

        container.innerHTML = "";


        const wrapper =
            document.createElement("div");


        wrapper.className =
            "prayer-list-widget";


        container.appendChild(
            wrapper
        );


        const rows =
            await getSheetRows(
                SHEET_NAME
            );


        const names = [];


        for (const row of rows) {

            const value =
                row.c?.[0]?.v;


            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                names.push(
                    String(value).trim()
                );

            }

        }


        const title =
            document.createElement("div");


        title.className =
            "prayer-list-widget__title";


        title.textContent =
            "Prayer List";


        wrapper.appendChild(
            title
        );


        const list =
            document.createElement("div");


        list.className =
            "prayer-list-widget__list";


        wrapper.appendChild(
            list
        );

        names.forEach(
    name => {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "prayer-list-widget__item";


        const icon =
            document.createElement(
                "i"
            );


        icon.className =
            "fa-fw fa-solid fa-praying-hands";


        item.appendChild(
            icon
        );


        const text =
            document.createElement(
                "span"
            );


        text.textContent =
            name;


        item.appendChild(
            text
        );


        list.appendChild(
            item
        );

    }
);


        

    }

};


export default prayerList;