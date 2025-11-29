/** Auto-generated safe next.config.js (backup saved as next.config.js.bak) */

const { PHASE_PRODUCTION_BUILD } = require("next/constants");
const { validateRuntimeEnv } = require("./scripts/runtime-env");

module.exports = (phase) => {
  validateRuntimeEnv({ phase });

  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
  process.env.NEXT_PUBLIC_SENTRY_DSN = SENTRY_DSN;

  // Only enable the Sentry webpack plugin when we have BOTH a DSN and a valid auth
  // token, and the skip flag is not set. This prevents Vercel builds from failing
  // with "Invalid token" when SENTRY_AUTH_TOKEN is missing or placeholder.
  const hasSentryAuth = !!process.env.SENTRY_AUTH_TOKEN && 
                        process.env.SENTRY_AUTH_TOKEN !== "your_sentry_auth_token_here" &&
                        process.env.SENTRY_AUTH_TOKEN.trim().length > 0;
  const skipSentry = process.env.SENTRY_SKIP_AUTO_RELEASE === "true";
  // Only enable webpack plugin if we have valid auth - this prevents 401 errors during build
  const enableSentryWebpackPlugin = SENTRY_DSN.length > 0 && hasSentryAuth && !skipSentry;

  const nextConfig = {
    reactStrictMode: true,
    experimental: {},
    // Enable detailed error logging in development
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
    // Show more detailed errors
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 5,
    },
    webpack: (config, { isServer, dev }) => {
      // Add better error logging in development
      if (dev) {
        config.infrastructureLogging = {
          level: 'verbose',
        };
      }
      // Add aliases for root-level folders (matches Metro config for mobile)
      config.resolve.alias = {
        ...config.resolve.alias,
        '@root-lib': require('path').resolve(__dirname, 'lib'),
        '@root-src': require('path').resolve(__dirname, 'src'),
        '@root-config': require('path').resolve(__dirname, 'config'),
        '@root-utils': require('path').resolve(__dirname, 'utils'),
      };
      return config;
    },
    generateBuildId: async () => {
      // Custom build ID generation that doesn't rely on nanoid's generate export
      // Use a timestamp-based ID to avoid the nanoid compatibility issue
      return `build-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    },
  };

  // If we don't have valid Sentry auth, skip the webpack plugin entirely
  // The Sentry SDK will still work for error tracking, just without source maps/releases
  if (!enableSentryWebpackPlugin) {
    if (phase === PHASE_PRODUCTION_BUILD) {
      if (!SENTRY_DSN || SENTRY_DSN.length === 0) {
        console.warn("[Sentry] NEXT_PUBLIC_SENTRY_DSN is not set. Skipping Sentry webpack plugins.");
      } else if (!hasSentryAuth) {
        console.warn("[Sentry] SENTRY_AUTH_TOKEN is missing or invalid. Skipping Sentry webpack plugins to avoid build failures.");
        console.warn("[Sentry] Error tracking will still work, but source maps and releases will be disabled.");
      } else if (skipSentry) {
        console.warn("[Sentry] SENTRY_SKIP_AUTO_RELEASE is set. Skipping Sentry webpack plugins.");
      }
    }
    return nextConfig;
  }

  // Only wrap with Sentry config if we have valid authentication
  const { withSentryConfig } = require("@sentry/nextjs");
  return withSentryConfig(
    nextConfig,
    {
      silent: true,
      hideSourceMaps: true,
      org: process.env.SENTRY_ORG || "",
      project: process.env.SENTRY_PROJECT || "",
    },
    {
      disableServerWebpackPlugin: false,
      disableClientWebpackPlugin: false,
      widenClientFileUpload: true,
      transpileClientSDK: true,
      tunnelRoute: "/monitoring",
      hideSourceMaps: true,
    }
  );
};
