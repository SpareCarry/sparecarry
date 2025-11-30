/**
 * Development Mode Configuration
 *
 * Set EXPO_PUBLIC_DEV_MODE=true to explicitly enable dev shortcuts.
 * By default this is false so authentication is NOT skipped.
 */

export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === "true";

/**
 * Check if dev mode is enabled.
 * In practice this now only returns true if you explicitly set
 * EXPO_PUBLIC_DEV_MODE=true in the environment.
 */
export function isDevMode(): boolean {
  return DEV_MODE;
}

/**
 * Get a test user for dev mode
 * This bypasses authentication
 */
export function getDevModeUser() {
  return {
    id: "dev-user-id",
    email: "dev@sparecarry.com",
    user_metadata: {
      name: "Dev User",
    },
  };
}
