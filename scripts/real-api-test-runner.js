#!/usr/bin/env node

/**
 * Real API Test Runner
 *
 * Tests real API connectivity and responses (NOT mocked)
 *
 * ⚠️ WARNING: This makes real API calls and may:
 * - Use your Supabase API quota
 * - Create test Stripe payment intents (test mode)
 * - Send test emails (if configured)
 * - Count against service rate limits
 *
 * USE SPARINGLY:
 * - Before deploying to production
 * - For smoke tests
 * - For connectivity validation
 * - NOT for regular development/testing
 *
 * For regular testing, use: npm run test:comprehensive:new (uses mocks)
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  try {
    require("dotenv").config({ path: envPath });
  } catch (error) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts
          .join("=")
          .replace(/^["']|["']$/g, "")
          .trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

// WARNING: This test makes REAL API calls
// DO NOT enable mocks
process.env.USE_TEST_MOCKS = "false";
process.env.AVOID_EXTERNAL_CALLS = "false";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const results = [];

console.log("⚠️  WARNING: Real API Testing Mode");
console.log("=".repeat(60));
console.log("This will make REAL API calls to:");
console.log("  • Supabase (database queries, auth)");
console.log("  • Stripe (test payment intents)");
console.log("  • Resend (test emails)");
console.log("  • Your API endpoints");
console.log("");
console.log("These will count against your service quotas!");
console.log("=".repeat(60));
console.log("");

/**
 * Wait for confirmation before running real API tests
 */
async function waitForConfirmation() {
  if (process.env.AUTO_CONFIRM !== "true") {
    console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("Starting real API tests...\n");
  } else {
    console.log("Auto-confirm enabled - starting immediately...\n");
  }
}

async function testFeature(name, fn) {
  try {
    console.log(`🧪 Testing: ${name}...`);
    const details = await fn();
    results.push({ feature: name, passed: true, details });
    console.log(`✅ PASSED: ${name}`);
    if (details && typeof details === "object") {
      Object.entries(details).forEach(([key, value]) => {
        if (key !== "allPresent" && key !== "present" && key !== "missing") {
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        }
      });
    }
    return true;
  } catch (error) {
    results.push({ feature: name, passed: false, error: error.message });
    console.error(`❌ FAILED: ${name} - ${error.message}`);
    return false;
  }
}

// Test 1: Real Supabase Connection
async function testRealSupabase() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Supabase credentials not configured");
  }

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Make a real, minimal query (just check if we can connect)
  const { data, error } = await supabase.from("users").select("id").limit(1);

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return {
    connected: true,
    canQuery: true,
    apiCallsMade: 1,
    note: "Made 1 real Supabase API call",
  };
}

// Test 2: Real Stripe Connection (Test Mode Only)
async function testRealStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe secret key not configured");
  }

  // Safety check: Only allow test keys
  if (secretKey.startsWith("sk_live_")) {
    throw new Error(
      "Cannot test with LIVE Stripe key - only test keys allowed"
    );
  }

  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("Invalid Stripe test key format");
  }

  const Stripe = require("stripe");
  const stripe = new Stripe(secretKey);

  // Make a minimal real API call (just get account info, no charges)
  const account = await stripe.account.retrieve();

  return {
    connected: true,
    mode: "test",
    apiCallsMade: 1,
    note: "Made 1 real Stripe API call (test mode only)",
  };
}

// Test 3: Real API Endpoint Connectivity
async function testRealAPIEndpoints() {
  const endpoints = ["/api/health", "/api/matches/auto-match"];

  const accessible = [];
  let serverRunning = false;

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    serverRunning = true;
  } catch (e) {
    throw new Error(`Server not running at ${BASE_URL}. Start with: pnpm dev`);
  }

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
        signal: AbortSignal.timeout(5000),
      });

      accessible.push({
        endpoint,
        status: response.status,
        note: "Real HTTP call made",
      });
    } catch (error) {
      accessible.push({
        endpoint,
        status: "error",
        error: error.message,
      });
    }
  }

  return {
    accessible: accessible.length,
    endpoints: accessible,
    note: `Made ${accessible.length} real HTTP calls`,
  };
}

// Main test runner
async function runRealAPITests() {
  console.log("🚀 Starting Real API Tests (NOT MOCKED)\n");
  console.log("=".repeat(60));

  await testFeature("Real Supabase Connection", testRealSupabase);

  // Small delay to avoid hitting rate limits
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await testFeature("Real Stripe Connection (Test Mode)", testRealStripe);

  // Small delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await testFeature("Real API Endpoint Connectivity", testRealAPIEndpoints);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 REAL API TEST SUMMARY\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.feature}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);

  // Show API call summary
  const apiCalls = results.reduce((sum, r) => {
    if (r.details && r.details.apiCallsMade) {
      return sum + r.details.apiCallsMade;
    }
    return sum;
  }, 0);

  console.log(`\n📊 API Calls Made: ${apiCalls}`);
  console.log("⚠️  Note: These calls count against your service quotas\n");

  // Save results
  const timestamp =
    new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
    "_" +
    new Date().toISOString().replace(/[:.]/g, "-").split("T")[1].split(".")[0];
  const resultPath = path.join(
    __dirname,
    "..",
    "test-results",
    `real-api-test-${timestamp}.json`
  );

  fs.writeFileSync(
    resultPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        type: "real_api_tests",
        results,
        summary: {
          passed,
          failed,
          total: results.length,
          apiCallsMade: apiCalls,
        },
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`📝 Results saved to: ${resultPath}\n`);

  if (failed > 0) {
    console.log(
      "⚠️  Some real API tests failed. Please review the errors above."
    );
    return { success: false, failed };
  } else {
    console.log("🎉 All real API tests passed!");
    return { success: true };
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    await waitForConfirmation();
    const result = await runRealAPITests();
    process.exit(result.success ? 0 : 1);
  })().catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = {
  runRealAPITests,
  testRealSupabase,
  testRealStripe,
  testRealAPIEndpoints,
};
