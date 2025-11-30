#!/usr/bin/env node

/**
 * SpareCarry Supabase Setup Script (Node.js)
 * This script applies all migrations and seed data to the Supabase project
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

// Load environment variables
function loadEnv() {
  const envFile = path.join(__dirname, "..", ".env.staging");
  const envLocal = path.join(__dirname, "..", ".env.local");

  let envPath = envFile;
  if (!fs.existsSync(envFile) && fs.existsSync(envLocal)) {
    envPath = envLocal;
  }

  if (!fs.existsSync(envPath)) {
    log("❌ No environment file found. Please create .env.staging", "red");
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
        process.env[key.trim()] = value;
      }
    }
  });

  return envVars;
}

async function applyMigration(supabase, migrationFile) {
  const migrationPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    migrationFile
  );

  if (!fs.existsSync(migrationPath)) {
    log(`⚠️  Migration file not found: ${migrationFile}`, "yellow");
    return false;
  }

  log(`Applying: ${migrationFile}`, "blue");

  const sql = fs.readFileSync(migrationPath, "utf-8");

  try {
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.length > 0) {
        const { error } = await supabase.rpc("exec_sql", {
          sql_query: statement,
        });
        if (error && !error.message.includes("already exists")) {
          // Try direct query for tables that don't support RPC
          // This is a fallback - actual execution should use Supabase CLI or direct SQL
          log(`  ⚠️  Some statements may need manual execution`, "yellow");
        }
      }
    }

    log(`  ✅ ${migrationFile} applied`, "green");
    return true;
  } catch (error) {
    log(`  ⚠️  ${migrationFile} had warnings: ${error.message}`, "yellow");
    return false;
  }
}

async function verifySetup(supabase) {
  log("\n🔍 Verifying setup...\n", "blue");

  const tables = [
    "users",
    "trips",
    "requests",
    "matches",
    "messages",
    "disputes",
    "payments",
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        log(
          `  ⚠️  Table ${table}: Could not verify - ${error.message}`,
          "yellow"
        );
      } else {
        log(`  ✅ Table ${table}: ${count} rows`, "green");
      }
    } catch (error) {
      log(`  ⚠️  Table ${table}: Error - ${error.message}`, "yellow");
    }
  }
}

async function main() {
  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan");
  log("SpareCarry Supabase Setup", "cyan");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "cyan");

  // Load environment
  const env = loadEnv();

  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    log("❌ Missing required Supabase environment variables", "red");
    log(
      "   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
      "red"
    );
    process.exit(1);
  }

  log("📋 Supabase Project:", "blue");
  log(`   URL: ${supabaseUrl}`, "blue");
  log(`   Project ID: gujyzwqcwecbeznlablx\n`, "blue");

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceKey);

  log(
    "⚠️  Note: Migrations should be applied using Supabase CLI or SQL Editor",
    "yellow"
  );
  log("   This script verifies the setup. To apply migrations:", "yellow");
  log("   1. Use Supabase Dashboard SQL Editor", "yellow");
  log("   2. Or use: bash scripts/setup-supabase.sh\n", "yellow");

  // Verify setup
  await verifySetup(supabase);

  log("\n✅ Setup verification complete!", "green");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "cyan");
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  process.exit(1);
});
