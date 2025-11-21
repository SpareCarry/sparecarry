/**
 * Sentry Edge Configuration
 * 
 * Only loaded if NEXT_PUBLIC_SENTRY_DSN is set
 * Uses dynamic import to avoid build issues
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  // Dynamic import to prevent build issues
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
      debug: process.env.NODE_ENV === 'development',
    });
  }).catch((error) => {
    console.warn('[Sentry Edge] Failed to initialize:', error);
  });
}

export {};

