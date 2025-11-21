/**
 * Sentry Client Configuration
 * 
 * Only loaded if NEXT_PUBLIC_SENTRY_DSN is set
 * Uses dynamic import to avoid SSR issues
 */

// Only run on client-side
if (typeof window !== 'undefined') {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';

  if (SENTRY_DSN) {
    // Dynamic import to prevent SSR issues
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
      new Sentry.BrowserTracing({
        // Set tracing origins
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.sparecarry\.com/,
          /^https:\/\/staging\.sparecarry\.com/,
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Before send hook for filtering
    beforeSend(event, hint) {
      // Filter out non-production errors in production
      if (ENVIRONMENT === 'production' && event.environment !== 'production') {
        return null;
      }
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Third-party scripts
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
    ],
      });
    }).catch((error) => {
      console.warn('[Sentry] Failed to initialize:', error);
    });
  }
}

export {};