/**
 * Sync environment variables from root .env.local to apps/mobile/.env.local
 * Converts NEXT_PUBLIC_ to EXPO_PUBLIC_ for Expo compatibility
 */

const fs = require("fs");
const path = require("path");

// __dirname is apps/mobile/scripts, so we need to go up 3 levels to reach workspace root
const rootEnvPath = path.join(__dirname, "..", "..", "..", ".env.local");
const mobileEnvPath = path.join(__dirname, "..", ".env.local");

if (!fs.existsSync(rootEnvPath)) {
  console.error("❌ Root .env.local not found at:", rootEnvPath);
  process.exit(1);
}

const rootEnv = fs.readFileSync(rootEnvPath, "utf8");

// Extract Supabase values
const supabaseUrlMatch = rootEnv.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = rootEnv.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
  console.error("❌ Could not find Supabase variables in root .env.local");
  console.error(
    "   Looking for: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const supabaseUrl = supabaseUrlMatch[1].trim();
const supabaseKey = supabaseKeyMatch[1].trim();

// Create mobile .env.local with EXPO_PUBLIC_ prefix
const mobileEnv = `# Auto-generated from root .env.local
# Sync with: node scripts/sync-env-from-root.js

EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}
`;

fs.writeFileSync(mobileEnvPath, mobileEnv, "utf8");

console.log("✅ Created apps/mobile/.env.local");
console.log("   Copied values from root .env.local");
console.log("   Converted NEXT_PUBLIC_ to EXPO_PUBLIC_");
console.log("");
console.log("📋 Next steps:");
console.log("   1. Restart Metro: pnpm start:clear");
console.log("   2. The 500 error should be fixed!");
