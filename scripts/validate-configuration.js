/**
 * Configuration Validator
 *
 * Validates all configuration (env vars, APIs, database, mobile app)
 * Uses mocks to avoid hitting service limits
 */

const fs = require("fs");
const path = require("path");
const {
  mockSupabaseCheck,
  mockStripeCheck,
  mockResendCheck,
  shouldUseMocks,
  setupTestEnvironment,
} = require("./test-service-mocker");
const { throttle } = require("./test-service-mocker");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  try {
    require("dotenv").config({ path: envPath });
  } catch (error) {
    // Manual loading if dotenv fails
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

// FORCE MOCK MODE - Always use mocks to avoid hitting service limits
process.env.USE_TEST_MOCKS = "true";
process.env.AVOID_EXTERNAL_CALLS = "true";
process.env.SUPABASE_MOCK_MODE = "true";

// Setup test environment (always uses mocks)
setupTestEnvironment();

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: { format: "url", required: true },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { format: "string", required: true },
  SUPABASE_SERVICE_ROLE_KEY: { format: "string", required: false },

  // Stripe
  STRIPE_SECRET_KEY: { format: "stripe_key", required: false },
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: { format: "stripe_key", required: false },

  // Optional but recommended
  RESEND_API_KEY: { format: "string", required: false },
  NOTIFICATIONS_EMAIL_FROM: { format: "email", required: false },
  NEXT_PUBLIC_APP_URL: { format: "url", required: false },
  NEXT_PUBLIC_APP_ENV: {
    format: "enum",
    enum: ["development", "staging", "production"],
    required: false,
  },
};

/**
 * Validate environment variables
 */
async function validateEnvironment() {
  const missing = [];
  const invalid = [];
  const valid = [];

  for (const [varName, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];

    if (config.required && !value) {
      missing.push(varName);
      continue;
    }

    if (!value) {
      continue; // Optional and not set
    }

    // Validate format
    let isValid = true;

    if (config.format === "url" && !value.match(/^https?:\/\/.+/)) {
      isValid = false;
      invalid.push({ var: varName, reason: "Invalid URL format" });
    }

    if (
      config.format === "email" &&
      !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ) {
      isValid = false;
      invalid.push({ var: varName, reason: "Invalid email format" });
    }

    if (config.format === "stripe_key") {
      if (varName.includes("SECRET") && !value.startsWith("sk_")) {
        isValid = false;
        invalid.push({
          var: varName,
          reason: "Invalid Stripe secret key format",
        });
      }
      if (varName.includes("PUBLISHABLE") && !value.startsWith("pk_")) {
        isValid = false;
        invalid.push({
          var: varName,
          reason: "Invalid Stripe publishable key format",
        });
      }
    }

    if (config.enum && !config.enum.includes(value)) {
      isValid = false;
      invalid.push({
        var: varName,
        reason: `Must be one of: ${config.enum.join(", ")}`,
      });
    }

    if (isValid) {
      valid.push(varName);
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    valid,
  };
}

/**
 * Check Supabase connectivity (always mocked)
 */
async function validateSupabase() {
  // Always use mock - never make real API calls
  const mockResult = mockSupabaseCheck();
  if (mockResult) {
    return mockResult;
  }

  // Fallback: validate format only, never make API calls
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      connected: false,
      errors: ["Missing Supabase URL or key"],
      mocked: true,
      message: "Using mock validation (no API calls made)",
    };
  }

  // Only validate format, never test connectivity
  if (!url.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
    return {
      connected: false,
      errors: ["Invalid Supabase URL format"],
      mocked: true,
      message: "Format validation only (no API calls made)",
    };
  }

  return {
    connected: true,
    errors: [],
    mocked: true,
    message:
      "Supabase configuration format valid (using mock - no API calls made)",
  };
}

/**
 * Check Stripe configuration (always mocked)
 */
async function validateStripe() {
  // Always use mock - never make real API calls
  const mockResult = mockStripeCheck();
  if (mockResult) {
    return mockResult;
  }

  // Fallback: validate format only, never make API calls
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const errors = [];

  if (secretKey && !secretKey.startsWith("sk_")) {
    errors.push("Invalid Stripe secret key format");
  }

  if (publishableKey && !publishableKey.startsWith("pk_")) {
    errors.push("Invalid Stripe publishable key format");
  }

  return {
    connected: errors.length === 0,
    errors,
    mocked: true,
    message:
      errors.length === 0
        ? "Stripe configuration format valid (using mock - no API calls made)"
        : null,
  };
}

/**
 * Check Resend configuration (always mocked)
 */
async function validateResend() {
  // Always use mock - never make real API calls
  const mockResult = mockResendCheck();
  if (mockResult) {
    return mockResult;
  }

  // Fallback: validate format only, never make API calls
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      connected: false,
      errors: [],
      mocked: true,
      message:
        "Resend API key not configured (optional, using mock - no API calls made)",
    };
  }

  if (!apiKey.startsWith("re_")) {
    return {
      connected: false,
      errors: ["Invalid Resend API key format"],
      mocked: true,
      message: "Format validation only (no API calls made)",
    };
  }

  return {
    connected: true,
    errors: [],
    mocked: true,
    message:
      "Resend configuration format valid (using mock - no API calls made)",
  };
}

/**
 * Validate file existence
 */
function validateFiles() {
  const requiredFiles = [
    "package.json",
    "next.config.js",
    "tsconfig.json",
    ".env.local",
  ];

  const missing = [];
  const existing = [];

  requiredFiles.forEach((file) => {
    const filepath = path.join(__dirname, "..", file);
    if (fs.existsSync(filepath)) {
      existing.push(file);
    } else {
      missing.push(file);
    }
  });

  return { missing, existing };
}

/**
 * Validate database schema compatibility (mock)
 */
async function validateDatabaseSchema() {
  if (shouldUseMocks()) {
    return {
      compatible: true,
      mocked: true,
      message: "Using mock database (no schema check)",
      errors: [],
    };
  }

  // In real mode, we'd check schema, but to avoid API calls, we'll just verify migration files exist
  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    return {
      compatible: false,
      errors: ["Migrations directory not found"],
      mocked: false,
    };
  }

  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"));

  return {
    compatible: true,
    errors: [],
    mocked: false,
    message: `Found ${migrations.length} migration files`,
    migrationCount: migrations.length,
  };
}

/**
 * Main validation function
 */
async function validateConfiguration() {
  await throttle(100); // Small delay

  const [environment, supabase, stripe, resend, files, schema] =
    await Promise.all([
      validateEnvironment(),
      validateSupabase(),
      validateStripe(),
      validateResend(),
      Promise.resolve(validateFiles()),
      validateDatabaseSchema(),
    ]);

  return {
    environment,
    apis: {
      supabase,
      stripe,
      resend,
    },
    files,
    schema,
    valid: environment.valid && files.missing.length === 0,
  };
}

module.exports = {
  validateConfiguration,
  validateEnvironment,
  validateSupabase,
  validateStripe,
  validateResend,
  validateFiles,
  validateDatabaseSchema,
};
