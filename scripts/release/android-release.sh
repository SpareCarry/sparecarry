#!/bin/bash
# Android Release Script
# Builds and uploads Android app to Play Console

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Android Release Process${NC}"

# Check for required environment variables
if [ -z "$GOOGLE_PLAY_JSON_KEY_FILE" ]; then
  echo -e "${RED}❌ Error: GOOGLE_PLAY_JSON_KEY_FILE environment variable is not set${NC}"
  echo "Please set it to the path of your Google Play service account JSON key file"
  exit 1
fi

# Check if JSON key file exists
if [ ! -f "$GOOGLE_PLAY_JSON_KEY_FILE" ]; then
  echo -e "${RED}❌ Error: Google Play JSON key file not found at: $GOOGLE_PLAY_JSON_KEY_FILE${NC}"
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

echo -e "${YELLOW}🔨 Building Android release...${NC}"
cd android

# Clean previous builds
./gradlew clean

# Build release bundle
./gradlew bundleRelease

echo -e "${YELLOW}📤 Uploading to Play Console ($TRACK track)...${NC}"

# Run Fastlane
if [ "$TRACK" == "release" ]; then
  fastlane android release
else
  fastlane android beta
fi

echo -e "${GREEN}✅ Android release complete!${NC}"
echo -e "${GREEN}📱 Build uploaded to Play Console ($TRACK track)${NC}"

cd ..

