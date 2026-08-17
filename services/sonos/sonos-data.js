/*
 * ============================================================
 * SONOS DATA SERVICE
 * ============================================================
 *
 * Server-side access to Sonos players on the local network.
 *
 * Responsibilities:
 *
 * - Discover Sonos players using Avahi
 * - Find a player by friendly name
 * - Get playback state
 * - Get current track metadata
 * - Get album artwork
 * - Determine group membership
 * - Use the group coordinator for playback information
 *
 * The browser never communicates directly with Sonos.
 *
 * ============================================================
 */

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync =
    promisify(execFile);


/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const SONOS_SERVICE =
    "_sonos._tcp";

const SONOS_PORT =
    1400;


/*
 * ============================================================
 * DISCOVER SONOS PLAYERS
 * ============================================================
 *
 * Uses Avahi because the Pi already has avahi-utils installed
 * and the Sonos devices are visible through mDNS.
 *
 * ============================================================
 */

async function discoverPlayers() {

    const { stdout } =
        await execFileAsync(
            "avahi-browse",
            [
                "-rt",
                SONOS_SERVICE
            ]
        );


    const players = [];

    const lines =
        stdout.split("\n");


    let current = null;


    for (
        const line of lines
    ) {

        /*
         * Example:
         *
         * = wlan0 IPv4 RINCON_xxx@Kitchen _sonos._tcp local
         */

        const serviceMatch =
            line.match(
                /^=\s+\S+\s+\S+\s+(.+?)\s+_sonos\._tcp/
            );


        if (
            serviceMatch
        ) {

            const serviceName =
                serviceMatch[1].trim();


            const atIndex =
                serviceName.lastIndexOf("@");


            const name =
                atIndex >= 0
                    ? serviceName.slice(
                        atIndex + 1
                    )
                    : serviceName;


            const uuid =
                atIndex >= 0
                    ? serviceName.slice(
                        0,
                        atIndex
                    )
                    : null;


            current = {

                name,

                uuid,

                address:
                    null,

                port:
                    SONOS_PORT

            };


            continue;

        }


        if (
            !current
        ) {

            continue;

        }


        /*
         * Example:
         *
         * address = [192.168.6.148]
         */

        const addressMatch =
            line.match(
                /^\s+address\s*=\s+\[([^\]]+)\]/
            );


        if (
            addressMatch
        ) {

            const address =
                addressMatch[1];


            /*
             * Ignore IPv6 addresses.
             */

            if (
                address.includes(":")
            ) {

                continue;

            }


            current.address =
                address;


            const duplicate =
                players.some(
                    player =>
                        player.uuid ===
                            current.uuid
                        &&
                        player.address ===
                            current.address
                );


            if (
                !duplicate
            ) {

                players.push(
                    current
                );

            }

        }

    }


    return players;

}


/*
 * ============================================================
 * SOAP REQUEST
 * ============================================================
 */

async function sonosSoapRequest(
    address,
    service,
    action,
    body
) {

    const url =
        `http://${address}:${SONOS_PORT}${service}`;


    const serviceName =
        service.includes(
            "AVTransport"
        )
            ? "AVTransport"
            : "ZoneGroupTopology";


    const envelope =
        `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope
    s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
    xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">

    <s:Body>

        <u:${action}
            xmlns:u="urn:schemas-upnp-org:service:${serviceName}:1">

            ${body || ""}

        </u:${action}>

    </s:Body>

</s:Envelope>`;


    const response =
        await fetch(
            url,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        'text/xml; charset="utf-8"',

                    "SOAPACTION":
                        `"urn:schemas-upnp-org:service:${serviceName}:1#${action}"`

                },

                body:
                    envelope

            }
        );


    const text =
        await response.text();


    if (
        !response.ok
    ) {

        throw new Error(
            `Sonos ${action} request failed: ${response.status}`
        );

    }


    return text;

}


/*
 * ============================================================
 * XML VALUE
 * ============================================================
 */

