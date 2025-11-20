#!/bin/bash

# CarrySpace Mobile App Setup Script
# This script sets up Capacitor and syncs platforms

set -e

echo "🚀 Setting up CarrySpace Mobile App..."

# Check if out folder exists
if [ ! -d "out" ]; then
    echo "📦 Building Next.js app..."
    npm run build
fi

echo "🔄 Syncing Capacitor..."
npx cap sync

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  iOS:   npx cap open ios"
echo "  Android: npx cap open android"
echo ""
echo "For detailed instructions, see docs/MOBILE_DEPLOYMENT.md"

