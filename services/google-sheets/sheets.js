const GOOGLE_SHEET_ID =
    "1LxStcCNQLawP81a4fiNdVTtxW7XA0ejR9ENyJ7dzG0I";


export async function getSheetRows(sheetName) {

    try {

        const url =
            `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;


        const response =
            await fetch(url);


        const text =
            await response.text();


        const json =
            JSON.parse(

                text.substring(

                    text.indexOf("{"),

                    text.lastIndexOf("}") + 1

                )

            );


        return json.table.rows;


    } catch(error) {

        console.error(
            "Unable to load Google Sheet:",
            error
        );

        return [];

    }

}