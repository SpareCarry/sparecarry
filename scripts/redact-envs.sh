#!/usr/bin/env bash

set -e

FILES=$(grep -IlR --exclude-dir=.git -E "(NEXT_PUBLIC_SENTRY_DSN|SENTRY_AUTH_TOKEN|SENTRY_DSN|STRIPE_SECRET|STRIPE_KEY|DATABASE_URL|SUPABASE_URL|SUPABASE_SERVICE_ROLE)" || true)

for f in $FILES; do
  cp "$f" "$f.bak"
  sed -E -i "s/(NEXT_PUBLIC_SENTRY_DSN=).*/\1__REDACTED__/" "$f"
  sed -E -i "s/(SENTRY_AUTH_TOKEN=).*/\1__REDACTED__/" "$f"
  sed -E -i "s/(SENTRY_DSN=).*/\1__REDACTED__/" "$f"
  sed -E -i "s/(STRIPE_.*=).*/\1__REDACTED__/" "$f"
  sed -E -i "s/(DATABASE_URL=).*/\1__REDACTED__/" "$f"
  sed -E -i "s/(SUPABASE_URL=).*/\1__REDACTED__/" "$f"
  sed -E -i "s/(SUPABASE_SERVICE_ROLE=).*/\1__REDACTED__/" "$f"

done

echo "Redaction complete; backups saved with .bak suffix"
exit 0
