import {
    getDrivingDuration
} from "../services/commute/google-routes.js";


const destination =
    "151 Main St, Shrewsbury, MA 01545";


console.log(
    "\nGoogle Routes Test\n"
);


try {

    const minutes =
        await getDrivingDuration(
            destination
        );


    if (
        !Number.isFinite(minutes) ||
        minutes <= 0
    ) {

        throw new Error(
            `Invalid travel time returned: ${minutes}`
        );

    }


    console.log(
        `✓ The Surgery Center: ${minutes} minutes`
    );


    console.log(
        "\n1/1 tests passed.\n"
    );

}

catch (error) {

    console.error(
        "✗ Google Routes test failed:"
    );

    console.error(
        error.message
    );

    process.exit(
        1
    );

}