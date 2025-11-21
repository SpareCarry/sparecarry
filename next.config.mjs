/** Auto-generated safe next.config.mjs (backup saved as next.config.mjs.bak) */

import { PHASE_PRODUCTION_BUILD } from "next/constants";
import runtimeEnvModule from "./scripts/runtime-env.js";

const { validateRuntimeEnv } = runtimeEnvModule;

export default async function createNextConfig(phase) {
  validateRuntimeEnv({ phase });

  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
  process.env.NEXT_PUBLIC_SENTRY_DSN = SENTRY_DSN;
  const enableSentryWebpackPlugin = SENTRY_DSN.length > 0;

  const nextConfig = {
    reactStrictMode: true,
    experimental: {},
    webpack(config) {
      return config;
    },
  };

  if (!enableSentryWebpackPlugin) {
    if (phase === PHASE_PRODUCTION_BUILD) {
      console.warn("[Sentry] NEXT_PUBLIC_SENTRY_DSN is not set. Skipping Sentry webpack plugins.");
    }
    return nextConfig;
  }

  const { withSentryConfig } = await import("@sentry/nextjs");
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
}
