#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="${1:-.deploy/backend.env}"

mkdir -p "$(dirname "$OUTPUT_FILE")"
> "$OUTPUT_FILE"

write_kv() {
  local key="$1"
  local value="${2-}"
  value="${value//$'\r'/}"
  value="${value//$'\n'/\\n}"
  printf '%s=%s\n' "$key" "$value" >> "$OUTPUT_FILE"
}

keys=(
  APPLICATION_NAME
  DB_URL
  DB_USER
  DB_PASSWORD
  DDL_MODE
  GEMINI_API_URL
  GEMINI_API_KEY
  JWT_SECRET
  JWT_ISSUER
  GOOGLE_CLIENT_ID
  AV_MYSQL_DATABASE
  AV_MYSQL_ROOT_PASSWORD
  AV_MYSQL_USER
  AV_MYSQL_PASSWORD
  AV_MYSQL_PORT
  AV_API_PORT
)

for key in "${keys[@]}"; do
  write_kv "$key" "${!key:-}"
done

chmod 600 "$OUTPUT_FILE"
