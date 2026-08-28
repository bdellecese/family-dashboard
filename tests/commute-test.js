import {
    getCommuteData
} from "../services/commute/commute-data.js";


const travelTimes = {

    "work-1": 22,

    "work-2": 18

};


const tests = [

    {
        name: "Thursday 7:00 AM",
        date: "2026-08-27T07:00:00",
        expectedCount: 2
    },

    {
        name: "Friday 8:30 AM",
        date: "2026-08-28T08:30:00",
        expectedCount: 2
    },

    {
        name: "Saturday 7:00 AM",
        date: "2026-08-29T07:00:00",
        expectedCount: 0
    },

    {
        name: "Thursday 5:30 AM",
        date: "2026-08-27T05:30:00",
        expectedCount: 0
    },

    {
        name: "Thursday 9:00 AM",
        date: "2026-08-27T09:00:00",
        expectedCount: 2
    },

    {
        name: "Thursday 10:00 AM",
        date: "2026-08-27T10:00:00",
        expectedCount: 2
    }

];


console.log(
    "\nCommute Service Tests\n"
);


let passed = 0;


for (
    const test of tests
) {

    const result =
        await getCommuteData(
            travelTimes,
            new Date(test.date)
        );


    const success =
        result.length ===
        test.expectedCount;


    if (success) {

        console.log(
            `✓ ${test.name}`
        );

        passed++;

    }

    else {

        console.error(
            `✗ ${test.name}`
        );

        console.error(
            `  Expected: ${test.expectedCount}`
        );

        console.error(
            `  Received: ${result.length}`
        );

    }

}


console.log(
    `\n${passed}/${tests.length} tests passed.\n`
);

console.log(
    "\nCommute Calculation Tests\n"
);


const calculationResult =
    await getCommuteData(
        {
            "work-1": 22,
            "work-2": 18
        },
        new Date("2026-08-27T07:00:00")
    );


const work1 =
    calculationResult.find(
        commute =>
            commute.id === "work-1"
    );


const work2 =
    calculationResult.find(
        commute =>
            commute.id === "work-2"
    );


/*
 * The Surgery Center
 */

if (
    work1 &&
    work1.currentMinutes === 22 &&
    work1.normalMinutes === 15 &&
    work1.delayMinutes === 7 &&
    work1.arriveBy === "08:00" &&
    work1.leaveBy === "07:38" &&
    work1.status === "delayed"
) {

    console.log(
        "✓ The Surgery Center calculations"
    );

    passed++;

}

else {

    console.error(
        "✗ The Surgery Center calculations"
    );

    console.error(
        work1
    );

}


/*
 * UMass Memorial
 */

if (
    work2 &&
    work2.currentMinutes === 18 &&
    work2.normalMinutes === 15 &&
    work2.delayMinutes === 3 &&
    work2.arriveBy === "07:00" &&
    work2.leaveBy === "06:42" &&
    work2.status === "slower"
) {

    console.log(
        "✓ UMass Memorial calculations"
    );

    passed++;

}

else {

    console.error(
        "✗ UMass Memorial calculations"
    );

    console.error(
        work2
    );
}


console.log(
    `\n${passed} tests passed.\n`
);