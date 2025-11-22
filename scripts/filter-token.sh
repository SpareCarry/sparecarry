#!/bin/bash
# Remove Sentry token from git history

TOKEN="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"
REPLACEMENT="your_sentry_auth_token_here"

git filter-branch --force --tree-filter "
if [ -f vercel-env-variables.env ]; then
  sed -i 's/$TOKEN/$REPLACEMENT/g' vercel-env-variables.env 2>/dev/null || true
fi
if [ -f SENTRY_ENV_SETUP.md ]; then
  sed -i 's/$TOKEN/$REPLACEMENT/g' SENTRY_ENV_SETUP.md 2>/dev/null || true
fi
if [ -f SENTRY_ENV_SUMMARY.md ]; then
  sed -i 's/$TOKEN/$REPLACEMENT/g' SENTRY_ENV_SUMMARY.md 2>/dev/null || true
fi
" --prune-empty --tag-name-filter cat -- --all

