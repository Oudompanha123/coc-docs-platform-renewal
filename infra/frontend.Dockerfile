# Coc Docs Platform — the frontend, built and run.
#
# Context is the repository root:
#
#   docker build -f infra/frontend.Dockerfile .

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
# The lock file, not just package.json: `npm ci` installs exactly what was
# tested, and fails loudly if the two disagree. `npm install` would quietly
# resolve something newer on the server than on anybody's machine.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./

# WHY THESE ARE BUILD ARGUMENTS AND NOT RUNTIME ENVIRONMENT
#
# Next.js inlines every NEXT_PUBLIC_* value into the JavaScript it emits, at
# build time. They are not read from the environment when the server starts —
# by then they are already string literals inside the bundle the browser
# downloads. Passing them to `docker compose up` would change nothing at all,
# silently, which is the failure this comment exists to prevent.
#
# So: changing any of these means rebuilding the image.
#
#   docker compose build frontend && docker compose up -d frontend
#
# None of them are secrets. A Firebase web config and a Keycloak client id are
# designed to ship inside a public browser bundle; what protects those systems
# is the service-account key and the client secret, and neither is here.
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL \
    NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL \
    NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM \
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
    NEXT_PUBLIC_FIREBASE_VAPID_KEY=$NEXT_PUBLIC_FIREBASE_VAPID_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

# Lint and type-check are skipped here (next.config.ts) — they run in CI and
# locally, and inside this container they exhausted the server's memory. The
# heap cap is raised for the compile itself, which on a small instance would
# otherwise stop at Node's default (~450 MB seen on the deploy host). Keep it
# below the machine's RAM + swap, or the kernel kills the build instead.
ENV NEXT_SKIP_BUILD_CHECKS=1 \
    NODE_OPTIONS=--max-old-space-size=1536

RUN npm run build

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
FROM node:22-alpine AS run
WORKDIR /app

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

# The standalone bundle (next.config.ts `output: "standalone"`) plus the two
# things Next deliberately leaves out of it, because they are served rather
# than imported: the static chunks and public/. Without them the pages render
# and every asset 404s.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# node:alpine already ships an unprivileged `node` user.
USER node

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
