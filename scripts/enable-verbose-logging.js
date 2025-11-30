/**
 * Enable verbose logging for Next.js development server
 * Run this before starting the dev server to see all errors in terminal
 */

const fs = require("fs");
const path = require("path");

const envLocalPath = path.join(__dirname, "..", ".env.local");

// Read existing .env.local or create new
let envContent = "";
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, "utf-8");
}

// Add verbose logging flags
const verboseFlags = `
# Verbose Error Logging (added by enable-verbose-logging.js)
NEXT_DEBUG=1
NODE_OPTIONS=--trace-warnings
`;

// Check if flags already exist
if (!envContent.includes("NEXT_DEBUG=1")) {
  envContent += verboseFlags;
  fs.writeFileSync(envLocalPath, envContent, "utf-8");
  console.log("✅ Verbose logging enabled in .env.local");
  console.log("   Restart your dev server to see detailed errors");
} else {
  console.log("✅ Verbose logging already enabled");
}

console.log("\n📋 To see errors in terminal:");
console.log("   1. Restart dev server: pnpm dev:web");
console.log("   2. All 404s and errors will now appear in terminal");
console.log("   3. Check the terminal output for detailed error messages");
