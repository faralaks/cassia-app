#!/bin/sh
set -e

# Runs from /docker-entrypoint.d/ (the nginx base image executes everything
# there before starting the server). Patches the runtime config from
# environment variables, so a single generic image can be pointed at any
# homeserver without a rebuild:
#
#   docker run -e CASSIA_HOMESERVER=matrix.example.org ...
#
# CASSIA_HOMESERVER → config.json "preferredHomeserver" (pinned first in the
# login server picker and preselected on first login).

CONFIG_FILE="/app/config.json"

if [ -n "$CASSIA_HOMESERVER" ] && [ -f "$CONFIG_FILE" ]; then
  echo "[cassia] setting preferredHomeserver=$CASSIA_HOMESERVER in $CONFIG_FILE"
  tmp="$(mktemp)"
  jq --arg hs "$CASSIA_HOMESERVER" '.preferredHomeserver = $hs' "$CONFIG_FILE" > "$tmp"
  cat "$tmp" > "$CONFIG_FILE"
  rm -f "$tmp"
  # nginx workers run as the unprivileged 'nginx' user; keep it world-readable.
  chmod 644 "$CONFIG_FILE"
fi
