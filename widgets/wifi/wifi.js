const wifi = {

    name: "wifi",

    async render(
        container,
        config = {}
    ) {

        container.innerHTML = "";

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "wifi-widget";

        container.appendChild(
            wrapper
        );


        /*
         * IMAGE
         */

        const image =
            document.createElement("img");

        image.className =
            "wifi-widget__image";

        image.src =
            config.image;

        image.alt =
            "Guest Wi-Fi";


        /*
         * QR CODE
         */

        const qr =
            document.createElement("div");

        qr.className =
            "wifi-widget__qr";


        const qrCode =
            document.createElement("div");

        qrCode.className =
            "wifi-widget__qr-code";


        const qrText =
            document.createElement("div");

        qrText.className =
            "wifi-widget__qr-text";

        qrText.textContent =
            "Guest WiFi - scan to connect!";


        qr.appendChild(
            qrCode
        );

        qr.appendChild(
            qrText
        );


        wrapper.appendChild(
            image
        );

        wrapper.appendChild(
            qr
        );


        /*
         * WIFI QR PAYLOAD
         */

        const security =
            config.security || "WPA";

        const ssid =
            config.ssid || "Dellecese Guest";

        const password =
            config.password || "TB12istheGOAT";


        const wifiPayload =
            `WIFI:T:${security};S:${ssid};P:${password};;`;


        if (
            typeof QRCode ===
            "undefined"
        ) {

            console.error(
                "QRCode library not loaded."
            );

            return;

        }


        new QRCode(
            qrCode,
            {
                text: wifiPayload,
                width: 600,
                height: 600,
                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );

    }

};

export default wifi;