function getXmlValue(
    xml,
    tag
) {

    const escapedTag =
        tag.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );


    const match =
        xml.match(
            new RegExp(
                `<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapedTag}>`,
                "i"
            )
        );


    if (
        !match
    ) {

        return "";

    }


    return decodeXml(
        match[1].trim()
    );

}


/*
 * ============================================================
 * XML DECODE
 * ============================================================
 */

function decodeXml(
    value
) {

    let decoded =
        String(
            value || ""
        );


    let previous;


    /*
     * Sonos can return XML nested inside an
     * XML response, resulting in multiple levels
     * of escaping.
     *
     * Keep decoding until the value stops changing.
     */

    do {

        previous =
            decoded;


        decoded =
            decoded
                .replace(
                    /&amp;/g,
                    "&"
                )
                .replace(
                    /&lt;/g,
                    "<"
                )
                .replace(
                    /&gt;/g,
                    ">"
                )
                .replace(
                    /&quot;/g,
                    '"'
                )
                .replace(
                    /&#39;/g,
                    "'"
                )
                .replace(
                    /&apos;/g,
                    "'"
                )
                .replace(
                    /&#x27;/gi,
                    "'"
                );


    } while (
        decoded !==
        previous
    );


    return decoded;

}


/*
 * ============================================================
 * CURRENT TRACK
 * ============================================================
 */

async function getCurrentTrack(
    player
) {

    const xml =
        await sonosSoapRequest(
            player.address,
            "/MediaRenderer/AVTransport/Control",
            "GetPositionInfo",

            `
<InstanceID>0</InstanceID>
<Channel>Master</Channel>
            `
        );


    const stateXml =
        await sonosSoapRequest(
            player.address,
            "/MediaRenderer/AVTransport/Control",
            "GetTransportInfo",

            `
<InstanceID>0</InstanceID>
            `
        );


    const trackUri =
        getXmlValue(
            xml,
            "TrackURI"
        );


    const metadata =
        getXmlValue(
            xml,
            "TrackMetaData"
        );


    const title =
        getXmlValue(
            metadata,
            "dc:title"
        );


    const artist =
        getXmlValue(
            metadata,
            "dc:creator"
        );


    const album =
        getXmlValue(
            metadata,
            "upnp:album"
        );


    let albumArt =
        getXmlValue(
            metadata,
            "upnp:albumArtURI"
        );


    /*
     * Sonos may return an album-art URI relative
     * to the player.
     */

    if (
        albumArt &&
        albumArt.startsWith("/")
    ) {

        albumArt =
            `http://${player.address}:${SONOS_PORT}${albumArt}`;

    }


    const state =
        getXmlValue(
            stateXml,
            "CurrentTransportState"
        );


    return {

        state:
            state || "STOPPED",

        trackUri:
            trackUri || null,

        title:
            title || null,

        artist:
            artist || null,

        album:
            album || null,

        albumArt:
            albumArt || null

    };

}


/*
 * ============================================================
 * GROUP INFORMATION
 * ============================================================
 *
 * Sonos returns ZoneGroupState as escaped XML inside
 * the SOAP response.
 *
 * Example:
 *
 * <ZoneGroupState>
 *     &lt;ZoneGroupState&gt;
 *         &lt;ZoneGroups&gt;
 *             ...
 *
 * Therefore we must extract and decode ZoneGroupState
 * before parsing the ZoneGroup elements.
 *
 * ============================================================
 */

