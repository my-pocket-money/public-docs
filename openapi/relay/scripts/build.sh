#!/usr/bin/env bash
# Bundles the source contract into the public release contract and checks it
# against the locked release/openapi.yaml. With --write, replaces the lock
# with the bundle instead of checking it, for after a reviewed source change.
set -euo pipefail

export REDOCLY_TELEMETRY=off REDOCLY_SUPPRESS_UPDATE_NOTICE=true

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly RELAY_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly REPO_ROOT="$(cd -- "${RELAY_DIR}/../.." && pwd)"
readonly REDOCLY="${REPO_ROOT}/node_modules/.bin/redocly"
readonly REDOCLY_CONFIG="${RELAY_DIR}/redocly.yaml"
readonly LOCKED_RELEASE_SPEC="${RELAY_DIR}/release/openapi.yaml"

# This repository is public. Unreleased operations stay out of it entirely,
# rather than living in the source marked for removal at bundle time.
if grep -n 'x-release-status' "${RELAY_DIR}/openapi.yaml"; then
  echo "openapi.yaml marks unreleased surface (x-release-status); keep it out of this public repository" >&2
  exit 1
fi

OUTPUT_DIR="$(mktemp -d)"
readonly OUTPUT_DIR
trap 'rm -rf -- "${OUTPUT_DIR}"' EXIT
readonly RELEASE_SPEC="${OUTPUT_DIR}/openapi.yaml"

"${REDOCLY}" bundle \
  "${RELAY_DIR}/openapi.yaml" \
  --config "${REDOCLY_CONFIG}" \
  --remove-unused-components \
  --output "${RELEASE_SPEC}"

"${REDOCLY}" lint \
  "${RELEASE_SPEC}" \
  --config "${REDOCLY_CONFIG}"

if [[ "${1:-}" == "--write" ]]; then
  cp -- "${RELEASE_SPEC}" "${LOCKED_RELEASE_SPEC}"
fi

node "${SCRIPT_DIR}/check-release.mjs" \
  "${RELEASE_SPEC}" \
  "${LOCKED_RELEASE_SPEC}"
