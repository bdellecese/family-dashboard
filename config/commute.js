export const COMMUTE_SETTINGS = {

    activeDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ]

};

export const COMMUTE_ORIGIN =
    "28 Patriot Way, Holden, MA 01520";

export const COMMUTE_DESTINATIONS = [

    {
        id: "commute-1",

        name: "The Surgery Center",

        address: "151 Main St, Shrewsbury, MA 01545",

        normalMinutes: 15,

        arrivalBufferMinutes: 15,

        calendarMatch: {
            type: "calendar",
            calendarId: "67jhfpigbnv5n6kuouf5eu3llc@group.calendar.google.com"
        }

    },

    {
        id: "commute-2",

        name: "UMass Memorial",

        address: "119 Belmont St, Worcester, MA 01605",

        normalMinutes: 14,

        arrivalBufferMinutes: 10,

        calendarMatch: {
            type: "title",
            calendarId: "natalie.dellecese@gmail.com",
            value: "UMass"
        }

    },
    
    {
        id: "commute-3",

        name: "Wachusett United",

        arrivalBufferMinutes: 10,

        calendarMatch: {
            type: "calendar",
            calendarId:
                "878vjmvnrhp8soe4g89lmditinvg9tpm@import.calendar.google.com"
        }

    }   

];