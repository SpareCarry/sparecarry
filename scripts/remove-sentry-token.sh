#!/bin/bash
# Script to remove Sentry token from git history
# Note: Token has been removed from all files. This script is kept for reference only.
# If you need to remove secrets from git history, use:
# git filter-repo --replace-text <(echo 'OLD_SECRET==>NEW_PLACEHOLDER')

echo "Note: Sentry token has already been removed from all files."
echo "If you need to remove other secrets, use git-filter-repo instead."

