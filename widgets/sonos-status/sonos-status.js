const DEFAULT_SPEAKER =
    "Kitchen";

const DEFAULT_REFRESH_INTERVAL =
    10000;


// ============================================================
// SONOS STATUS WIDGET
// ============================================================

const sonosStatus = {

    name: "sonos-status",


    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";


        // ====================================================
        // CONFIGURATION
        // ====================================================

        const speaker =
            config.speaker ||
            DEFAULT_SPEAKER;


        const refreshInterval =
            Number(
                config.refreshInterval ||
                DEFAULT_REFRESH_INTERVAL
            );


        // ====================================================
        // WRAPPER
        // ====================================================

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "sonos-status-widget";

        container.appendChild(
            wrapper
        );


        // ====================================================
        // INITIAL STRUCTURE
        // ====================================================

        const artwork =
            document.createElement("img");

        artwork.className =
            "sonos-status-widget__artwork";

        artwork.alt =
            "";


        const artworkPlaceholder =
            document.createElement("div");

        artworkPlaceholder.className =
            "sonos-status-widget__artwork-placeholder";

        artworkPlaceholder.innerHTML =
            '<span class="fas fa-music"></span>';


        const content =
            document.createElement("div");

        content.className =
            "sonos-status-widget__content";


        const room =
            document.createElement("div");

        room.className =
            "sonos-status-widget__room";


        const state =
            document.createElement("div");

        state.className =
            "sonos-status-widget__state";


        const title =
            document.createElement("div");

        title.className =
            "sonos-status-widget__title";


        const artist =
            document.createElement("div");

        artist.className =
            "sonos-status-widget__artist";


        const album =
            document.createElement("div");

        album.className =
            "sonos-status-widget__album";


        content.appendChild(
            room
        );

        content.appendChild(
            state
        );

        content.appendChild(
            title
        );

        content.appendChild(
            artist
        );

        content.appendChild(
            album
        );


        wrapper.appendChild(
            artworkPlaceholder
        );

        wrapper.appendChild(
            artwork
        );

        wrapper.appendChild(
            content
        );


        // ====================================================
        // STATE
        // ====================================================

        let refreshTimer =
            null;

        let destroyed =
            false;


        // ====================================================
        // UPDATE UI
        // ====================================================

        function updateDisplay(
            data
        ) {

            if (
                !data ||
                !data.speaker
            ) {

                showError(
                    wrapper,
                    "Unable to load Sonos"
                );

                return;

            }


            room.textContent =
                data.speaker.name ||
                speaker;


            const playbackState =
                data.state ||
                "STOPPED";


            const stateInfo =
                getStateInfo(
                    playbackState
                );


            state.textContent =
                stateInfo.label;

            state.className =
                `sonos-status-widget__state sonos-status-widget__state--${stateInfo.className}`;


            const track =
                data.track ||
                {};


            title.textContent =
                track.title ||
                "Nothing playing";


            artist.textContent =
                track.artist ||
                "";


            album.textContent =
                track.album ||
                "";


            if (
                track.albumArt
            ) {

                artwork.src =
                    track.albumArt;

                artwork.classList.add(
                    "sonos-status-widget__artwork--visible"
                );

                artworkPlaceholder.classList.add(
                    "sonos-status-widget__artwork-placeholder--hidden"
                );

            }

            else {

                artwork.removeAttribute(
                    "src"
                );

                artwork.classList.remove(
                    "sonos-status-widget__artwork--visible"
                );

                artworkPlaceholder.classList.remove(
                    "sonos-status-widget__artwork-placeholder--hidden"
                );

            }

        }


        // ====================================================
        // LOAD DATA
        // ====================================================

        async function refresh() {

            if (
                destroyed
            ) {

                return;

            }


            try {

                const response =
                    await fetch(
                        `/api/sonos?speaker=${encodeURIComponent(speaker)}`
                    );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        `Sonos API returned ${response.status}`
                    );

                }


                const data =
                    await response.json();


                updateDisplay(
                    data
                );

            }

            catch (error) {

                console.error(
                    "Sonos widget error:",
                    error
                );


                showError(
                    wrapper,
                    "Unable to load Sonos"
                );

            }

        }


        // ====================================================
        // INITIAL LOAD
        // ====================================================

        await refresh();


        // ====================================================
        // REFRESH
        // ====================================================

        refreshTimer =
            setInterval(
                refresh,
                refreshInterval
            );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            destroyed =
                true;


            if (
                refreshTimer
            ) {

                clearInterval(
                    refreshTimer
                );

                refreshTimer =
                    null;

            }

        };

    }

};


// ============================================================
// STATE HELPERS
// ============================================================

function getStateInfo(
    state
) {

    switch (
        state
    ) {

        case "PLAYING":

            return {

                label:
                    "Playing",

                className:
                    "playing"

            };


        case "PAUSED_PLAYBACK":

            return {

                label:
                    "Paused",

                className:
                    "paused"

            };


        case "STOPPED":

            return {

                label:
                    "Stopped",

                className:
                    "stopped"

            };


        default:

            return {

                label:
                    state,

                className:
                    "unknown"

            };

    }

}


// ============================================================
// ERROR DISPLAY
// ============================================================

function showError(
    wrapper,
    message
) {

    wrapper.innerHTML = "";


    const error =
        document.createElement("div");

    error.className =
        "sonos-status-widget__error";

    error.textContent =
        message;


    wrapper.appendChild(
        error
    );

}


// ============================================================
// EXPORT
// ============================================================

export default sonosStatus;