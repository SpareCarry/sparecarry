#!/bin/bash
# iOS Release Script
# Builds and uploads iOS app to TestFlight or App Store

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting iOS Release Process${NC}"

# Check for required environment variables
if [ -z "$APPLE_ID" ]; then
  echo -e "${RED}❌ Error: APPLE_ID environment variable is not set${NC}"
  exit 1
fi

if [ -z "$APPLE_TEAM_ID" ]; then
  echo -e "${RED}❌ Error: APPLE_TEAM_ID environment variable is not set${NC}"
  exit 1
fi

# Parse track argument
TRACK=${1:-beta}

if [ "$TRACK" != "beta" ] && [ "$TRACK" != "release" ]; then
  echo -e "${RED}❌ Error: Invalid track. Use 'beta' or 'release'${NC}"
  exit 1
fi

echo -e "${YELLOW}📦 Building Next.js app...${NC}"
pnpm build

echo -e "${YELLOW}✅ Validating export...${NC}"
pnpm validate:export

echo -e "${YELLOW}🔄 Syncing Capacitor...${NC}"
pnpm mobile:sync

echo -e "${YELLOW}🍎 Installing CocoaPods dependencies...${NC}"
cd ios/App/App
pod install
cd ../../..

echo -e "${YELLOW}🔨 Building iOS app...${NC}"
cd ios

# Run Fastlane
if [ "$TRACK" == "release" ]; then
  echo -e "${YELLOW}⚠️  WARNING: This will upload to App Store. Continue? (y/n)${NC}"
  read -r response
  if [ "$response" != "y" ]; then
    echo -e "${RED}❌ Release cancelled${NC}"
    exit 1
  fi
  fastlane ios release
else
  fastlane ios beta
fi

echo -e "${GREEN}✅ iOS release complete!${NC}"
if [ "$TRACK" == "beta" ]; then
  echo -e "${GREEN}📱 Build uploaded to TestFlight${NC}"
else
  echo -e "${GREEN}📱 Build uploaded to App Store Connect${NC}"
fi

cd ..

