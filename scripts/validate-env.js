#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * Validates all required environment variables for staging/production
 * Usage: node scripts/validate-env.js [staging|production]
 */

const fs = require("fs");
const path = require("path");

const envName = process.argv[2] || "staging";
const envFile = path.join(__dirname, "..", `.env.${envName}`);

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let errors = [];
let warnings = [];
let passed = [];

function validate(name, condition, errorMsg, warningMsg) {
  if (condition) {
    passed.push(name);
    console.log(`${colors.green}✅${colors.reset} ${name}`);
  } else if (errorMsg) {
    errors.push({ name, message: errorMsg });
    console.log(`${colors.red}❌${colors.reset} ${name}: ${errorMsg}`);
  } else if (warningMsg) {
    warnings.push({ name, message: warningMsg });
    console.log(`${colors.yellow}⚠️${colors.reset} ${name}: ${warningMsg}`);
  }
}

function validateUrl(url, name) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateKey(key, prefix, name) {
  if (!key) return false;
  return key.startsWith(prefix);
}

function validateLength(value, minLength, maxLength, name) {
  if (!value) return false;
  const len = value.length;
  return len >= minLength && (maxLength ? len <= maxLength : true);
}

function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

console.log(`${colors.blue}🔍 Environment Variable Validation${colors.reset}`);
console.log(`${colors.cyan}Environment: ${envName}${colors.reset}\n`);

// Check if env file exists
if (!fs.existsSync(envFile)) {
  console.error(
    `${colors.red}❌ Environment file not found: ${envFile}${colors.reset}`
  );
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
      envVars[key.trim()] = value.replace(/^["']|["']$/g, "");
    }
  }
});

