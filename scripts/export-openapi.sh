#!/usr/bin/env bash
# Export OpenAPI Contract Script
# Regenerates docs/api/openapi.yaml from a running backend instance, so the
# committed contract can never silently drift from the annotated controllers
# that actually produce it (RISK-018; see backend/src/main/java/com/coc/docs/config/OpenApiConfig.java).
#
# Usage:
#   backend: mvn spring-boot:run   (needs a reachable Postgres; see CONTRIBUTING.md)
#   scripts/export-openapi.sh [backend-url]
#
# Environment variables:
#   BACKEND_URL=http://localhost:8080   # override for a non-default port/host

set -euo pipefail

BACKEND_URL="${1:-${BACKEND_URL:-http://localhost:8080}}"
OUT_FILE="docs/api/openapi.yaml"

echo "[export-openapi] Fetching ${BACKEND_URL}/v3/api-docs.yaml ..."
curl -fsS "${BACKEND_URL}/v3/api-docs.yaml" -o "${OUT_FILE}.tmp"

mv "${OUT_FILE}.tmp" "${OUT_FILE}"
echo "[export-openapi] Wrote ${OUT_FILE}"
echo "[export-openapi] Review the diff, then commit it alongside whatever controller change prompted it."
