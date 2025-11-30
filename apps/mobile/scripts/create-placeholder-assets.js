/**
 * Create placeholder assets for Expo app
 * Generates simple colored PNG images for icon, splash, and adaptive-icon
 */

const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple 1x1 PNG in base64 (teal color #14b8a6)
// This is a minimal valid PNG
const minimalPNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// For a proper icon, we'll create a larger placeholder
// Using a simple approach: create a 1024x1024 PNG with teal background
function createPlaceholderPNG(width, height, filename) {
  // Create a simple SVG and convert to PNG would be ideal, but for now
  // we'll create a minimal valid PNG file
  // In production, you'd want to use a proper image library

  // For now, create a minimal PNG file
  // This is a 1x1 transparent PNG - Expo will handle resizing
  const pngData = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const filePath = path.join(assetsDir, filename);
  fs.writeFileSync(filePath, pngData);
  console.log(`Created placeholder: ${filename}`);
}

// Create all required assets
createPlaceholderPNG(1024, 1024, "icon.png");
createPlaceholderPNG(1024, 1024, "adaptive-icon.png");
createPlaceholderPNG(1242, 2436, "splash.png");
createPlaceholderPNG(48, 48, "favicon.png");

// Create sounds directory if needed
const soundsDir = path.join(assetsDir, "sounds");
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log("Created sounds directory (add .wav files manually)");
}

console.log("Placeholder assets created successfully!");
console.log(
  "Note: Replace these with actual app icons and splash screens before production."
);
