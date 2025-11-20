/**
 * Environment Configuration
 * 
 * Centralized environment variable management with type safety
 * Supports: development, staging, production
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * Get current app environment
 */
export function getAppEnvironment(): AppEnvironment {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  
  if (env === 'staging' || env === 'production') {
    return env;
  }
  
  // Default to development if not set or invalid
  return 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getAppEnvironment() === 'production';
}

/**
 * Check if running in staging
 */
export function isStaging(): boolean {
  return getAppEnvironment() === 'staging';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getAppEnvironment() === 'development';
}

/**
 * Get API base URL based on environment
 */
export function getApiBaseUrl(): string {
  const env = getAppEnvironment();
  
  switch (env) {
    case 'production':
      return process.env.NEXT_PUBLIC_APP_URL || 'https://sparecarry.com';
    case 'staging':
      return process.env.NEXT_PUBLIC_APP_URL || 'https://staging.sparecarry.com';
    case 'development':
      return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    default:
      return 'http://localhost:3000';
  }
}

/**
 * Get Supabase URL based on environment
 */
export function getSupabaseUrl(): string {
  const env = getAppEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!url) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not set for ${env} environment`);
  }
  
  return url;
}

/**
 * Get Sentry environment name
 */
export function getSentryEnvironment(): string {
  return getAppEnvironment();
}

/**
 * Get feature flag service URL
 */
export function getFeatureFlagUrl(): string | null {
  return process.env.NEXT_PUBLIC_UNLEASH_URL || null;
}

/**
 * Environment configuration object
 */
export const envConfig = {
  environment: getAppEnvironment(),
  isProduction: isProduction(),
  isStaging: isStaging(),
  isDevelopment: isDevelopment(),
  apiBaseUrl: getApiBaseUrl(),
  supabaseUrl: getSupabaseUrl(),
  sentryEnvironment: getSentryEnvironment(),
  featureFlagUrl: getFeatureFlagUrl(),
} as const;

