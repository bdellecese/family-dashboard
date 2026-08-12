/*
 * ============================================================
 * DID YOU KNOW DATA SERVICE
 * ============================================================
 *
 * Local, curated collection of family-friendly facts.
 *
 * No external API required.
 *
 * ============================================================
 */

const facts = [

    /*
     * ========================================================
     * SCIENCE
     * ========================================================
     */

    "Water expands when it freezes, which is why ice floats.",

    "Lightning can heat the air around it to about five times hotter than the surface of the Sun.",

    "Sound travels about four times faster through water than through air.",

    "A day on Venus is longer than a year on Venus.",

    "Hot water can sometimes freeze faster than cold water. This is known as the Mpemba effect.",

    "Glass is technically a solid, not a very slow-moving liquid.",

    "The human body contains enough carbon to make about 9,000 pencils.",

    "A teaspoon of neutron-star material would weigh about six billion tons on Earth.",

    "Bananas are slightly radioactive because they contain potassium-40.",

    "The Earth's core is about as hot as the surface of the Sun.",


    /*
     * ========================================================
     * ANIMALS
     * ========================================================
     */

    "Wombat poop is cube-shaped.",

    "Octopuses have three hearts.",

    "Cows have best friends and can become stressed when they are separated.",

    "A group of flamingos is called a flamboyance.",

    "Sea otters hold hands while sleeping so they don't drift apart.",

    "Elephants can recognize themselves in mirrors.",

    "A snail can have thousands of tiny teeth.",

    "Penguins can jump more than six feet into the air.",

    "Giraffes have the same number of neck vertebrae as humans: seven.",

    "Crows can recognize individual human faces.",


    /*
     * ========================================================
     * SPACE
     * ========================================================
     */

    "One million Earths could fit inside the Sun.",

    "Mars has the largest volcano in the solar system, Olympus Mons.",

    "The footprints left by Apollo astronauts on the Moon could last for millions of years.",

    "There are more stars in the observable universe than grains of sand on all of Earth's beaches.",

    "A year on Mercury lasts only 88 Earth days.",

    "Saturn would float in water if you had a bathtub large enough.",

    "The Moon is moving away from Earth by about 1.5 inches each year.",

    "The Sun contains more than 99 percent of the mass in our solar system.",

    "Space is completely silent because there is no air for sound to travel through.",

    "Jupiter has the shortest day of any planet in our solar system, lasting about 10 hours.",


    /*
     * ========================================================
     * HISTORY
     * ========================================================
     */

    "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid of Giza.",

    "Oxford University is older than the Aztec Empire.",

    "The first recorded Olympic Games were held in 776 BC.",

    "The Great Wall of China is actually a series of walls and fortifications built over many centuries.",

    "The shortest war in recorded history lasted less than an hour.",

    "The first computer mouse was made of wood.",

    "The first person to receive a speeding ticket was reportedly driving at about 8 miles per hour.",

    "The Eiffel Tower was originally intended to be temporary.",

    "The ancient Romans used urine as a source of ammonia for cleaning clothes.",

    "The first email was sent in 1971.",


    /*
     * ========================================================
     * SPORTS
     * ========================================================
     */

    "A baseball has exactly 108 double stitches.",

    "A standard basketball hoop is 10 feet above the floor.",

    "A soccer ball is traditionally made from 32 panels.",

    "The fastest recorded tennis serve was over 160 miles per hour.",

    "A marathon is exactly 26.2 miles long.",

    "The Olympic Games have been held on every inhabited continent except Antarctica.",

    "A regulation baseball weighs between 5 and 5.25 ounces.",

    "The first modern Olympic Games were held in Athens in 1896.",

    "A soccer goalkeeper is the only player allowed to use their hands during normal play, but only within their own penalty area.",

    "The longest baseball game by innings in Major League Baseball history lasted 26 innings.",


    /*
     * ========================================================
     * GEOGRAPHY
     * ========================================================
     */

    "Russia spans 11 time zones.",

    "Africa is the only continent that lies in all four hemispheres.",

    "Alaska is both the westernmost and easternmost U.S. state, depending on how longitude is measured across the Aleutian Islands.",

    "Canada has the world's longest coastline.",

    "The Pacific Ocean is larger than all of Earth's land area combined.",

    "The shortest distance between Russia and the United States is less than three miles between two islands in the Bering Strait.",

    "Mount Everest grows a few millimeters taller each year because of tectonic activity.",

    "Vatican City is the smallest country in the world by area.",

    "There are more than 3,000 lakes in the state of Massachusetts.",

    "The Sahara Desert is roughly the same size as the United States.",


    /*
     * ========================================================
     * TECHNOLOGY
     * ========================================================
     */

    "The first website ever created is still online.",

    "The first hard drive, introduced by IBM in 1956, weighed more than a ton.",

    "The QWERTY keyboard layout was designed in part to reduce mechanical jams in early typewriters.",

    "The first smartphone is generally considered to be IBM's Simon, released in 1994.",

    "The original name for Google's search engine was BackRub.",

    "The @ symbol was used in email addresses before the World Wide Web existed.",

    "The first YouTube video was uploaded in April 2005.",

    "The word 'robot' comes from a Czech word meaning forced labor or work.",

    "The first computer programmer is widely considered to be Ada Lovelace.",

    "The first iPhone was released in 2007.",


    /*
     * ========================================================
     * WEIRD & FUN
     * ========================================================
     */

    "Honey can remain edible for thousands of years if it is properly sealed.",

    "A group of crows is called a murder.",

    "There are more possible games of chess than there are atoms in the observable universe.",

    "The average cloud can weigh more than a million pounds.",

    "A jiffy is an actual unit of time used in physics, although its exact length depends on the context.",

    "Scotland's national animal is the unicorn.",

    "The dot over a lowercase i or j is called a tittle.",

    "The inventor of the Pringles can had some of his ashes buried in one.",

    "A day on Earth is getting slightly longer over very long periods of time.",

    "The word 'queue' is pronounced the same even if you remove the last four letters.",

    "The hashtag symbol is also called an octothorpe.",

    "A group of porcupines is called a prickle.",

    "There is a basketball court inside the U.S. Supreme Court building, nicknamed the highest court in the land.",

    "The first oranges weren't orange. Many early varieties were green.",

    "A bolt of lightning contains enough energy to toast about 100,000 slices of bread.",

    "The inventor of the microwave oven discovered the technology after a chocolate bar melted in his pocket.",

    "Some cats are allergic to humans.",

    "The world's largest pizza was more than 13,000 square feet.",

    "A day on Earth isn't exactly 24 hours; Earth's rotation is constantly changing slightly.",

    "The hashtag symbol was originally called an octothorpe."
];


/*
 * ============================================================
 * DATA SERVICE
 * ============================================================
 */

const didYouKnowData = {

    getFact() {

        if (
            !facts ||
            facts.length === 0
        ) {

            return {

                available:
                    false,

                message:
                    "Did You Know? is unavailable."

            };

        }


        const index =
            Math.floor(
                Math.random() *
                facts.length
            );


        return {

            available:
                true,

            fact:
                facts[index],

            source:
                "Did You Know?"

        };

    }

};


export default didYouKnowData;