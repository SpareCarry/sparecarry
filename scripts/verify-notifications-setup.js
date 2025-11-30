#!/usr/bin/env node

/**
 * Comprehensive notification setup verification script
 * Verifies all required components are in place
 *
 * Usage:
 *   node scripts/verify-notifications-setup.js
 */

require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const { createClient } = require("@supabase/supabase-js");

console.log("🔍 Verifying Notification Setup\n");

let allGood = true;
const results = {
  envVars: { status: "checking", issues: [] },
  supabaseSchema: { status: "checking", issues: [] },
  supabaseData: { status: "checking", issues: [] },
  ready: false,
};

// ============================================================================
// 1. Check Environment Variables
// ============================================================================
console.log("1️⃣  Checking Environment Variables...\n");

const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFICATIONS_EMAIL_FROM = process.env.NOTIFICATIONS_EMAIL_FROM;

if (EXPO_ACCESS_TOKEN && EXPO_ACCESS_TOKEN.length > 20) {
  console.log("   ✅ EXPO_ACCESS_TOKEN is set");
} else {
  console.log("   ❌ EXPO_ACCESS_TOKEN is missing or invalid");
  results.envVars.issues.push("EXPO_ACCESS_TOKEN is missing");
  allGood = false;
}

if (RESEND_API_KEY && RESEND_API_KEY.length > 20) {
  console.log("   ✅ RESEND_API_KEY is set");
} else {
  console.log("   ❌ RESEND_API_KEY is missing or invalid");
  results.envVars.issues.push("RESEND_API_KEY is missing");
  allGood = false;
}

if (NOTIFICATIONS_EMAIL_FROM && NOTIFICATIONS_EMAIL_FROM.trim().length > 0) {
  const emailMatch =
    NOTIFICATIONS_EMAIL_FROM.match(/<([^>]+)>/) ||
    NOTIFICATIONS_EMAIL_FROM.match(/(\S+@\S+\.\S+)/);
  if (emailMatch) {
    console.log(
      `   ✅ NOTIFICATIONS_EMAIL_FROM is set: ${NOTIFICATIONS_EMAIL_FROM}`
    );
  } else {
    console.log(
      `   ⚠️  NOTIFICATIONS_EMAIL_FROM format might be incorrect: ${NOTIFICATIONS_EMAIL_FROM}`
    );
    results.envVars.issues.push(
      "NOTIFICATIONS_EMAIL_FROM format may be incorrect"
    );
  }
} else {
  console.log(
    "   ⚠️  NOTIFICATIONS_EMAIL_FROM not set (will use default: SpareCarry <notifications@sparecarry.com>)"
  );
  console.log("   ℹ️  This is optional - the code has a default value");
  results.envVars.issues.push(
    "NOTIFICATIONS_EMAIL_FROM not set (optional, has default)"
  );
}

results.envVars.status =
  results.envVars.issues.length === 0
    ? "pass"
    : results.envVars.issues.some((i) => i.includes("missing"))
      ? "fail"
      : "warning";
console.log("");

// ============================================================================
// 2. Verify Supabase Schema
// ============================================================================
console.log("2️⃣  Verifying Supabase Schema...\n");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log("   ❌ Supabase credentials not found");
  console.log(
    "   ⚠️  Skipping schema verification (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)"
  );
  results.supabaseSchema.status = "skip";
  console.log("");
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Check profiles table has required columns
  supabase
    .from("profiles")
    .select("expo_push_token, push_notifications_enabled")
    .limit(1)
    .then(({ error }) => {
      if (error) {
        if (
          error.message.includes("expo_push_token") ||
          error.message.includes("push_notifications_enabled")
        ) {
          console.log(
            "   ❌ profiles table missing expo_push_token or push_notifications_enabled columns"
          );
          results.supabaseSchema.issues.push(
            "profiles table missing required columns"
          );
          results.supabaseSchema.status = "fail";
          allGood = false;
        } else {
          console.log(
            "   ⚠️  Could not verify profiles table (might be empty)"
          );
        }
      } else {
        console.log(
          "   ✅ profiles table has expo_push_token and push_notifications_enabled columns"
        );
      }
    });

  // Check users table has email
  supabase
    .from("users")
    .select("email")
    .limit(1)
    .then(({ error }) => {
      if (error) {
        if (error.message.includes("email")) {
          console.log("   ❌ users table missing email column");
          results.supabaseSchema.issues.push(
            "users table missing email column"
          );
          results.supabaseSchema.status = "fail";
          allGood = false;
        } else {
          console.log("   ⚠️  Could not verify users table (might be empty)");
        }
      } else {
        console.log("   ✅ users table has email column");
      }

      results.supabaseSchema.status =
        results.supabaseSchema.issues.length === 0 ? "pass" : "fail";
      console.log("");
      checkSupabaseData();
    });
}

