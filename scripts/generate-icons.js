#!/usr/bin/env node

/**
 * Generate app icons and splash screens for iOS and Android
 * 
 * Requirements:
 * - ImageMagick installed (brew install imagemagick on Mac)
 * - Source icon: public/icon-source.png (1024x1024px PNG with teal anchor logo)
 * 
 * Usage: node scripts/generate-icons.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SOURCE_ICON = path.join(__dirname, "../public/icon-source.png");
const OUTPUT_DIR = path.join(__dirname, "../assets/icons");

// iOS icon sizes
const IOS_ICONS = [
  { size: 20, scale: 2, name: "icon-20@2x.png" },
  { size: 20, scale: 3, name: "icon-20@3x.png" },
  { size: 29, scale: 2, name: "icon-29@2x.png" },
  { size: 29, scale: 3, name: "icon-29@3x.png" },
  { size: 40, scale: 2, name: "icon-40@2x.png" },
  { size: 40, scale: 3, name: "icon-40@3x.png" },
  { size: 60, scale: 2, name: "icon-60@2x.png" },
  { size: 60, scale: 3, name: "icon-60@3x.png" },
  { size: 76, scale: 1, name: "icon-76.png" },
  { size: 76, scale: 2, name: "icon-76@2x.png" },
  { size: 83.5, scale: 2, name: "icon-83.5@2x.png" },
  { size: 1024, scale: 1, name: "icon-1024.png" },
];

// Android icon sizes (mipmap folders)
const ANDROID_ICONS = {
  mipmap-mdpi: [
    { size: 48, name: "ic_launcher.png" },
    { size: 48, name: "ic_launcher_round.png" },
  ],
  "mipmap-hdpi": [
    { size: 72, name: "ic_launcher.png" },
    { size: 72, name: "ic_launcher_round.png" },
  ],
  "mipmap-xhdpi": [
    { size: 96, name: "ic_launcher.png" },
    { size: 96, name: "ic_launcher_round.png" },
  ],
  "mipmap-xxhdpi": [
    { size: 144, name: "ic_launcher.png" },
    { size: 144, name: "ic_launcher_round.png" },
  ],
  "mipmap-xxxhdpi": [
    { size: 192, name: "ic_launcher.png" },
    { size: 192, name: "ic_launcher_round.png" },
  ],
};

// Web icons
const WEB_ICONS = [
  { size: 192, name: "icon-192x192.png" },
  { size: 512, name: "icon-512x512.png" },
];

function checkImageMagick() {
  try {
    execSync("which convert", { stdio: "ignore" });
    return true;
  } catch {
    console.error("❌ ImageMagick not found. Install with: brew install imagemagick");
    return false;
  }
}

function checkSourceIcon() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`❌ Source icon not found: ${SOURCE_ICON}`);
    console.error("   Please create a 1024x1024px PNG with your teal anchor logo");
    return false;
  }
  return true;
}

function generateIcon(input, output, size, round = false) {
  const sizeStr = `${size}x${size}`;
  const roundCmd = round ? "-alpha set \\( +clone -distort DePolar 0 -virtual-pixel HorizontalTile -background \"#14b8a6\" -distort Polar 0 \\) -alpha off -compose CopyOpacity -composite" : "";
  
  try {
    if (round) {
      // Create rounded icon
      execSync(
        `convert "${input}" -resize ${sizeStr} -alpha set \\( +clone -distort DePolar 0 -virtual-pixel HorizontalTile -background "#14b8a6" -distort Polar 0 \\) -alpha off -compose CopyOpacity -composite "${output}"`,
        { stdio: "ignore" }
      );
    } else {
      // Create square icon
      execSync(
        `convert "${input}" -resize ${sizeStr} "${output}"`,
        { stdio: "ignore" }
      );
    }
    console.log(`✓ Generated ${output}`);
  } catch (error) {
    console.error(`✗ Failed to generate ${output}:`, error.message);
  }
}

function main() {
  console.log("🎨 Generating SpareCarry app icons...\n");

  if (!checkImageMagick()) {
    process.exit(1);
  }

  if (!checkSourceIcon()) {
    process.exit(1);
  }

  // Create output directories
  const iosDir = path.join(__dirname, "../ios/App/App/Assets.xcassets/AppIcon.appiconset");
  const androidBaseDir = path.join(__dirname, "../android/app/src/main/res");

  // Generate iOS icons
  console.log("📱 Generating iOS icons...");
  IOS_ICONS.forEach(({ size, scale, name }) => {
    const outputSize = size * scale;
    const outputPath = path.join(iosDir, name);
    generateIcon(SOURCE_ICON, outputPath, outputSize);
  });

  // Generate Android icons
  console.log("\n🤖 Generating Android icons...");
  Object.entries(ANDROID_ICONS).forEach(([folder, icons]) => {
    const folderPath = path.join(androidBaseDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    icons.forEach(({ size, name }) => {
      const outputPath = path.join(folderPath, name);
      const isRound = name.includes("round");
      generateIcon(SOURCE_ICON, outputPath, size, isRound);
    });
  });

  // Generate web icons
  console.log("\n🌐 Generating web icons...");
  const webDir = path.join(__dirname, "../public");
  WEB_ICONS.forEach(({ size, name }) => {
    const outputPath = path.join(webDir, name);
    generateIcon(SOURCE_ICON, outputPath, size);
  });

  console.log("\n✅ Icon generation complete!");
  console.log("\nNext steps:");
  console.log("1. Review generated icons in ios/App/App/Assets.xcassets/AppIcon.appiconset");
  console.log("2. Review generated icons in android/app/src/main/res/mipmap-*/");
  console.log("3. Run: npm run capacitor:sync");
}

main();

