#!/usr/bin/env bash
# Usage:
#   ./scripts/gen-promo.sh <plan> <count> [label]
#
# Examples:
#   ./scripts/gen-promo.sh monthly 10
#   ./scripts/gen-promo.sh trial7 50 "7天体验"
#   ./scripts/gen-promo.sh yearly 1 "年卡送礼"
#
# Requires:
#   ADMIN_SECRET  — same value as your Vercel env var
#   SITE_URL      — e.g. https://yourapp.vercel.app  (no trailing slash)
#
# Set them inline or export them first:
#   ADMIN_SECRET=xxx SITE_URL=https://yourapp.vercel.app ./scripts/gen-promo.sh monthly 5

PLAN="${1:-monthly}"
COUNT="${2:-1}"
LABEL="${3:-}"

if [ -z "$ADMIN_SECRET" ]; then
  echo "Error: ADMIN_SECRET is not set"
  exit 1
fi
if [ -z "$SITE_URL" ]; then
  echo "Error: SITE_URL is not set (e.g. https://yourapp.vercel.app)"
  exit 1
fi

BODY=$(printf '{"secret":"%s","plan":"%s","count":%s,"label":"%s"}' \
  "$ADMIN_SECRET" "$PLAN" "$COUNT" "$LABEL")

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  "${SITE_URL}/api/admin/promo" | python3 -m json.tool
