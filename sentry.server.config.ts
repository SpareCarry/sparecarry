/**
 * Sentry Server Configuration
 *
 * Only loaded if NEXT_PUBLIC_SENTRY_DSN is set
 * Uses dynamic import to avoid build issues
 */

const ENVIRONMENT =
  process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

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
        profilesSampleRate:
          ENVIRONMENT === "production"
            ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1")
            : 1.0,
        debug: ENVIRONMENT !== "production",
        release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
        integrations: [new Sentry.Integrations.Http({ tracing: true })],
        beforeSend(event) {
          if (
            ENVIRONMENT === "production" &&
            event.environment !== "production"
          ) {
            return null;
          }

          if (event.request) {
            if (event.request.headers) {
              Object.keys(event.request.headers).forEach((key) => {
                if (
                  key.toLowerCase().includes("authorization") ||
                  key.toLowerCase().includes("token") ||
                  key.toLowerCase().includes("secret")
                ) {
                  event.request!.headers![key] = "[REDACTED]";
                }
              });
            }

            const originalQueryString = event.request.query_string;
            if (typeof originalQueryString === "string") {
              let sanitizedQueryString = originalQueryString;
              const sensitiveParams = [
                "token",
                "key",
                "secret",
                "password",
                "api_key",
              ];
              sensitiveParams.forEach((param) => {
                if (sanitizedQueryString.includes(param)) {
                  sanitizedQueryString = sanitizedQueryString.replace(
                    new RegExp(`${param}=[^&]*`, "gi"),
                    `${param}=[REDACTED]`
                  );
                }
              });
              event.request.query_string = sanitizedQueryString;
            }
          }

          return event;
        },
        ignoreErrors: [
          "ECONNREFUSED",
          "ENOTFOUND",
          "ETIMEDOUT",
          "ValidationError",
          "ZodError",
        ],
      });
    })
    .catch((error) => {
      console.warn("[Sentry] Failed to initialize server SDK:", error);
    });
}

export {};
