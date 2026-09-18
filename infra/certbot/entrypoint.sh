#!/bin/sh
# Obtain a certificate, then renew it for the life of the container.
#
# WHY THE PLACEHOLDER IS REMOVED FIRST
#
# nginx will not start without a certificate, so 05-ensure-certificate.sh
# writes a self-signed one at the exact path nginx is configured to read:
#
#   /etc/letsencrypt/live/<domain>/
#
# certbot then finds that directory already occupied, declines to touch it, and
# creates a second lineage beside it:
#
#   live directory exists for <domain>
#   Certificate is saved at: /etc/letsencrypt/live/<domain>-0001/fullchain.pem
#
# Which succeeds, and changes nothing: nginx goes on serving the self-signed
# placeholder from the original path while the real certificate sits unused in
# a directory nothing reads. A browser still shows a warning, and the only
# clue is a "-0001" nobody is looking at.
#
# So a placeholder is deleted before requesting. Safe at this point because
# nginx read the certificate into memory when it started — removing the files
# does not interrupt what it is currently serving, and the reload after
# issuance picks up the real one.
#
# Distinguished from a real lineage by its renewal config: certbot writes
# /etc/letsencrypt/renewal/<domain>.conf and the placeholder script does not.
# Nothing certbot created is ever removed here.
set -eu

: "${PUBLIC_DOMAIN:?PUBLIC_DOMAIN is not set}"
: "${ACME_EMAIL:?ACME_EMAIL is not set}"

STAGING=""
if [ "${CERTBOT_STAGING:-0}" = "1" ]; then
    STAGING="--staging"
    echo "certbot: using Let's Encrypt STAGING — browsers will not trust the result"
fi

# Wait until nginx is actually serving before touching its certificate.
#
# depends_on: service_started waits for the CONTAINER to start, not for its
# entrypoint to finish — and nginx's entrypoint is where the placeholder gets
# written (05-ensure-certificate.sh). Deleting first therefore races: certbot
# removes the placeholder, nginx writes it back, and certbot then refuses:
#
#   live directory exists for <domain>
#
# nginx binds port 80 only after its entrypoint scripts complete, so a
# successful connection there means the placeholder is already written and will
# not reappear.
python - <<'PY'
import socket, sys, time
for _ in range(90):
    try:
        socket.create_connection(("nginx", 80), 2).close()
        sys.exit(0)
    except OSError:
        time.sleep(2)
print("certbot: nginx did not start serving within 3 minutes", file=sys.stderr)
sys.exit(1)
PY

if [ ! -f "/etc/letsencrypt/renewal/${PUBLIC_DOMAIN}.conf" ] \
   && [ -d "/etc/letsencrypt/live/${PUBLIC_DOMAIN}" ]; then
    echo "certbot: removing the self-signed placeholder so the real certificate can take its path"
    rm -rf "/etc/letsencrypt/live/${PUBLIC_DOMAIN}" \
           "/etc/letsencrypt/archive/${PUBLIC_DOMAIN}"
fi

# --cert-name pins the lineage to the bare domain, so even if something else
# ever occupies the path the certificate does not silently land on -0001 again.
#
# --keep-until-expiring makes this safe to re-run: a restarted container does
# not re-issue and burn the rate limit.
certbot certonly --webroot -w /var/www/certbot \
    -d "${PUBLIC_DOMAIN}" \
    --cert-name "${PUBLIC_DOMAIN}" \
    --email "${ACME_EMAIL}" \
    --agree-tos --no-eff-email \
    --keep-until-expiring --non-interactive ${STAGING} \
    || echo "certbot: could not obtain a certificate yet — check DNS and that port 80 is open; retrying in 12h"

while :; do
    sleep 12h
    certbot renew --webroot -w /var/www/certbot --non-interactive ${STAGING} || true
done
