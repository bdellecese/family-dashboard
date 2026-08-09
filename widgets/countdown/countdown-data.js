import { getSheetRows } from "../../services/google-sheets/sheets.js";


function parseGoogleDate(value) {

    if (!value) {
        return "";
    }


    // Google returns Date(YYYY,M,D)
    const match = value.match(
        /Date\((\d+),(\d+),(\d+)\)/
    );


    if (match) {

        const year = match[1];

        const month = String(
            Number(match[2]) + 1
        ).padStart(2, "0");


        const day = String(
            match[3]
        ).padStart(2, "0");


        return `${year}-${month}-${day}`;

    }


    return value;

}


export async function getCountdownEvents() {

    try {

        const rows =
            await getSheetRows(
                "Countdown"
            );


        return rows.map(row => {

            const cells = row.c;


            return {

                event:
                    cells[0]?.v || "",


                date:
                    parseGoogleDate(
                        cells[1]?.v
                    ),


                enabled:
                    cells[2]?.v === true,


                type:
                    cells[3]?.v || "event",


                image:
                    cells[4]?.v || "",


                recurring:
                    cells[5]?.v === true,


                recurringRule:
                    cells[6]?.v || "",


                recurringMonth:
                    String(
                        cells[7]?.v || ""
                    ).trim(),


                recurringWeek:
                    String(
                        cells[8]?.v || ""
                    ).trim(),


                recurringWeekday:
                    String(
                        cells[9]?.v || ""
                    ).trim(),


                recurringOffsetDays:
                    String(
                        cells[10]?.v || ""
                    ).trim(),


                recurringReference:
                    String(
                        cells[11]?.v || ""
                    ).trim()

            };

        });


    } catch (error) {

        console.error(
            "Unable to load countdown events:",
            error
        );


        return [];

    }

}