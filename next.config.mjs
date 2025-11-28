/** Auto-generated safe next.config.mjs (backup saved as next.config.mjs.bak) */

import { PHASE_PRODUCTION_BUILD } from "next/constants";
import runtimeEnvModule from "./scripts/runtime-env.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { validateRuntimeEnv } = runtimeEnvModule;

export default async function createNextConfig(phase) {
  validateRuntimeEnv({ phase });

  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
  process.env.NEXT_PUBLIC_SENTRY_DSN = SENTRY_DSN;
  const enableSentryWebpackPlugin = SENTRY_DSN.length > 0;

  const nextConfig = {
    reactStrictMode: true,
    experimental: {},
    webpack(config, { isServer, webpack }) {
      // Exclude Capacitor modules from web build (mobile-only)
      // These are only used in mobile apps, not in web builds
      
      const stubsBasePath = join(__dirname, 'lib/stubs/@capacitor');
      
      // Set up aliases to point to stub modules
      // The source code uses dynamic imports, but webpack may still try to resolve them
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@capacitor/core': join(stubsBasePath, 'core.ts'),
        '@capacitor/push-notifications': join(stubsBasePath, 'push-notifications.ts'),
        '@capacitor/local-notifications': join(stubsBasePath, 'local-notifications.ts'),
        '@capacitor/haptics': join(stubsBasePath, 'haptics.ts'),
        '@capacitor/app': join(stubsBasePath, 'app.ts'),
      };
      
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