async function getGroupInfo(
    player
) {

    const xml =
        await sonosSoapRequest(
            player.address,
            "/ZoneGroupTopology/Control",
            "GetZoneGroupState",

            ""
        );


    const decodedXml =
        decodeXml(
            getXmlValue(
                xml,
                "ZoneGroupState"
            )
        );


    /*
     * Find the ZoneGroup containing our player UUID.
     */

    const groups =
        [
            ...decodedXml.matchAll(
                /<ZoneGroup\b([^>]*)>([\s\S]*?)<\/ZoneGroup>/gi
            )
        ];


    for (
        const groupMatch of groups
    ) {

        const groupAttributes =
            parseAttributes(
                groupMatch[1]
            );


        const groupXml =
            groupMatch[2];


        if (
            !groupXml.includes(
                player.uuid
            )
        ) {

            continue;

        }


        const members =
            [
                ...groupXml.matchAll(
                    /<ZoneGroupMember\b([^>]*)\/?>/gi
                )
            ]
            .map(
                match =>
                    match[1]
            )
            .map(
                attributes =>
                    parseAttributes(
                        attributes
                    )
            )
            .map(
                attributes => ({

                    uuid:
                        attributes.UUID ||
                        attributes.uuid ||
                        null,

                    name:
                        attributes.ZoneName ||
                        attributes.zoneName ||
                        null

                })
            )
            .filter(
                member =>
                    member.name
            );


        return {

            grouped:
                members.length > 1,

            coordinator:
                groupAttributes.Coordinator ||
                groupAttributes.coordinator ||
                null,

            members

        };

    }


    /*
     * If Sonos does not return a group for the player,
     * treat the player as a standalone speaker.
     */

    return {

        grouped:
            false,

        coordinator:
            player.uuid,

        members: [

            {

                uuid:
                    player.uuid,

                name:
                    player.name

            }

        ]

    };

}


/*
 * ============================================================
 * PARSE XML ATTRIBUTES
 * ============================================================
 */

function parseAttributes(
    text
) {

    const attributes = {};


    const regex =
        /([\w:-]+)="([^"]*)"/g;


    let match;


    while (
        (match =
            regex.exec(text)) !== null
    ) {

        attributes[
            match[1]
        ] =
            decodeXml(
                match[2]
            );

    }


    return attributes;

}


/*
 * ============================================================
 * GET SONOS STATUS
 * ============================================================
 *
 * The requested speaker remains the speaker displayed
 * by the widget.
 *
 * If that speaker is part of a group, however, playback
 * information is retrieved from the group's coordinator.
 *
 * Example:
 *
 * Requested speaker:
 *
 *     Kitchen
 *
 * Group:
 *
 *     Family Room  <-- coordinator
 *     Kitchen
 *
 * Playback is therefore queried from Family Room.
 *
 * ============================================================
 */

async function getStatus(
    speakerName
) {

    if (
        !speakerName
        ||
        typeof speakerName !==
            "string"
    ) {

        throw new Error(
            "A Sonos speaker name is required."
        );

    }


    const players =
        await discoverPlayers();


    const player =
        players.find(
            item =>
                item.name.toLowerCase() ===
                speakerName.trim().toLowerCase()
        );


    if (
        !player
    ) {

        throw new Error(
            `Sonos speaker "${speakerName}" was not found.`
        );

    }


    /*
     * Determine whether the requested speaker
     * is part of a group.
     */

    const group =
        await getGroupInfo(
            player
        );


    /*
     * Default to the requested speaker.
     *
     * If grouped, this will be replaced with
     * the group coordinator below.
     */

    let playbackPlayer =
        player;


    if (
        group.grouped &&
        group.coordinator
    ) {

        const coordinator =
            players.find(
                item =>
                    item.uuid ===
                    group.coordinator
            );


        if (
            coordinator
        ) {

            playbackPlayer =
                coordinator;

        }

    }


    /*
     * Retrieve playback information from the
     * appropriate player.
     */

    const track =
        await getCurrentTrack(
            playbackPlayer
        );


    return {

        speaker: {

            name:
                player.name,

            uuid:
                player.uuid,

            address:
                player.address

        },

        state:
            track.state,

        track: {

            title:
                track.title,

            artist:
                track.artist,

            album:
                track.album,

            albumArt:
                track.albumArt

        },

        group

    };

}


/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export {

    discoverPlayers,

    getStatus

};