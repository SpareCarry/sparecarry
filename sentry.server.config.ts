/**
 * Sentry Server Configuration
 * 
 * Only loaded if NEXT_PUBLIC_SENTRY_DSN is set
 * Uses dynamic import to avoid build issues
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';

if (SENTRY_DSN) {
  // Dynamic import to prevent build issues
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: ENVIRONMENT === 'production'
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2')
      : 1.0,
    
    // Adjust this value in production
    profilesSampleRate: ENVIRONMENT === 'production'
      ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1')
      : 1.0,
    
    // Enable debug mode in development/staging
    debug: ENVIRONMENT !== 'production',
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    
    // Integrations
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    
    // Before send hook for filtering
    beforeSend(event, hint) {
      // Filter out non-production errors in production
      if (ENVIRONMENT === 'production' && event.environment !== 'production') {
        return null;
      }
      
      // Redact sensitive data
      if (event.request) {
        // Redact authorization headers
        if (event.request.headers) {
          Object.keys(event.request.headers).forEach((key) => {
            if (key.toLowerCase().includes('authorization') || 
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('secret')) {
              event.request!.headers![key] = '[REDACTED]';
            }
          });
        }
        
        // Redact sensitive query parameters
        if (event.request.query_string) {
          const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key'];
          sensitiveParams.forEach((param) => {
            if (event.request!.query_string!.includes(param)) {
              event.request!.query_string = event.request!.query_string!.replace(
                new RegExp(`${param}=[^&]*`, 'gi'),
                `${param}=[REDACTED]`
              );
            }
          });
        }
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Network errors
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      // Validation errors (expected)
      'ValidationError',
      'ZodError',
    ],
    });
  }).catch((error) => {
    console.warn('[Sentry] Failed to initialize:', error);
  });
}
