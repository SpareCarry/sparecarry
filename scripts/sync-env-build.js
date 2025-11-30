#!/usr/bin/env node

/**
 * Sync Environment Variables to Build
 *
 * Reads .env.staging or .env.production and injects into build
 * Usage: node scripts/sync-env-build.js [staging|production]
 */

const fs = require("fs");
const path = require("path");

const envName = process.argv[2] || "staging";
const envFile = path.join(__dirname, "..", `.env.${envName}`);

if (!fs.existsSync(envFile)) {
  console.error(`❌ Environment file not found: ${envFile}`);
  console.error(`   Create it from .env.local.example`);
  process.exit(1);
}

// Read environment file
const envContent = fs.readFileSync(envFile, "utf-8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  line = line.trim();
  if (line && !line.startsWith("#")) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      // Remove quotes if present
      envVars[key.trim()] = value.replace(/^["']|["']$/g, "");
    }
  }
});

// Validate required variables
const required = [
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const missing = required.filter((key) => !envVars[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables:`);
  missing.forEach((key) => console.error(`   - ${key}`));
  process.exit(1);
}

// Export for build
console.log(`✅ Environment variables loaded from ${envFile}`);
console.log(`\nEnvironment: ${envVars.NEXT_PUBLIC_APP_ENV}`);
console.log(`App URL: ${envVars.NEXT_PUBLIC_APP_URL}`);
console.log(`Supabase URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL ? "✅" : "❌"}`);

// Write to .env.build for use in build process
const buildEnvFile = path.join(__dirname, "..", ".env.build");
const buildEnvContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join("\n");

fs.writeFileSync(buildEnvFile, buildEnvContent);
console.log(`\n✅ Wrote build environment to .env.build`);

// Also set as process.env for immediate use
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

console.log(`\n✅ Environment synced for ${envName} build`);
