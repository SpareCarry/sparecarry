const { z } = require("zod");

const EMAIL_PATTERN = /.+@.+\..+/;
const STRIPE_PRICE_PATTERN = /^price_[A-Za-z0-9]+/;
const STRIPE_KEY_PATTERN = /^sk_(test|live)_[A-Za-z0-9]+/;
const STRIPE_PUBLISHABLE_PATTERN = /^pk_(test|live)_[A-Za-z0-9]+/;
const WEBHOOK_PATTERN = /^whsec_[A-Za-z0-9]+/;
const RESEND_PATTERN = /^re_[A-Za-z0-9]+/;

// Required for core functionality
const requiredEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"], {
    required_error: "NEXT_PUBLIC_APP_ENV must be set to development, staging, or production",
  }),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(30, "NEXT_PUBLIC_SUPABASE_ANON_KEY looks too short"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(30, "SUPABASE_SERVICE_ROLE_KEY looks too short"),
  RESEND_API_KEY: z
    .string()
    .min(20, "RESEND_API_KEY is required (can start with re_ or be a newer format)"),
  NOTIFICATIONS_EMAIL_FROM: z
    .string()
    .regex(EMAIL_PATTERN, "NOTIFICATIONS_EMAIL_FROM must include a valid email"),
});

// Optional but recommended (will warn if missing)
const optionalEnvSchema = z.object({
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(STRIPE_PUBLISHABLE_PATTERN, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_")
    .optional(),
  STRIPE_SECRET_KEY: z
    .string()
    .regex(STRIPE_KEY_PATTERN, "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_")
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .regex(WEBHOOK_PATTERN, "STRIPE_WEBHOOK_SECRET must start with whsec_")
    .optional(),
  STRIPE_SUPPORTER_PRICE_ID: z
    .string()
    .regex(STRIPE_PRICE_PATTERN, "STRIPE_SUPPORTER_PRICE_ID must start with price_")
    .optional(),
  STRIPE_MONTHLY_PRICE_ID: z
    .string()
    .regex(STRIPE_PRICE_PATTERN, "STRIPE_MONTHLY_PRICE_ID must start with price_")
    .optional(),
  STRIPE_YEARLY_PRICE_ID: z
    .string()
    .regex(STRIPE_PRICE_PATTERN, "STRIPE_YEARLY_PRICE_ID must start with price_")
    .optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/, "NEXT_PUBLIC_GA_MEASUREMENT_ID must look like G-XXXXXXXX")
    .optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z
    .string()
    .regex(/^\d+$/, "NEXT_PUBLIC_META_PIXEL_ID must be numeric")
    .optional(),
  NEXT_PUBLIC_UNLEASH_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_UNLEASH_URL must be a valid URL" })
    .optional(),
  NEXT_PUBLIC_UNLEASH_CLIENT_KEY: z
    .string()
    .min(10, "NEXT_PUBLIC_UNLEASH_CLIENT_KEY looks too short")
    .optional(),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters").optional(),
  NEXT_PUBLIC_ENABLE_PHONE_AUTH: z.string().regex(/^(true|false)$/, "NEXT_PUBLIC_ENABLE_PHONE_AUTH must be 'true' or 'false'").optional(),
  NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY: z.string().regex(/^(true|false)$/, "NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY must be 'true' or 'false'").optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().regex(EMAIL_PATTERN, "NEXT_PUBLIC_SUPPORT_EMAIL must be a valid email").optional(),
});

function shouldValidate(phase) {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    console.warn("[env] Runtime validation skipped because SKIP_ENV_VALIDATION=true");
    return false;
  }
  if (process.env.FORCE_ENV_VALIDATION === "true") {
    return true;
  }
  if (phase === "phase-production-build") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

function formatIssues(issues) {
  return issues
    .map((issue) => {
      const path = issue.path.join(".") || "root";
      return ` • ${path}: ${issue.message}`;
    })
    .join("\n");
}

function validateRuntimeEnv({ phase } = {}) {
  if (!shouldValidate(phase)) {
    return;
  }

  // Validate required variables
  const requiredParsed = requiredEnvSchema.safeParse(process.env);
  if (!requiredParsed.success) {
    const details = formatIssues(requiredParsed.error.issues);
    throw new Error(
      [
        "Required environment variables are missing or invalid:",
        details,
        "",
        "💡 Set these in Vercel: Project Settings → Environment Variables",
        "   Or set SKIP_ENV_VALIDATION=true to bypass (not recommended).",
      ].join("\n")
    );
  }

  // Validate optional variables and warn if missing
  const optionalParsed = optionalEnvSchema.safeParse(process.env);
  if (!optionalParsed.success) {
    const warnings = formatIssues(optionalParsed.error.issues);
    console.warn(
      [
        "[env] Optional environment variables missing (features may be disabled):",
        warnings,
        "",
      ].join("\n")
    );
  }

  console.log("[env] Runtime environment variables validated");
}

module.exports = { validateRuntimeEnv };

