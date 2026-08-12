/*
 * ============================================================
 * KIDS CHORES
 * ============================================================
 */

const kidsChores = {

    name:
        "kids-chores",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML =
            "";


        /*
         * WIDGET
         */

        const widget =
            document.createElement("div");

        widget.className =
            "kids-chores-widget";


        /*
         * TITLE
         */

        const heading =
            document.createElement("div");

        heading.className =
            "kids-chores-widget__title";

        heading.textContent =
            "Daily Chores - prima il dovere poi il piacere";


        widget.appendChild(
            heading
        );


        /*
         * CHORES
         */

        const chores = {

            "James": [

                "Dottie evening duty (M, F)",

                "Do your laundry",

                "Trash & recycling bins to curb (Wednesday AM)",

                "Mow the lawn (every other weekend)"

            ],


            "Isabella": [

                "Dottie evening duty (Tu, Sa)",

                "Do your laundry",

                "Wash, dry and fold household towels (Tuesday)",

                "Water plants (Daily)"

            ],


            "Alexander": [

                "Dottie evening duty (Th, Sa)",

                "Set the table (M, W, F)",

                "Wipe the table (Tu, Th, Sa)",

                "Empty bathroom and laundry trashes (Tuesday)"

            ],


            "Teddy": [

                "Dottie evening duty (W, F)",

                "Set the table (Tu, Th, Sa)",

                "Wipe the table (M, W, F)"

            ]

        };


        /*
         * CHILD SECTIONS
         */

        Object.entries(
            chores
        ).forEach(
            ([name, items]) => {

                const section =
                    document.createElement("div");

                section.className =
                    "kids-chores-widget__child";


                const childName =
                    document.createElement("div");

                childName.className =
                    "kids-chores-widget__child-name";

                childName.textContent =
                    name;


                section.appendChild(
                    childName
                );


                const list =
                    document.createElement("ol");

                list.className =
                    "kids-chores-widget__list";


                items.forEach(
                    chore => {

                        const item =
                            document.createElement("li");

                        item.className =
                            "kids-chores-widget__item";

                        item.textContent =
                            chore;

                        list.appendChild(
                            item
                        );

                    }
                );


                section.appendChild(
                    list
                );

                widget.appendChild(
                    section
                );

            }
        );


        /*
         * ALL KIDS
         */

        const allKids =
            document.createElement("div");

        allKids.className =
            "kids-chores-widget__all";


        allKids.textContent =
            "All kids: Change bed sheets every other Wednesday.";


        widget.appendChild(
            allKids
        );


        /*
         * POINT EARNERS
         */

        const points =
            document.createElement("div");

        points.className =
            "kids-chores-widget__points";


        points.textContent =
            "Chore point earners: see Kids Chore Chart.";


        widget.appendChild(
            points
        );


        /*
         * ADD TO CONTAINER
         */

        container.appendChild(
            widget
        );

    }

};


export default kidsChores;