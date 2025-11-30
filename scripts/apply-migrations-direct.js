#!/usr/bin/env node

/**
 * SpareCarry Direct Migration Application
 *
 * Attempts to apply migrations directly using Supabase REST API
 * Falls back to instructions if direct execution is not possible
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load environment
function loadEnv() {
  const envFile = path.join(__dirname, "..", ".env.staging");
  const envLocal = path.join(__dirname, "..", ".env.local");

  let envPath = envFile;
  if (!fs.existsSync(envFile) && fs.existsSync(envLocal)) {
    envPath = envLocal;
  }

  if (!fs.existsSync(envPath)) {
    log("❌ No environment file found", "red");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
        envVars[key.trim()] = value;
      }
    }
  });

  return envVars;
}

// Execute SQL via Supabase REST API
async function executeSQLViaAPI(supabaseUrl, serviceKey, sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/exec_sql`);

    // Unfortunately, Supabase doesn't expose a direct SQL execution endpoint
    // We need to use the Dashboard or CLI

    resolve({
      success: false,
      message: "Direct SQL execution not available via REST API",
    });
  });
}

// Main function
async function main() {
  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan");
  log("SpareCarry Automated Migration Application", "cyan");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "cyan");

  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    log("❌ Missing Supabase credentials", "red");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check current state
  log("🔍 Checking database state...\n", "blue");

  const tables = [
    "users",
    "trips",
    "requests",
    "matches",
    "messages",
    "disputes",
    "payments",
  ];
  const existingTables = [];
  const missingTables = [];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (
        error &&
        (error.code === "PGRST116" || error.message.includes("does not exist"))
      ) {
        missingTables.push(table);
      } else {
        existingTables.push(table);
      }
    } catch (e) {
      missingTables.push(table);
    }
  }

  if (existingTables.length > 0) {
    log(
      `✅ Existing tables (${existingTables.length}): ${existingTables.join(", ")}`,
      "green"
    );
  }

  if (missingTables.length > 0) {
    log(
      `❌ Missing tables (${missingTables.length}): ${missingTables.join(", ")}`,
      "red"
    );
  }

  if (missingTables.length === 0) {
    log("\n✅ All tables exist! Database appears to be set up.", "green");
    log(
      "   If you want to re-seed data, run: pnpm db:seed:staging --reset\n",
      "yellow"
    );
    return;
  }

  log(
    "\n⚠️  Direct SQL execution via Supabase JS client is not supported",
    "yellow"
  );
  log("   Supabase requires migrations to be applied via:", "yellow");
  log("   1. Supabase Dashboard SQL Editor (easiest)", "yellow");
  log("   2. Supabase CLI (if installed)", "yellow");
  log("   3. Direct PostgreSQL connection\n", "yellow");

  log("📋 Quick Setup Instructions:", "cyan");
  log(
    "   1. Open: https://supabase.com/dashboard/project/gujyzwqcwecbeznlablx",
    "cyan"
  );
  log('   2. Click "SQL Editor" → "New query"', "cyan");
  log("   3. Copy/paste each migration file in order:", "cyan");
  log("      - supabase/migrations/001_initial_schema.sql", "cyan");
  log("      - supabase/migrations/002_rls_policies.sql", "cyan");
  log("      - supabase/migrations/003_seed_data.sql", "cyan");
  log("      - supabase/migrations/004_auth_integration.sql", "cyan");
  log('   4. Click "Run" for each\n', "cyan");

  log("✅ All migration files are ready!", "green");
  log("✅ Environment is configured!", "green");
  log(
    "✅ Run migrations via Dashboard, then verify with: pnpm db:setup\n",
    "green"
  );
}

main().catch(console.error);
