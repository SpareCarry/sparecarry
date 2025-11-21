/**
 * Sentry Edge Configuration
 * 
 * Only loaded if NEXT_PUBLIC_SENTRY_DSN is set
 * Uses dynamic import to avoid build issues
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || "development";

if (SENTRY_DSN && SENTRY_DSN.length > 0) {
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENVIRONMENT,
        tracesSampleRate:
          ENVIRONMENT === "production"
            ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.2")
            : 1.0,
        debug: ENVIRONMENT === "development",
        release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
      });
    })
    .catch((error) => {
      console.warn("[Sentry Edge] Failed to initialize:", error);
    });
}

export {};

