#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly OUTPUT_DIR="${REPO_ROOT}/dist"
readonly RELEASE_SPEC="${OUTPUT_DIR}/openapi.yaml"
readonly LOCKED_RELEASE_SPEC="${REPO_ROOT}/release/openapi.yaml"
readonly REDOCLY_CONFIG="${REPO_ROOT}/redocly.yaml"

rm -rf -- "${OUTPUT_DIR}"
mkdir -p -- "${OUTPUT_DIR}"

"${REPO_ROOT}/node_modules/.bin/redocly" bundle \
  "${REPO_ROOT}/openapi.yaml" \
  --config "${REDOCLY_CONFIG}" \
  --remove-unused-components \
  --output "${RELEASE_SPEC}"

"${REPO_ROOT}/node_modules/.bin/redocly" lint \
  "${RELEASE_SPEC}" \
  --config "${REDOCLY_CONFIG}"

node "${SCRIPT_DIR}/check-release.mjs" \
  "${RELEASE_SPEC}" \
  "${LOCKED_RELEASE_SPEC}"

"${REPO_ROOT}/node_modules/.bin/redocly" build-docs \
  "${RELEASE_SPEC}" \
  --output "${OUTPUT_DIR}/index.html"
