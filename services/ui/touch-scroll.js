export function enableTouchScroll(
    element,
    options = {}
) {

    const {
        sensitivity = 1,
        threshold = 5
    } = options;


    let startY = 0;
    let startScrollTop = 0;
    let dragging = false;


    function onPointerDown(event) {

        if (
            event.pointerType !== "touch" &&
            event.pointerType !== "pen"
        ) {
            return;
        }


        if (
            event.button !== 0 &&
            event.pointerType !== "touch"
        ) {
            return;
        }


        /*
         * Allow future interactive controls
         * such as buttons and Todoist checkboxes.
         */

        if (
            event.target.closest(
                "button, input, textarea, select, a, [role='button'], [data-touch-scroll-ignore]"
            )
        ) {
            return;
        }


        startY =
            event.clientY;

        startScrollTop =
            element.scrollTop;

        dragging = false;


        element.setPointerCapture(
            event.pointerId
        );

    }


    function onPointerMove(event) {

        if (
            !element.hasPointerCapture(
                event.pointerId
            )
        ) {
            return;
        }


        const deltaY =
            event.clientY - startY;


        if (
            !dragging &&
            Math.abs(deltaY) < threshold
        ) {
            return;
        }


        dragging = true;


        element.scrollTop =
            startScrollTop -
            (deltaY * sensitivity);

    }


    function endPointer(event) {

        if (
            element.hasPointerCapture(
                event.pointerId
            )
        ) {

            element.releasePointerCapture(
                event.pointerId
            );

        }


        dragging = false;

    }


    element.addEventListener(
        "pointerdown",
        onPointerDown
    );

    element.addEventListener(
        "pointermove",
        onPointerMove
    );

    element.addEventListener(
        "pointerup",
        endPointer
    );

    element.addEventListener(
        "pointercancel",
        endPointer
    );


    return function disableTouchScroll() {

        element.removeEventListener(
            "pointerdown",
            onPointerDown
        );

        element.removeEventListener(
            "pointermove",
            onPointerMove
        );

        element.removeEventListener(
            "pointerup",
            endPointer
        );

        element.removeEventListener(
            "pointercancel",
            endPointer
        );

    };

}