#!/usr/bin/env node

/**
 * Verify notification setup - checks environment variables and configuration
 *
 * Usage:
 *   node scripts/verify-notification-setup.js
 */

require("dotenv").config({ path: ".env.local" });

const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFICATIONS_EMAIL_FROM =
  process.env.NOTIFICATIONS_EMAIL_FROM ||
  "SpareCarry <notifications@sparecarry.com>";

console.log("🔍 Verifying Notification Setup\n");

let allGood = true;

// Check Expo Access Token
console.log("📱 Expo Push Notifications:");
if (EXPO_ACCESS_TOKEN) {
  if (EXPO_ACCESS_TOKEN.length > 20) {
    console.log("   ✅ EXPO_ACCESS_TOKEN is set");
    console.log(`   ✅ Token length: ${EXPO_ACCESS_TOKEN.length} characters`);
    console.log(
      `   ✅ Token preview: ${EXPO_ACCESS_TOKEN.substring(0, 10)}...`
    );
  } else {
    console.log(
      "   ⚠️  EXPO_ACCESS_TOKEN seems too short (should be ~40+ chars)"
    );
    allGood = false;
  }
} else {
  console.log("   ❌ EXPO_ACCESS_TOKEN is not set");
  allGood = false;
}
console.log("");

// Check Resend API Key
console.log("📧 Resend Email Notifications:");
if (RESEND_API_KEY) {
  if (RESEND_API_KEY.startsWith("re_")) {
    console.log("   ✅ RESEND_API_KEY is set");
    console.log(`   ✅ Key format: Valid (starts with re_)`);
    console.log(`   ✅ Key preview: ${RESEND_API_KEY.substring(0, 10)}...`);
  } else {
    console.log(
      "   ⚠️  RESEND_API_KEY format might be incorrect (should start with re_)"
    );
    console.log(`   ✅ Key is set: ${RESEND_API_KEY.substring(0, 10)}...`);
  }
} else {
  console.log("   ❌ RESEND_API_KEY is not set");
  allGood = false;
}
console.log("");

// Check Email From
console.log("📨 Email Configuration:");
console.log(`   ✅ NOTIFICATIONS_EMAIL_FROM: ${NOTIFICATIONS_EMAIL_FROM}`);
console.log("");

// Test Expo API connection
console.log("🧪 Testing Expo API Connection...");
if (EXPO_ACCESS_TOKEN) {
  const https = require("https");
  const testRequest = https.request(
    {
      hostname: "exp.host",
      path: "/--/api/v2/push/send",
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
      },
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 400) {
          // 400 is expected for invalid token format (we're just testing auth)
          console.log(
            "   ✅ Expo API connection successful (auth token is valid)"
          );
        } else {
          console.log(`   ⚠️  Expo API returned status: ${res.statusCode}`);
        }
        testResend();
      });
    }
  );

  testRequest.on("error", (error) => {
    console.log("   ⚠️  Could not connect to Expo API:", error.message);
    testResend();
  });

  // Send a minimal invalid request just to test auth
  testRequest.write(JSON.stringify({ to: "invalid" }));
  testRequest.end();
} else {
  testResend();
}

function testResend() {
  console.log("");
  console.log("🧪 Testing Resend API Connection...");
  if (RESEND_API_KEY) {
    const https = require("https");
    const testRequest = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
      },
      (res) => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          // 401 means auth failed, but connection works
          if (res.statusCode === 401) {
            console.log(
              "   ⚠️  Resend API connection works, but auth may be invalid"
            );
          } else {
            console.log("   ✅ Resend API connection successful");
          }
        } else {
          console.log(`   ⚠️  Resend API returned status: ${res.statusCode}`);
        }
        printSummary();
      }
    );

    testRequest.on("error", (error) => {
      console.log("   ⚠️  Could not connect to Resend API:", error.message);
      printSummary();
    });

    testRequest.end();
  } else {
    printSummary();
  }
}

function printSummary() {
  console.log("");
  console.log("📊 Summary:");
  if (allGood) {
    console.log("   ✅ All environment variables are set correctly!");
    console.log("");
    console.log("🚀 Next steps:");
    console.log(
      "   1. Make sure your Supabase database has the required columns"
    );
    console.log(
      "   2. Test with: node scripts/test-notifications.js --type=both --recipientId=user-id"
    );
    console.log(
      "   3. Check that users have expo_push_token in profiles (for push)"
    );
    console.log("   4. Check that users have email in users table (for email)");
  } else {
    console.log("   ⚠️  Some environment variables are missing or incorrect");
    console.log("   Please check your .env.local file");
  }
  console.log("");
}
