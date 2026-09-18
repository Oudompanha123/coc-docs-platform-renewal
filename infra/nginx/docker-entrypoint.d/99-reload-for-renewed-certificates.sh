#!/bin/sh
# Pick up a renewed certificate without anybody having to remember.
#
# certbot writes new files into the shared volume; nginx goes on using the ones
# it opened at start until it is told otherwise. A reload is cheap and
# connection-safe — workers finish what they are serving and new ones take the
# new certificate.
#
# WHY HERE AND NOT AS A compose `command:`
#
# The obvious shape is `sh -c "nginx & while :; do ... done"`. It does not
# work, quietly: the official entrypoint only runs /docker-entrypoint.d/ when
# its first argument is literally `nginx`, so overriding the command skips the
# template substitution and the certificate bootstrap — nginx then starts with
# an unsubstituted ${PUBLIC_DOMAIN} and no certificate.
#
# Backgrounding from inside a .d script keeps nginx as the foreground process,
# which also means a crashed nginx actually exits the container and
# `restart: unless-stopped` does something. With nginx backgrounded it would
# die and the loop would keep the container alive, looking healthy.
set -eu

(
    while :; do
        sleep 12h
        # Ignore a failure: this runs for the life of the container and a
        # transient reload error must not kill the loop that will get it right
        # tomorrow.
        nginx -s reload 2>/dev/null || true
    done
) &

echo "99-reload-for-renewed-certificates: reloading every 12h to pick up renewals"
