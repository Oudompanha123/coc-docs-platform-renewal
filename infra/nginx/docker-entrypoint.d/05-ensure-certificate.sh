#!/bin/sh
# Make sure nginx has a certificate to start with.
#
# THE PROBLEM THIS SOLVES
#
# nginx refuses to start if `ssl_certificate` names a file that does not
# exist — not a warning, a hard failure. certbot cannot obtain that file until
# nginx is serving the ACME challenge on port 80. Each waits for the other, and
# a first deployment never comes up.
#
# So: if no certificate is present, write a self-signed one at the path nginx
# expects. nginx starts, serves the challenge, certbot replaces the files with
# real ones, and the reload loop in the compose command picks them up.
#
# A browser reaching the site in that window sees a certificate warning. The
# window is the length of one ACME round trip on a first deploy, and never
# again — renewals overwrite files that already exist and this script does
# nothing.
#
# Runs before 20-envsubst-on-templates.sh (hence 05), because it needs
# PUBLIC_DOMAIN from the environment and not from the rendered config.
set -eu

: "${PUBLIC_DOMAIN:?PUBLIC_DOMAIN is not set}"

CERT_DIR="/etc/letsencrypt/live/${PUBLIC_DOMAIN}"

if [ -s "${CERT_DIR}/fullchain.pem" ] && [ -s "${CERT_DIR}/privkey.pem" ]; then
    echo "05-ensure-certificate: certificate present for ${PUBLIC_DOMAIN}"
    exit 0
fi

echo "05-ensure-certificate: no certificate for ${PUBLIC_DOMAIN} yet — writing a temporary self-signed one so nginx can start"
mkdir -p "${CERT_DIR}"

# 1 day, deliberately. Long enough for certbot to do its work on this boot,
# short enough that finding one still in place later is unmistakably a fault
# rather than something that has quietly been serving traffic for a year.

# nginx:alpine links against the OpenSSL library but does not always ship the
# openssl COMMAND — it comes from a separate package. Under `set -e` a missing
# binary killed this script, which killed the entrypoint, so nginx never
# started and port 80 answered "connection refused" — which then failed the
# ACME challenge, which is what sent us looking at DNS and security groups
# rather than at nginx.
if ! command -v openssl >/dev/null 2>&1; then
    echo "05-ensure-certificate: openssl not present, installing it"
    # The entrypoint still runs as root at this point. Best effort: if there is
    # no network yet, say so and let nginx fail with its own message rather
    # than this script's.
    apk add --no-cache openssl >/dev/null 2>&1 || {
        echo "05-ensure-certificate: could not install openssl — nginx cannot start without a certificate" >&2
        exit 1
    }
fi

openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out    "${CERT_DIR}/fullchain.pem" \
    -subj   "/CN=${PUBLIC_DOMAIN}" 2>/dev/null

echo "05-ensure-certificate: temporary certificate written; certbot will replace it"
