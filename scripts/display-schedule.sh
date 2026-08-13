#!/bin/bash

CHROMIUM="/usr/bin/chromium"
URL="http://localhost:3000"

export XDG_RUNTIME_DIR="/run/user/1000"
export WAYLAND_DISPLAY="wayland-0"

is_chromium_running() {
    pgrep -x chromium >/dev/null
}

start_dashboard() {
    if ! is_chromium_running; then
        "$CHROMIUM" \
            --ozone-platform=wayland \
            --kiosk \
            --noerrdialogs \
            --disable-infobars \
            --start-maximized \
            --password-store=basic \
            "$URL" >/tmp/family-dashboard-chromium.log 2>&1 &
    fi
}

stop_dashboard() {
    if is_chromium_running; then
        pkill -x chromium
    fi
}

DAY=$(date +%u)
TIME=$(date +%H%M)

SHOULD_BE_ON=0

case "$DAY" in

    1|2|3|4|5)
        # Monday-Friday
        if [[ "$TIME" > "0559" && "$TIME" < "0900" ]] ||
           [[ "$TIME" > "1459" && "$TIME" < "2000" ]]; then
            SHOULD_BE_ON=1
        fi
        ;;

    6|7)
        # Saturday-Sunday
        if [[ "$TIME" > "0659" && "$TIME" < "0900" ]] ||
           [[ "$TIME" > "1559" && "$TIME" < "1800" ]]; then
            SHOULD_BE_ON=1
        fi
        ;;

esac

if [[ "$SHOULD_BE_ON" -eq 1 ]]; then
    start_dashboard
else
    stop_dashboard
fi
