#!/usr/bin/env node

/**
 * Generate splash screens for iOS and Android
 * 
 * Requirements:
 * - ImageMagick installed (brew install imagemagick on Mac)
 * - Source splash: public/splash-source.png (2732x2732px PNG with teal anchor logo centered)
 * 
 * Usage: node scripts/generate-splash.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SOURCE_SPLASH = path.join(__dirname, "../public/splash-source.png");
const TEAL_COLOR = "#14b8a6";

// iOS splash screen sizes
const IOS_SPLASH = [
  { width: 640, height: 1136, name: "Default-568h@2x~iphone.png" }, // iPhone 5
  { width: 750, height: 1334, name: "Default-667h.png" }, // iPhone 6/7/8
  { width: 828, height: 1792, name: "Default-828h-1792h.png" }, // iPhone XR
  { width: 1242, height: 2208, name: "Default-736h.png" }, // iPhone 6+/7+/8+
  { width: 1125, height: 2436, name: "Default-1125h-2436h.png" }, // iPhone X/XS
  { width: 1242, height: 2688, name: "Default-1242h-2688h.png" }, // iPhone XS Max
  { width: 1536, height: 2048, name: "Default-Portrait@2x~ipad.png" }, // iPad
  { width: 2048, height: 2732, name: "Default-Portrait@~ipadpro.png" }, // iPad Pro
];

// Android splash screen sizes
const ANDROID_SPLASH = {
  "drawable-mdpi": { width: 320, height: 480 },
  "drawable-hdpi": { width: 480, height: 800 },
  "drawable-xhdpi": { width: 720, height: 1280 },
  "drawable-xxhdpi": { width: 1080, height: 1920 },
  "drawable-xxxhdpi": { width: 1440, height: 2560 },
};

function checkImageMagick() {
  try {
    execSync("which convert", { stdio: "ignore" });
    return true;
  } catch {
    console.error("❌ ImageMagick not found. Install with: brew install imagemagick");
    return false;
  }
}

function checkSourceSplash() {
  if (!fs.existsSync(SOURCE_SPLASH)) {
    console.error(`❌ Source splash not found: ${SOURCE_SPLASH}`);
    console.error("   Please create a 2732x2732px PNG with your teal anchor logo centered");
    return false;
  }
  return true;
}

function generateSplash(input, output, width, height) {
  try {
    // Create splash with teal background and centered logo
    execSync(
      `convert -size ${width}x${height} xc:"${TEAL_COLOR}" "${input}" -gravity center -composite "${output}"`,
      { stdio: "ignore" }
    );
    console.log(`✓ Generated ${output} (${width}x${height})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${output}:`, error.message);
  }
}

function main() {
  console.log("🎨 Generating SpareCarry splash screens...\n");

  if (!checkImageMagick()) {
    process.exit(1);
  }

  if (!checkSourceSplash()) {
    process.exit(1);
  }

  // Create output directories
  const iosDir = path.join(__dirname, "../ios/App/App/Assets.xcassets/Splash.imageset");
  const androidBaseDir = path.join(__dirname, "../android/app/src/main/res");

  // Generate iOS splash screens
  console.log("📱 Generating iOS splash screens...");
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }
  IOS_SPLASH.forEach(({ width, height, name }) => {
    const outputPath = path.join(iosDir, name);
    generateSplash(SOURCE_SPLASH, outputPath, width, height);
  });

  // Generate Android splash screens
  console.log("\n🤖 Generating Android splash screens...");
  Object.entries(ANDROID_SPLASH).forEach(([folder, { width, height }]) => {
    const folderPath = path.join(androidBaseDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const outputPath = path.join(folderPath, "splash.png");
    generateSplash(SOURCE_SPLASH, outputPath, width, height);
  });

  console.log("\n✅ Splash screen generation complete!");
  console.log("\nNext steps:");
  console.log("1. Review generated splash screens");
  console.log("2. Run: npm run capacitor:sync");
}

main();

