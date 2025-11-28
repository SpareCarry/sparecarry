/**
 * Development Mode Configuration
 * 
 * Set DEV_MODE=true to skip authentication and go straight to home screen
 * 
 * ⚠️ IMPORTANT: Always set DEV_MODE=false before production builds!
 */

export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true' || __DEV__;

/**
 * Check if dev mode is enabled
 * In production, this will always return false
 */
export function isDevMode(): boolean {
  // In production builds, __DEV__ is false
  // Only allow dev mode if explicitly set via env var or in development
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return DEV_MODE;
}

/**
 * Get a test user for dev mode
 * This bypasses authentication
 */
export function getDevModeUser() {
  return {
    id: 'dev-user-id',
    email: 'dev@sparecarry.com',
    user_metadata: {
      name: 'Dev User',
    },
  };
}

