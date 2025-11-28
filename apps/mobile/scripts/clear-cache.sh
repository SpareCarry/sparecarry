#!/bin/bash
# Clear Metro bundler cache for pnpm workspace

echo "🧹 Clearing Metro bundler cache..."

# Clear Metro cache
rm -rf .expo
rm -rf node_modules/.cache
rm -rf ../../node_modules/.cache

# Clear watchman if installed
if command -v watchman &> /dev/null; then
  watchman watch-del-all
fi

echo "✅ Cache cleared!"
echo "Now run: pnpm start"