console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}1. Core Application${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Core Application
validate(
  "NEXT_PUBLIC_APP_ENV",
  envVars.NEXT_PUBLIC_APP_ENV === envName,
  `Must be "${envName}"`,
  `Expected "${envName}", got "${envVars.NEXT_PUBLIC_APP_ENV}"`
);

validate(
  "NEXT_PUBLIC_APP_URL",
  validateUrl(envVars.NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL"),
  "Must be a valid URL (http:// or https://)",
  null
);

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}2. Supabase${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Supabase
validate(
  "NEXT_PUBLIC_SUPABASE_URL",
  validateUrl(envVars.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
  "Must be a valid Supabase URL",
  null
);

validate(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  validateLength(
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    100,
    200,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ),
  "Must be a valid Supabase anon key (100-200 chars)",
  null
);

validate(
  "SUPABASE_SERVICE_ROLE_KEY",
  !envVars.SUPABASE_SERVICE_ROLE_KEY ||
    validateLength(
      envVars.SUPABASE_SERVICE_ROLE_KEY,
      100,
      200,
      "SUPABASE_SERVICE_ROLE_KEY"
    ),
  "Must be a valid Supabase service role key (100-200 chars)",
  "Service role key not set (server-only, optional for client builds)"
);

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}3. Stripe${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Stripe
const stripeKeyPrefix = envName === "production" ? "pk_live_" : "pk_test_";
validate(
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  validateKey(
    envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeKeyPrefix,
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  ),
  `Must start with "${stripeKeyPrefix}"`,
  null
);

const stripeSecretPrefix = envName === "production" ? "sk_live_" : "sk_test_";
validate(
  "STRIPE_SECRET_KEY",
  !envVars.STRIPE_SECRET_KEY ||
    validateKey(
      envVars.STRIPE_SECRET_KEY,
      stripeSecretPrefix,
      "STRIPE_SECRET_KEY"
    ),
  `Must start with "${stripeSecretPrefix}"`,
  "Secret key not set (server-only, optional for client builds)"
);

validate(
  "STRIPE_WEBHOOK_SECRET",
  !envVars.STRIPE_WEBHOOK_SECRET ||
    validateKey(
      envVars.STRIPE_WEBHOOK_SECRET,
      "whsec_",
      "STRIPE_WEBHOOK_SECRET"
    ),
  'Must start with "whsec_"',
  "Webhook secret not set (server-only, optional for client builds)"
);

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}4. Sentry${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Sentry
validate(
  "NEXT_PUBLIC_SENTRY_DSN",
  !envVars.NEXT_PUBLIC_SENTRY_DSN ||
    validateUrl(envVars.NEXT_PUBLIC_SENTRY_DSN, "NEXT_PUBLIC_SENTRY_DSN"),
  "Must be a valid Sentry DSN URL",
  "Sentry DSN not set (optional but recommended)"
);

if (envVars.NEXT_PUBLIC_SENTRY_DSN) {
  validate(
    "NEXT_PUBLIC_SENTRY_DSN format",
    envVars.NEXT_PUBLIC_SENTRY_DSN.includes("@") &&
      envVars.NEXT_PUBLIC_SENTRY_DSN.includes(".ingest.sentry.io"),
    "Must be a valid Sentry DSN format (https://...@...ingest.sentry.io/...)",
    null
  );
}

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}5. Feature Flags (Unleash)${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Unleash
validate(
  "NEXT_PUBLIC_UNLEASH_URL",
  !envVars.NEXT_PUBLIC_UNLEASH_URL ||
    validateUrl(envVars.NEXT_PUBLIC_UNLEASH_URL, "NEXT_PUBLIC_UNLEASH_URL"),
  "Must be a valid Unleash URL",
  "Unleash URL not set (optional)"
);

validate(
  "NEXT_PUBLIC_UNLEASH_CLIENT_KEY",
  !envVars.NEXT_PUBLIC_UNLEASH_CLIENT_KEY ||
    validateLength(
      envVars.NEXT_PUBLIC_UNLEASH_CLIENT_KEY,
      20,
      200,
      "NEXT_PUBLIC_UNLEASH_CLIENT_KEY"
    ),
  "Must be a valid Unleash client key (20-200 chars)",
  "Unleash client key not set (optional)"
);

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}6. Push Notifications${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Push Notifications (Expo/FCM)
validate(
  "EXPO_ACCESS_TOKEN",
  !envVars.EXPO_ACCESS_TOKEN ||
    validateLength(envVars.EXPO_ACCESS_TOKEN, 20, 200, "EXPO_ACCESS_TOKEN"),
  "Must be a valid Expo access token (20-200 chars)",
  "Expo access token not set (optional)"
);

validate(
  "FCM_SERVER_KEY",
  !envVars.FCM_SERVER_KEY ||
    validateLength(envVars.FCM_SERVER_KEY, 100, 200, "FCM_SERVER_KEY"),
  "Must be a valid FCM server key (100-200 chars)",
  "FCM server key not set (optional)"
);

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}7. OAuth & Authentication${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// OAuth
validate(
  "GOOGLE_CLIENT_ID",
  !envVars.GOOGLE_CLIENT_ID ||
    validateLength(envVars.GOOGLE_CLIENT_ID, 20, 200, "GOOGLE_CLIENT_ID"),
  "Must be a valid Google Client ID (20-200 chars)",
  "Google Client ID not set (optional)"
);

validate(
  "APPLE_CLIENT_ID",
  !envVars.APPLE_CLIENT_ID ||
    validateLength(envVars.APPLE_CLIENT_ID, 10, 100, "APPLE_CLIENT_ID"),
  "Must be a valid Apple Client ID (10-100 chars)",
  "Apple Client ID not set (optional)"
);

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}8. Email Service${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Email (Resend)
validate(
  "RESEND_API_KEY",
  !envVars.RESEND_API_KEY ||
    validateKey(envVars.RESEND_API_KEY, "re_", "RESEND_API_KEY"),
  'Must start with "re_"',
  "Resend API key not set (optional)"
);

console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}9. Analytics${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);

// Analytics
validate(
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  !envVars.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    validateKey(
      envVars.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      "G-",
      "NEXT_PUBLIC_GA_MEASUREMENT_ID"
    ),
  'Must start with "G-"',
  "Google Analytics ID not set (optional)"
);

validate(
  "NEXT_PUBLIC_META_PIXEL_ID",
  !envVars.NEXT_PUBLIC_META_PIXEL_ID ||
    /^\d+$/.test(envVars.NEXT_PUBLIC_META_PIXEL_ID),
  "Must be a numeric Meta Pixel ID",
  "Meta Pixel ID not set (optional)"
);

// Summary
console.log(
  `\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.blue}Summary${colors.reset}`);
console.log(
  `${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.green}✅ Passed: ${passed.length}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnings.length}${colors.reset}`);
console.log(`${colors.red}❌ Errors: ${errors.length}${colors.reset}\n`);

if (warnings.length > 0) {
  console.log(`${colors.yellow}Warnings:${colors.reset}`);
  warnings.forEach((w) => console.log(`   - ${w.name}: ${w.message}`));
  console.log("");
}

if (errors.length > 0) {
  console.log(`${colors.red}Errors (must fix):${colors.reset}`);
  errors.forEach((e) => console.log(`   - ${e.name}: ${e.message}`));
  console.log("");
  process.exit(1);
}

console.log(
  `${colors.green}✅ Environment validation passed!${colors.reset}\n`
);
process.exit(0);
