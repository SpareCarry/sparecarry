#!/bin/bash
# Script to remove Sentry token from git history

# Replace the token with placeholder in all commits
git filter-branch --force --tree-filter '
if [ -f vercel-env-variables.env ]; then
  sed -i "s/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/your_sentry_auth_token_here/g" vercel-env-variables.env
fi
if [ -f SENTRY_ENV_SETUP.md ]; then
  sed -i "s/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/your_sentry_auth_token_here/g" SENTRY_ENV_SETUP.md
fi
if [ -f SENTRY_ENV_SUMMARY.md ]; then
  sed -i "s/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/your_sentry_auth_token_here/g" SENTRY_ENV_SUMMARY.md
fi
' --prune-empty --tag-name-filter cat -- --all

