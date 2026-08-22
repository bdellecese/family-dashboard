/*
 * ============================================================
 * SCHOOL LUNCH DATA SERVICE
 * ============================================================
 *
 * Google Sheet:
 *
 *     SchoolLunch
 *
 * The sheet defines:
 *
 *     - school year
 *     - PDF date ranges
 *     - elementary / middle PDF
 *     - high school PDF
 *
 * Each PDF is parsed according to THE MONTH IT REPRESENTS.
 *
 * Example:
 *
 *     Monday  8/31  -> August PDF
 *     Tuesday 9/1   -> September PDF
 *
 * ------------------------------------------------------------
 * CACHE
 * ------------------------------------------------------------
 *
 * We DO NOT cache the raw PDF.
 *
 * The PDF is downloaded, parsed, and the resulting menu data
 * is cached under:
 *
 *     data/school-lunch/
 *
 * This means subsequent requests can use the parsed JSON
 * without downloading or parsing the PDF again.
 *
 * ============================================================
 */

import {
    getSheetRows
} from "../google-sheets/sheets.js";

import {
    getDocument
} from "pdfjs-dist/legacy/build/pdf.mjs";

import fs from "node:fs/promises";

import path from "node:path";

import {
    fileURLToPath
} from "node:url";


const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


const STANDARD_FONT_DATA_URL =
    path.join(
        process.cwd(),
        "node_modules/pdfjs-dist/standard_fonts/"
    );

const SCHOOL_LUNCH_SHEET =
    "SchoolLunch";


const DEFAULT_NO_SCHOOL =
    "NO SCHOOL";


/*
 * ============================================================
 * CACHE
 * ============================================================
 */

const CACHE_DIR =
    path.resolve(
        __dirname,
        "../../data/school-lunch"
    );


/*
 * ============================================================
 * PDF LAYOUT
 * ============================================================
 */

const MENU_START_Y =
    500;


const MENU_END_Y =
    60;


const WEEKDAY_COLUMNS = [
    {
        day:
            "Monday",

        centerX:
            116
    },

    {
        day:
            "Tuesday",

        centerX:
            251
    },

    {
        day:
            "Wednesday",

        centerX:
            394
    },

    {
        day:
            "Thursday",

        centerX:
            531
    },

    {
        day:
            "Friday",

        centerX:
            672
    }
];


const COLUMN_TOLERANCE =
    65;


const Y_TOLERANCE =
    3;


/*
 * A normal menu line is approximately 13-15 PDF units
 * below the previous line.
 *
 * A new menu block is separated by a much larger gap.
 */

const CALENDAR_ROW_GAP =
    15;


/*
 * ============================================================
 * PUBLIC API
 * ============================================================
 */

