/**
 * Enable verbose console logging for Metro bundler
 * This ensures all console.log/error/warn appear in terminal
 */

const fs = require("fs");
const path = require("path");

console.log("✅ Console logging is enabled by default in Metro bundler");
console.log("");
console.log("📋 To see errors:");
console.log("   1. Run: cd apps/mobile && pnpm start");
console.log("   2. All console.log/error/warn will appear in that terminal");
console.log("   3. Look for lines with [MOBILE], [404], or ERROR");
console.log("");
console.log("💡 Tip: Use console.error() for errors - they appear in red");
console.log("💡 Tip: Use console.warn() for warnings - they appear in yellow");
console.log(
  "💡 Tip: All logs appear in the Metro bundler terminal automatically"
);