// ============================================================================
// 3. Check Supabase Data (users with emails, profiles with tokens)
// ============================================================================
function checkSupabaseData() {
  console.log("3️⃣  Checking Supabase Data...\n");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log(
      "   ⚠️  Skipping data verification (Supabase credentials not found)"
    );
    results.supabaseData.status = "skip";
    console.log("");
    printSummary();
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  Promise.all([
    // Count users with emails
    supabase
      .from("users")
      .select("id, email", { count: "exact", head: true })
      .not("email", "is", null),
    // Count profiles with push tokens
    supabase
      .from("profiles")
      .select("id, expo_push_token", { count: "exact", head: true })
      .not("expo_push_token", "is", null)
      .eq("push_notifications_enabled", true),
  ])
    .then(([usersResult, profilesResult]) => {
      const usersWithEmail = usersResult.count || 0;
      const profilesWithTokens = profilesResult.count || 0;

      if (usersWithEmail > 0) {
        console.log(
          `   ✅ Found ${usersWithEmail} user(s) with email addresses`
        );
      } else {
        console.log(
          "   ⚠️  No users with email addresses found (email notifications won't work)"
        );
        results.supabaseData.issues.push("No users with email addresses");
      }

      if (profilesWithTokens > 0) {
        console.log(
          `   ✅ Found ${profilesWithTokens} profile(s) with push tokens enabled`
        );
      } else {
        console.log(
          "   ⚠️  No profiles with push tokens found (push notifications won't work)"
        );
        results.supabaseData.issues.push("No profiles with push tokens");
      }

      results.supabaseData.status =
        results.supabaseData.issues.length === 0 ? "pass" : "warning";
      console.log("");
      printSummary();
    })
    .catch((error) => {
      console.log(`   ⚠️  Error checking data: ${error.message}`);
      results.supabaseData.status = "error";
      console.log("");
      printSummary();
    });
}

// ============================================================================
// Summary
// ============================================================================
function printSummary() {
  console.log("📊 Summary:\n");

  console.log("Environment Variables:");
  console.log(
    `   ${results.envVars.status === "pass" ? "✅" : results.envVars.status === "warning" ? "⚠️" : "❌"} Status: ${results.envVars.status}`
  );
  if (results.envVars.issues.length > 0) {
    results.envVars.issues.forEach((issue) => console.log(`      - ${issue}`));
  }
  console.log("");

  console.log("Supabase Schema:");
  console.log(
    `   ${results.supabaseSchema.status === "pass" ? "✅" : results.supabaseSchema.status === "skip" ? "⏭️" : "❌"} Status: ${results.supabaseSchema.status}`
  );
  if (results.supabaseSchema.issues.length > 0) {
    results.supabaseSchema.issues.forEach((issue) =>
      console.log(`      - ${issue}`)
    );
  }
  console.log("");

  console.log("Supabase Data:");
  console.log(
    `   ${results.supabaseData.status === "pass" ? "✅" : results.supabaseData.status === "warning" ? "⚠️" : results.supabaseData.status === "skip" ? "⏭️" : "❌"} Status: ${results.supabaseData.status}`
  );
  if (results.supabaseData.issues.length > 0) {
    results.supabaseData.issues.forEach((issue) =>
      console.log(`      - ${issue}`)
    );
  }
  console.log("");

  // Overall status
  const allPass =
    results.envVars.status === "pass" &&
    results.supabaseSchema.status !== "fail" &&
    results.supabaseData.status !== "fail";

  if (allPass) {
    console.log("✅ Notification System Setup Complete!\n");
    console.log("🚀 Next Steps:");
    console.log(
      "   1. Test with: node scripts/test-notifications.js --type=both --recipientId=user-id"
    );
    console.log(
      "   2. Import Postman collection: NOTIFICATION_TEST_COLLECTION.postman_collection.json"
    );
    console.log(
      "   3. Test in production: Send a test notification to a real user\n"
    );
  } else {
    console.log("⚠️  Setup Incomplete\n");
    console.log("💡 Fix the issues above and run this script again\n");
  }

  results.ready = allPass;
}

// Wait a bit for async checks
setTimeout(() => {
  if (results.supabaseSchema.status === "checking") {
    console.log(
      "   ⚠️  Supabase check timed out (this is OK if credentials are missing)\n"
    );
    results.supabaseSchema.status = "skip";
    printSummary();
  }
}, 3000);