const schoolLunchData = {

    async getWeeklyMenu(
        weekStart
    ) {

        const monday =
            startOfDay(
                weekStart
            );


        console.log(
            "\n============================================================"
        );

        console.log(
            "SCHOOL LUNCH"
        );

        console.log(
            "============================================================"
        );

        console.log(
            `Requested week: ${formatDate(monday)}`
        );


        /*
         * ----------------------------------------------------
         * LOAD GOOGLE SHEET
         * ----------------------------------------------------
         */

        const sheet =
            await loadSchoolLunchSheet();


        /*
         * ----------------------------------------------------
         * SCHOOL YEAR
         * ----------------------------------------------------
         */

        if (
            !sheet.schoolYear
        ) {

            return {

                available:
                    false,

                message:
                    "School lunch calendar is not configured.",

                weekStart:
                    formatDate(
                        monday
                    ),

                days:
                    []

            };

        }


        /*
         * ----------------------------------------------------
         * WEEK OUTSIDE SCHOOL YEAR
         * ----------------------------------------------------
         */

        if (
            !weekOverlapsRange(
                monday,
                sheet.schoolYear.start,
                sheet.schoolYear.end
            )
        ) {

            return {

                available:
                    false,

                message:
                    "School is not in session.",

                weekStart:
                    formatDate(
                        monday
                    ),

                days:
                    []

            };

        }


        /*
         * ----------------------------------------------------
         * FIND EVERY PDF THAT OVERLAPS THE WEEK
         * ----------------------------------------------------
         */

        const menuRows =
            sheet.menus.filter(
                menu =>
                    weekOverlapsRange(
                        monday,
                        menu.start,
                        menu.end
                    )
            );


        if (
            menuRows.length === 0
        ) {

            return {

                available:
                    false,

                message:
                    "School lunch menu not yet available.",

                weekStart:
                    formatDate(
                        monday
                    ),

                days:
                    []

            };

        }


        /*
         * ----------------------------------------------------
         * MENU MAPS
         * ----------------------------------------------------
         */

        const elementaryMenus =
            new Map();


        const highSchoolMenus =
            new Map();


        /*
         * ----------------------------------------------------
         * LOAD EVERY APPLICABLE PDF
         * ----------------------------------------------------
         */

        for (
            const menu of menuRows
        ) {

            const pdfYear =
                menu.start.getFullYear();


            const pdfMonth =
                menu.start.getMonth() + 1;


            /*
             * ------------------------------------------------
             * ELEMENTARY / MIDDLE
             * ------------------------------------------------
             */

            if (
                menu.elementaryMiddleUrl
            ) {

                const parsed =
                    await getPdfMenu(
                        menu.elementaryMiddleUrl,
                        menu,
                        pdfYear,
                        pdfMonth,
                        "elementary-middle"
                    );


                mergeMenuData(
                    elementaryMenus,
                    parsed
                );

            }


            /*
             * ------------------------------------------------
             * HIGH SCHOOL
             * ------------------------------------------------
             */

            if (
                menu.highSchoolUrl
            ) {

                const parsed =
                    await getPdfMenu(
                        menu.highSchoolUrl,
                        menu,
                        pdfYear,
                        pdfMonth,
                        "high-school"
                    );


                mergeMenuData(
                    highSchoolMenus,
                    parsed
                );

            }

        }


        console.log(
            `School lunch parsed: ${elementaryMenus.size} elementary dates, ` +
            `${highSchoolMenus.size} high school dates`
        );


        /*
         * ----------------------------------------------------
         * BUILD MONDAY-FRIDAY
         * ----------------------------------------------------
         */

        const days = [];


        for (
            let index = 0;
            index < 5;
            index++
        ) {

            const date =
                new Date(
                    monday
                );


            date.setDate(
                monday.getDate() +
                index
            );


            const dateKey =
                formatDate(
                    date
                );


            /*
             * ------------------------------------------------
             * OUTSIDE SCHOOL YEAR
             * ------------------------------------------------
             */

            const inSchoolYear =
                date >=
                    sheet.schoolYear.start &&

                date <=
                    sheet.schoolYear.end;


            if (
                !inSchoolYear
            ) {

                days.push(
                    createDay(
                        date,
                        [DEFAULT_NO_SCHOOL],
                        [DEFAULT_NO_SCHOOL]
                    )
                );

                continue;

            }


            /*
             * ------------------------------------------------
             * KNOWN HOLIDAYS
             * ------------------------------------------------
             */

            const holiday =
                getSchoolHoliday(
                    date
                );


            if (
                holiday
            ) {

                days.push(
                    createDay(
                        date,
                        [holiday],
                        [holiday]
                    )
                );

                continue;

            }


            /*
             * ------------------------------------------------
             * MENU LOOKUP
             * ------------------------------------------------
             */

            const elementary =
                elementaryMenus.get(
                    dateKey
                );


            const highSchool =
                highSchoolMenus.get(
                    dateKey
                );


            days.push(
                createDay(
                    date,
                    elementary || [],
                    highSchool || []
                )
            );

        }


        /*
         * ----------------------------------------------------
         * DETERMINE WHETHER WE FOUND ANY MENU
         * ----------------------------------------------------
         */

        const hasMenu =
            days.some(
                day =>
                    day.elementaryMiddle.length > 0 ||
                    day.highSchool.length > 0
            );


        if (
            !hasMenu
        ) {

            return {

                available:
                    false,

                message:
                    "School lunch menu not yet available.",

                weekStart:
                    formatDate(
                        monday
                    ),

                days:
                    []

            };

        }


        return {

            available:
                true,

            year:
                monday.getFullYear(),

            month:
                monday.getMonth() + 1,

            weekStart:
                formatDate(
                    monday
                ),

            days,

            schools:
                {}

        };

    }

};


export default schoolLunchData;


/*
 * ============================================================
 * PDF CACHE
 * ============================================================
 *
 * Cache key:
 *
 *     school-type / year-month / hash(url)
 *
 * We use a hash rather than putting the entire URL into the
 * filename because URLs can contain characters that are not
 * appropriate for filenames.
 *
 * ============================================================
 */

