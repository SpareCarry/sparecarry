/** Auto-generated safe next.config.js (backup saved as next.config.js.bak) */

const { PHASE_PRODUCTION_BUILD } = require("next/constants");
const { validateRuntimeEnv } = require("./scripts/runtime-env");

module.exports = (phase) => {
  validateRuntimeEnv({ phase });

  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
  process.env.NEXT_PUBLIC_SENTRY_DSN = SENTRY_DSN;
  const enableSentryWebpackPlugin = SENTRY_DSN.length > 0;

  const nextConfig = {
    reactStrictMode: true,
    experimental: {},
    webpack: (config) => config,
  };

  if (!enableSentryWebpackPlugin) {
    if (phase === PHASE_PRODUCTION_BUILD) {
      console.warn("[Sentry] NEXT_PUBLIC_SENTRY_DSN is not set. Skipping Sentry webpack plugins.");
    }
    return nextConfig;
  }

  const { withSentryConfig } = require("@sentry/nextjs");
  return withSentryConfig(
    nextConfig,
    {
      silent: true,
      dryRun: !process.env.SENTRY_AUTH_TOKEN,
    },
    {
      disableServerWebpackPlugin: false,
      disableClientWebpackPlugin: false,
    }
  );
};
