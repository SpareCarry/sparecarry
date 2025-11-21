/**
 * Sentry Client Configuration
 *
 * Matches Sentry wizard defaults and only initializes when a DSN is present.
 */

if (typeof window !== "undefined") {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (SENTRY_DSN && SENTRY_DSN.length > 0) {
    const ENVIRONMENT =
      process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";

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
          integrations: [
            new Sentry.BrowserTracing({
              tracePropagationTargets: [
                "localhost",
                /^https:\/\/.*\.sparecarry\.com/,
                /^https:\/\/staging\.sparecarry\.com/,
              ],
            }),
            new Sentry.Replay({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ],
          beforeSend(event) {
            if (ENVIRONMENT === "production" && event.environment !== "production") {
              return null;
            }
            return event;
          },
          ignoreErrors: [
            "top.GLOBALS",
            "originalCreateNotification",
            "canvas.contentDocument",
            "MyApp_RemoveAllHighlights",
            "atomicFindClose",
            "NetworkError",
            "Network request failed",
            "fb_xd_fragment",
            "bmi_SafeAddOnload",
            "EBCallBackMessageReceived",
          ],
        });
      })
      .catch((error) => {
        console.warn("[Sentry] Failed to initialize client SDK:", error);
      });
  }
}

export {};