async function getPdfMenu(
    url,
    menu,
    year,
    month,
    schoolType
) {

    const cacheFile =
        getCacheFilePath(
            url,
            year,
            month,
            schoolType
        );


    /*
     * --------------------------------------------------------
     * TRY CACHE FIRST
     * --------------------------------------------------------
     */

    const cached =
        await readCachedMenu(
            cacheFile
        );


    if (
        cached
    ) {

        console.log(
            `School lunch cache hit: ${path.relative(process.cwd(), cacheFile)}`
        );

        return cached;

    }


    /*
     * --------------------------------------------------------
     * CACHE MISS
     * --------------------------------------------------------
     */

    console.log(
        `School lunch cache miss: ${path.relative(process.cwd(), cacheFile)}`
    );


    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Failed to download school lunch PDF: ${response.status} ${response.statusText}`
        );

    }


    const buffer =
        Buffer.from(
            await response.arrayBuffer()
        );


    const loadingTask =
        getDocument({
            data:
                new Uint8Array(
                    buffer
                ),

            standardFontDataUrl:
                STANDARD_FONT_DATA_URL
        });

    const pdf =
        await loadingTask.promise;


    const pages = [];


    try {

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(
                    pageNumber
                );


            const content =
                await page.getTextContent();


            const items =
                content.items

                    .filter(
                        item =>
                            typeof item.str ===
                                "string" &&

                            item.str.trim()
                    )

                    .map(
                        item => {

                            const x =
                                item.transform?.[4] ??
                                0;


                            const y =
                                item.transform?.[5] ??
                                0;


                            const width =
                                item.width ??
                                0;


                            const height =
                                item.height ??
                                0;


                            return {

                                text:
                                    item.str.trim(),

                                x,

                                y,

                                width,

                                height,

                                centerX:
                                    x +
                                    width / 2

                            };

                        }
                    );


            pages.push(
                items
            );

        }

    }

    finally {

        await pdf.destroy();

    }


    /*
     * --------------------------------------------------------
     * PARSE PDF
     * --------------------------------------------------------
     */

    const parsed =
        parsePdfMenu(
            pages,
            menu,
            year,
            month
        );


    /*
     * --------------------------------------------------------
     * WRITE CACHE
     * --------------------------------------------------------
     */

    await writeCachedMenu(
        cacheFile,
        parsed,
        {
            url,
            schoolType,
            year,
            month,
            menuName:
                menu.name,
            cachedAt:
                new Date().toISOString()
        }
    );


    return parsed;

}


/*
 * ============================================================
 * CACHE FILE PATH
 * ============================================================
 *
 * Cache structure:
 *
 *     data/
 *     └── school-lunch/
 *         └── YYYY-MM/
 *             ├── elementary-middle.json
 *             └── high-school.json
 *
 * We intentionally do NOT cache the raw PDF.
 *
 * The cache contains only the parsed menu data.
 *
 * ============================================================
 */

function getCacheFilePath(
    url,
    year,
    month,
    schoolType
) {

    const monthDirectory =
        path.join(
            CACHE_DIR,
            `${year}-${String(month).padStart(2, "0")}`
        );


    const filename =
        `${schoolType}.json`;


    return path.join(
        monthDirectory,
        filename
    );

}


/*
 * ============================================================
 * READ CACHED MENU
 * ============================================================
 */

async function readCachedMenu(
    cacheFile
) {

    try {

        const contents =
            await fs.readFile(
                cacheFile,
                "utf8"
            );


        const cached =
            JSON.parse(
                contents
            );


        /*
         * Cache files contain:
         *
         * {
         *     metadata: {...},
         *     data: [...]
         * }
         */

        if (
            !cached ||
            !Array.isArray(
                cached.data
            )
        ) {

            return null;

        }


        return cached.data;

    }

    catch (
        error
    ) {

        /*
         * ENOENT is normal on a cache miss.
         *
         * Other errors are also treated as cache misses so
         * that a corrupt cache cannot prevent the PDF from
         * being downloaded and reparsed.
         */

        return null;

    }

}


/*
 * ============================================================
 * WRITE CACHED MENU
 * ============================================================
 */

async function writeCachedMenu(
    cacheFile,
    data,
    metadata
) {

    try {

        await fs.mkdir(
            path.dirname(cacheFile),
            {
                recursive: true
            }
        );


        const payload = {

            metadata,

            data

        };


        await fs.writeFile(
            cacheFile,
            JSON.stringify(
                payload,
                null,
                2
            ),
            "utf8"
        );


        console.log(
            `School lunch cache written: ${path.relative(
                process.cwd(),
                cacheFile
            )}`
        );

    }

    catch (
        error
    ) {

        console.warn(
            "Unable to write school lunch cache:",
            error.message
        );

    }

}


/*
 * ============================================================
 * LOAD GOOGLE SHEET
 * ============================================================
 */

async function loadSchoolLunchSheet() {

    const rows =
        await getSheetRows(
            SCHOOL_LUNCH_SHEET
        );


    if (
        !rows ||
        rows.length === 0
    ) {

        throw new Error(
            "SchoolLunch Google Sheet is empty."
        );

    }


    const columns = {

        type:
            0,

        name:
            1,

        "start date":
            2,

        "end date":
            3,

        "elementary/middle url":
            4,

        "high school url":
            5

    };


    const schoolYearRows = [];


    const menuRows = [];


    for (
        let index = 0;
        index < rows.length;
        index++
    ) {

        const row =
            rows[index]?.c || [];


        const type =
            getCellValue(
                row,
                columns.type
            )
            .toLowerCase();


        if (
            type ===
            "school-year"
        ) {

            const parsed =
                parseSchoolYear(
                    row,
                    columns
                );


            schoolYearRows.push(
                parsed
            );

        }


        if (
            type ===
            "menu"
        ) {

            const parsed =
                parseMenuRow(
                    row,
                    columns
                );


            menuRows.push(
                parsed
            );

        }

    }


    /*
     * --------------------------------------------------------
     * SELECT SCHOOL YEAR
     * --------------------------------------------------------
     */

    const today =
        startOfDay(
            new Date()
        );


    const validSchoolYears =
        schoolYearRows.filter(
            item =>
                item.start &&
                item.end
        );


    const schoolYear =
        validSchoolYears.find(
            item =>
                today >= item.start &&
                today <= item.end
        ) ||

        validSchoolYears
            .sort(
                (
                    a,
                    b
                ) =>
                    b.start -
                    a.start
            )[0] ||

        null;


    return {

        schoolYear,

        menus:
            menuRows.filter(
                menu =>
                    menu.start &&
                    menu.end
            )

    };

}


/*
 * ============================================================
 * PARSE SCHOOL YEAR
 * ============================================================
 */

function parseSchoolYear(
    row,
    columns
) {

    return {

        name:
            getCellValue(
                row,
                columns.name
            ),

        start:
            parseSheetDate(
                getCellValue(
                    row,
                    columns["start date"]
                )
            ),

        end:
            parseSheetDate(
                getCellValue(
                    row,
                    columns["end date"]
                )
            )

    };

}


/*
 * ============================================================
 * PARSE MENU ROW
 * ============================================================
 */

function parseMenuRow(
    row,
    columns
) {

    return {

        name:
            getCellValue(
                row,
                columns.name
            ),

        start:
            parseSheetDate(
                getCellValue(
                    row,
                    columns["start date"]
                )
            ),

        end:
            parseSheetDate(
                getCellValue(
                    row,
                    columns["end date"]
                )
            ),

        elementaryMiddleUrl:
            getCellValue(
                row,
                columns["elementary/middle url"]
            ),

        highSchoolUrl:
            getCellValue(
                row,
                columns["high school url"]
            )

    };

}


/*
 * ============================================================
 * PARSE PDF MENU
 * ============================================================
 */

function parsePdfMenu(
    pages,
    menu,
    year,
    month
) {

    const results = [];


    const dates =
        getMonthDates(
            year,
            month
        );


    for (
        const pageItems of pages
    ) {

        if (
            !pageItems ||
            pageItems.length === 0
        ) {

            continue;

        }


        const menuItems =
            getMenuItems(
                pageItems
            );


        if (
            menuItems.length === 0
        ) {

            continue;

        }


        /*
         * ----------------------------------------------------
         * BUILD COLUMNS
         * ----------------------------------------------------
         */

        const columns =
            WEEKDAY_COLUMNS.map(
                weekday => {

                    const items =
                        menuItems.filter(
                            item =>
                                detectWeekdayColumn(
                                    item
                                )?.day ===
                                weekday.day
                        );


                    return {

                        day:
                            weekday.day,

                        centerX:
                            weekday.centerX,

                        items

                    };

                }
            );


        /*
         * ----------------------------------------------------
         * IDENTIFY MENU BLOCKS
         * ----------------------------------------------------
         */

        const columnBlocks =
            columns.map(
                column =>
                    splitIntoCalendarRows(
                        column.items
                    )
            );


        /*
         * ----------------------------------------------------
         * DETERMINE HOW MANY CALENDAR ROWS EXIST
         * ----------------------------------------------------
         */

        const rowCount =
            dates.length;


        /*
         * ----------------------------------------------------
         * BUILD GRID
         * ----------------------------------------------------
         */

        const grid =
            Array.from(
                {
                    length:
                        rowCount
                },
                () =>
                    WEEKDAY_COLUMNS.map(
                        weekday => ({

                            day:
                                weekday.day,

                            items:
                                []

                        })
                    )
            );


        columns.forEach(
            (
                column,
                columnIndex
            ) => {

                const blocks =
                    columnBlocks[
                        columnIndex
                    ];


                blocks.forEach(
                    block => {

                        const rowIndex =
                            determineBlockWeek(
                                block,
                                blocks,
                                rowCount,
                                year,
                                month,
                                columnIndex
                            );


                        if (
                            rowIndex < 0 ||
                            rowIndex >= rowCount
                        ) {

                            return;

                        }


                        grid[
                            rowIndex
                        ][
                            columnIndex
                        ].items.push(
                            ...block
                        );

                    }
                );

            }
        );


        /*
         * ----------------------------------------------------
         * CONVERT GRID TO DATES
         * ----------------------------------------------------
         */

        for (
            let week = 0;
            week < rowCount;
            week++
        ) {

            for (
                let day = 0;
                day < 5;
                day++
            ) {

                const date =
                    dates[
                        week
                    ][
                        day
                    ];


                if (
                    date <
                        menu.start ||

                    date >
                        menu.end
                ) {

                    continue;

                }


                const cell =
                    grid[
                        week
                    ][
                        day
                    ];


                const lines =
                    getCellLines(
                        cell
                    );


                results.push({

                    date:
                        formatDate(
                            date
                        ),

                    items:
                        lines

                });

            }

        }

    }


    return results;

}


/*
 * ============================================================
 * SPLIT COLUMN INTO CALENDAR ROWS
 * ============================================================
 */

function splitIntoCalendarRows(
    items
) {

    if (
        !items ||
        items.length === 0
    ) {

        return [];

    }


    const sorted =
        [...items]
            .sort(
                (
                    a,
                    b
                ) =>
                    b.y -
                    a.y
            );


    const rows = [];


    let currentRow = [];


    let previousY =
        null;


    for (
        const item of sorted
    ) {

        if (
            previousY !== null &&

            Math.abs(
                previousY -
                item.y
            ) >
            CALENDAR_ROW_GAP
        ) {

            if (
                currentRow.length > 0
            ) {

                rows.push(
                    currentRow
                );

            }


            currentRow = [];

        }


        currentRow.push(
            item
        );


        previousY =
            item.y;

    }


    if (
        currentRow.length > 0
    ) {

        rows.push(
            currentRow
        );

    }


    /*
     * Remove administrative-only rows.
     */

    return rows.filter(
        row => {

            const lines =
                groupIntoYLines(
                    row
                )
                .map(
                    line =>
                        normalizeMenuText(
                            line.text
                        )
                )
                .filter(
                    Boolean
                )
                .filter(
                    line =>
                        !isAdministrativeLine(
                            line
                        )
                );


            return (
                lines.length > 0
            );

        }
    );

}


/*
 * ============================================================
 * DETERMINE BLOCK WEEK
 * ============================================================
 */

function determineBlockWeek(
    block,
    allBlocks,
    rowCount,
    year,
    month,
    columnIndex
) {

    const centerY =
        block.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.y,
            0
        ) /
        block.length;


    const menuRange =
        MENU_START_Y -
        MENU_END_Y;


    const position =
        (
            MENU_START_Y -
            centerY
        ) /
        menuRange;


    const row =
        Math.floor(
            position *
            rowCount
        );


    return Math.min(
        rowCount - 1,
        Math.max(
            0,
            row
        )
    );

}


/*
 * ============================================================
 * OCCUPIED CALENDAR ROWS
 * ============================================================
 */

function getOccupiedCalendarRows(
    year,
    month,
    columnIndex,
    rowCount
) {

    const dates =
        getMonthDates(
            year,
            month
        );


    const rows = [];


    for (
        let row = 0;
        row < rowCount;
        row++
    ) {

        const date =
            dates[
                row
            ][
                columnIndex
            ];


        if (
            date.getMonth() ===
            month - 1
        ) {

            rows.push(
                row
            );

        }

    }


    return rows;

}


/*
 * ============================================================
 * FIND LIKELY CALENDAR ROW
 * ============================================================
 */

function findLikelyCalendarRow(
    centerY,
    block,
    year,
    month,
    rowCount
) {

    const top =
        Math.max(
            ...block.map(
                item =>
                    item.y
            )
        );


    const bottom =
        Math.min(
            ...block.map(
                item =>
                    item.y
            )
        );


    const menuRange =
        MENU_START_Y -
        MENU_END_Y;


    const position =
        (
            MENU_START_Y -
            centerY
        ) /
        menuRange;


    return Math.min(
        rowCount - 1,
        Math.max(
            0,
            Math.floor(
                position *
                rowCount
            )
        )
    );

}


/*
 * ============================================================
 * MENU ITEMS
 * ============================================================
 */

function getMenuItems(
    items
) {

    return items

        .filter(
            isMenuItem
        )

        .map(
            item => ({

                ...item,

                text:
                    normalizeMenuText(
                        item.text
                    )

            })
        )

        .filter(
            item =>
                item.text
        );

}


/*
 * ============================================================
 * MENU REGION
 * ============================================================
 */

function isMenuItem(
    item
) {

    return (

        item.y <=
            MENU_START_Y &&

        item.y >=
            MENU_END_Y

    );

}


/*
 * ============================================================
 * WEEKDAY COLUMN
 * ============================================================
 */

function detectWeekdayColumn(
    item
) {

    let bestColumn =
        null;


    let bestDistance =
        Infinity;


    for (
        const column
        of WEEKDAY_COLUMNS
    ) {

        const distance =
            Math.abs(
                item.centerX -
                column.centerX
            );


        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            bestColumn =
                column;

        }

    }


    if (
        bestDistance >
        COLUMN_TOLERANCE
    ) {

        return null;

    }


    return bestColumn;

}


/*
 * ============================================================
 * GROUP ITEMS INTO VISUAL LINES
 * ============================================================
 */

function groupIntoYLines(
    items
) {

    const lines = [];


    const sorted =
        [...items]
            .sort(
                (
                    a,
                    b
                ) => {

                    if (
                        Math.abs(
                            a.y -
                            b.y
                        ) >
                        Y_TOLERANCE
                    ) {

                        return (
                            b.y -
                            a.y
                        );

                    }


                    return (
                        a.x -
                        b.x
                    );

                }
            );


    for (
        const item
        of sorted
    ) {

        let line =
            lines.find(
                candidate =>
                    Math.abs(
                        candidate.y -
                        item.y
                    ) <=
                    Y_TOLERANCE
            );


        if (
            !line
        ) {

            line = {

                y:
                    item.y,

                items:
                    []

            };


            lines.push(
                line
            );

        }


        line.items.push(
            item
        );

    }


    return lines

        .sort(
            (
                a,
                b
            ) =>
                b.y -
                a.y
        )

        .map(
            line => ({

                y:
                    line.y,

                text:
                    normalizeMenuText(
                        line.items
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    a.x -
                                    b.x
                            )
                            .map(
                                item =>
                                    item.text
                            )
                            .join(" ")
                    )

            })
        )

        .filter(
            line =>
                line.text
        );

}


/*
 * ============================================================
 * CELL LINES
 * ============================================================
 */

function getCellLines(
    cell
) {

    return groupIntoYLines(
        cell.items
    )

        .map(
            line =>
                normalizeMenuText(
                    line.text
                )
        )

        .filter(
            Boolean
        )

        .filter(
            line =>
                !isAdministrativeLine(
                    line
                )
        );

}


/*
 * ============================================================
 * TEXT NORMALIZATION
 * ============================================================
 */

function normalizeMenuText(
    text
) {

    let result =
        String(
            text || ""
        );


    const replacements = [

        [
            /B\s\*a\s\*gel/gi,
            "Bagel"
        ],

        [
            /Bag\s\*el/gi,
            "Bagel"
        ],

        [
            /Min\s\*i\s+Waffles/gi,
            "Mini Waffles"
        ],

        [
            /Chic\s\*k\s+Pea/gi,
            "Chick Pea"
        ],

        [
            /Buffal\s\*o\s+Chicken/gi,
            "Buffalo Chicken"
        ],

        [
            /Chic\s\*ken/gi,
            "Chicken"
        ],

        [
            /T\s+e\s+nders/gi,
            "Tenders"
        ],

        [
            /Stuffe\s+d/gi,
            "Stuffed"
        ],

        [
            /B\s\*e\s\*nto\s+Box/gi,
            "Bento Box"
        ],

        [
            /B\s\*a\s\*ked/gi,
            "Baked"
        ],

        [
            /Chop\s+Sue\s\*y/gi,
            "Chop Suey"
        ],

        [
            /Americ\s\*an/gi,
            "American"
        ],

        [
            /Cheese\s+Bread\s+S\s\*t\s\*ick/gi,
            "Cheese Bread Stick"
        ],

        [
            /Cheese\s+Bread\s+Stick/gi,
            "Cheese Bread Stick"
        ],

        [
            /Egg,\s\*Ham\s\*&\s\*Cheese/gi,
            "Egg, Ham & Cheese"
        ],

        [
            /Pan\s\*cakes/gi,
            "Pancakes"
        ],

        [
            /Mac\s\*n\s\*[’']?\s\*Cheese/gi,
            "Mac n’ Cheese"
        ],

        [
            /D\s\*inner\s+Roll/gi,
            "Dinner Roll"
        ],

        [
            /Sloppy\s+Joe\s+o\s\*n\s+a\s+Roll/gi,
            "Sloppy Joe on a Roll"
        ],

        [
            /Gar\s\*den\s+Salad/gi,
            "Garden Salad"
        ],

        [
            /Hummus\s*&\s*V\s\*e\s\*ggies/gi,
            "Hummus & Veggies"
        ],

        [
            /Chicken\s+Ca\s\*e\s\*sar\s+W\s\*r\s\*ap/gi,
            "Chicken Caesar Wrap"
        ],

        [
            /Sal\s*[’']?\s*s\s+Pizza/gi,
            "Sal’s Pizza"
        ],

        [
            /General\s+Tso\s*[’']?\s*s\s+Chicken/gi,
            "General Tso’s Chicken"
        ],

        [
            /Milk\s*-\s*Chocolate\s*\/\s*White/gi,
            "Milk - Chocolate/White"
        ],

        [
            /Garlic\s+Bread\s+S\s\*t\s\*ick/gi,
            "Garlic Bread Stick"
        ],

        [
            /Milk\s*-\s*(?:White\s*\/\s*Chocolate|Chocolate\s*\/\s*White)/gi,
            "Milk - Chocolate/White"
        ]

    ];


    for (
        const [
            pattern,
            replacement
        ]
        of replacements
    ) {

        result =
            result.replace(
                pattern,
                replacement
            );

    }


    result =
        result.replace(
            /\s+[’']/g,
            "’"
        );


    result =
        result.replace(
            /[’']\s+/g,
            "’"
        );


    result =
        result.replace(
            /\s+/g,
            " "
        )
        .trim();


    return result;

}


/*
 * ============================================================
 * ADMINISTRATIVE TEXT
 * ============================================================
 */

function isAdministrativeLine(
    text
) {

    const normalized =
        normalizeMenuText(
            text
        )
        .toLowerCase();


    if (
        !normalized
    ) {

        return true;

    }


    const administrativePatterns = [

        /^breakfast$/i,

        /^lunch$/i,

        /^monday$/i,

        /^tuesday$/i,

        /^wednesday$/i,

        /^thursday$/i,

        /^friday$/i,

        /^elementary/i,

        /^middle school/i,

        /^school lunch/i,

        /^menu$/i,

        /^september$/i,

        /^august$/i,

        /^october$/i,

        /^labor$/i,

        /^day$/i

    ];


    return administrativePatterns.some(
        pattern =>
            pattern.test(
                normalized
            )
    );

}


/*
 * ============================================================
 * MONTH DATES
 * ============================================================
 */

function getMonthDates(
    year,
    month
) {

    const firstDate =
        new Date(
            year,
            month - 1,
            1
        );


    const lastDate =
        new Date(
            year,
            month,
            0
        );


    const firstDay =
        firstDate.getDay();


    const mondayOffset =
        (
            firstDay +
            6
        ) %
        7;


    const rows =
        Math.ceil(
            (
                mondayOffset +
                lastDate.getDate()
            ) / 7
        );


    const totalRows =
        Math.max(
            5,
            rows
        );


    const startDate =
        new Date(
            year,
            month - 1,
            1 -
            mondayOffset
        );


    const dates = [];


    for (
        let week = 0;
        week < totalRows;
        week++
    ) {

        const row = [];


        for (
            let day = 0;
            day < 5;
            day++
        ) {

            const date =
                new Date(
                    startDate
                );


            date.setDate(
                startDate.getDate() +
                week * 7 +
                day
            );


            row.push(
                date
            );

        }


        dates.push(
            row
        );

    }


    return dates;

}


/*
 * ============================================================
 * MERGE PDF DATA
 * ============================================================
 */

function mergeMenuData(
    target,
    parsed
) {

    if (
        !Array.isArray(
            parsed
        )
    ) {

        return;

    }


    for (
        const entry of parsed
    ) {

        if (
            !entry ||
            !entry.date
        ) {

            continue;

        }


        if (
            !Array.isArray(
                entry.items
            )
        ) {

            continue;

        }


        /*
         * Never allow an empty parse to replace populated data.
         */

        if (
            target.has(
                entry.date
            ) &&

            target.get(
                entry.date
            ).length > 0 &&

            entry.items.length === 0
        ) {

            continue;

        }


        target.set(
            entry.date,
            entry.items
        );

    }

}


/*
 * ============================================================
 * SCHOOL HOLIDAYS
 * ============================================================
 */

function getSchoolHoliday(
    date
) {

    const dateKey =
        formatDate(
            date
        );


    const holidays = {

        "2026-09-01":
            "NO SCHOOL",

        "2026-09-07":
            "LABOR DAY"

    };


    return (
        holidays[
            dateKey
        ] ||
        null
    );

}


/*
 * ============================================================
 * CREATE DAY
 * ============================================================
 */

function createDay(
    date,
    elementaryMiddle,
    highSchool
) {

    return {

        date:
            formatDate(
                date
            ),

        day:
            date.toLocaleDateString(
                "en-US",
                {
                    weekday:
                        "long"
                }
            ),

        elementaryMiddle:
            Array.isArray(
                elementaryMiddle
            )
                ? elementaryMiddle
                : [],

        highSchool:
            Array.isArray(
                highSchool
            )
                ? highSchool
                : []

    };

}


/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

function startOfDay(
    value
) {

    const date =
        value instanceof Date
            ? new Date(value)
            : new Date(value);


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;

}


function addDays(
    date,
    days
) {

    const result =
        new Date(
            date
        );


    result.setDate(
        result.getDate() +
        days
    );


    return result;

}


function weekOverlapsRange(
    monday,
    rangeStart,
    rangeEnd
) {

    const weekEnd =
        addDays(
            monday,
            4
        );


    return (

        monday <=
            rangeEnd &&

        weekEnd >=
            rangeStart

    );

}


/*
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
    date
) {

    return (

        date.getFullYear() +

        "-" +

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ) +

        "-" +

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    );

}


/*
 * ============================================================
 * GOOGLE SHEETS DATE PARSING
 * ============================================================
 */

function parseSheetDate(
    value
) {

    if (
        !value
    ) {

        return null;

    }


    if (
        value instanceof Date
    ) {

        return startOfDay(
            value
        );

    }


    const text =
        String(
            value
        )
        .trim();


    const googleDateMatch =
        text.match(
            /^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)$/
        );


    if (
        googleDateMatch
    ) {

        return startOfDay(
            new Date(
                Number(
                    googleDateMatch[1]
                ),

                Number(
                    googleDateMatch[2]
                ),

                Number(
                    googleDateMatch[3]
                )
            )
        );

    }


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        const [
            year,
            month,
            day
        ] =
            text
                .split("-")
                .map(
                    Number
                );


        return startOfDay(
            new Date(
                year,
                month - 1,
                day
            )
        );

    }


    const slashMatch =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (
        slashMatch
    ) {

        return startOfDay(
            new Date(
                Number(
                    slashMatch[3]
                ),

                Number(
                    slashMatch[1]
                ) - 1,

                Number(
                    slashMatch[2]
                )
            )
        );

    }


    const parsed =
        new Date(
            text
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return null;

    }


    return startOfDay(
        parsed
    );

}


/*
 * ============================================================
 * GOOGLE SHEETS CELL VALUE
 * ============================================================
 */

function getCellValue(
    row,
    column
) {

    if (
        column === undefined
    ) {

        return "";

    }


    return String(
        row[column]?.v ??
        ""
    )
    .replace(
        /\u00a0/g,
        " "
    )
    .trim();

}