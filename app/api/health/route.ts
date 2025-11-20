/**
 * Health Check API Endpoint
 * 
 * Verifies connectivity and configuration of all critical services
 * Returns status for each service and overall health
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface ServiceStatus {
  status: 'ok' | 'error' | 'degraded';
  message: string;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  environment: string;
  services: {
    supabase: ServiceStatus;
    stripe: ServiceStatus;
    sentry: ServiceStatus;
    unleash: ServiceStatus;
    env: ServiceStatus;
  };
}

/**
 * Validate environment variables
 */
function validateEnv(): ServiceStatus {
  const required = [
    'NEXT_PUBLIC_APP_ENV',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optional = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_UNLEASH_URL',
    'NEXT_PUBLIC_UNLEASH_CLIENT_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      status: 'error',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: { missing, missingOptional },
    };
  }

  return {
    status: 'ok',
    message: 'All required environment variables are set',
    details: {
      missingOptional: missingOptional.length > 0 ? missingOptional : undefined,
    },
  };
}

/**
 * Check Supabase connectivity
 */
async function checkSupabase(): Promise<ServiceStatus> {
  try {
    const supabase = await createClient();
    
    // Simple query to verify connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      // If it's a permission error, that's actually OK - means DB is reachable
      if (error.code === 'PGRST116' || error.message.includes('permission')) {
        return {
          status: 'ok',
          message: 'Supabase connected (permission check passed)',
        };
      }
      
      return {
        status: 'error',
        message: `Supabase query failed: ${error.message}`,
        details: { code: error.code },
      };
    }

    return {
      status: 'ok',
      message: 'Supabase connected and queryable',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Supabase connection failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check Stripe connectivity
 */
async function checkStripe(): Promise<ServiceStatus> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'degraded',
        message: 'Stripe secret key not configured (server-only)',
      };
    }

    // Try to retrieve balance (lightweight operation)
    const balance = await stripe.balance.retrieve();

    if (balance && typeof balance.available === 'object') {
      return {
        status: 'ok',
        message: 'Stripe API connected',
        details: {
          livemode: balance.livemode,
        },
      };
    }

    return {
      status: 'error',
      message: 'Stripe API returned unexpected response',
    };
  } catch (error) {
    if (error instanceof Error) {
      // Some Stripe errors are expected (like invalid key format)
      if (error.message.includes('Invalid API Key')) {
        return {
          status: 'error',
          message: 'Stripe API key is invalid',
        };
      }
      
      return {
        status: 'error',
        message: `Stripe API error: ${error.message}`,
      };
    }
    
    return {
      status: 'error',
      message: 'Stripe API connection failed',
    };
  }
}

/**
 * Check Sentry configuration
 */
function checkSentry(): ServiceStatus {
  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    
    if (!dsn) {
      return {
        status: 'degraded',
        message: 'Sentry DSN not configured (optional)',
      };
    }

    // Validate DSN format
    try {
      const dsnUrl = new URL(dsn);
      if (!dsnUrl.hostname.includes('sentry.io') && !dsnUrl.hostname.includes('ingest.sentry.io')) {
        return {
          status: 'error',
          message: 'Sentry DSN format is invalid',
        };
      }
    } catch {
      return {
        status: 'error',
        message: 'Sentry DSN is not a valid URL',
      };
    }

    // Try to capture a test message (in test mode) - only if Sentry is available
    try {
      // Dynamic import to avoid build errors if Sentry is not installed
      const Sentry = await import('@sentry/nextjs').catch(() => null);
      if (Sentry) {
        Sentry.captureMessage('Health check test', {
          level: 'info',
          tags: {
            source: 'health_check',
            test: true,
          },
        });
      }
    } catch (error) {
      // If capture fails, Sentry might not be initialized, but DSN is valid
      return {
        status: 'degraded',
        message: 'Sentry DSN configured but not initialized',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }

    return {
      status: 'ok',
      message: 'Sentry configured and initialized',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Sentry check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check Unleash (Feature Flags) connectivity
 */
async function checkUnleash(): Promise<ServiceStatus> {
  try {
    const url = process.env.NEXT_PUBLIC_UNLEASH_URL;
    const clientKey = process.env.NEXT_PUBLIC_UNLEASH_CLIENT_KEY;

    if (!url || !clientKey) {
      return {
        status: 'degraded',
        message: 'Unleash not configured (optional)',
      };
    }

    // Validate URL format
    try {
      const unleashUrl = new URL(url);
      if (unleashUrl.protocol !== 'http:' && unleashUrl.protocol !== 'https:') {
        return {
          status: 'error',
          message: 'Unleash URL must be http:// or https://',
        };
      }
    } catch {
      return {
        status: 'error',
        message: 'Unleash URL is not valid',
      };
    }

    // Try to reach Unleash server (with timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Authorization': clientKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          status: 'ok',
          message: 'Unleash server is reachable',
        };
      } else {
        return {
          status: 'degraded',
          message: `Unleash server returned ${response.status}`,
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'error',
          message: 'Unleash server timeout (unreachable)',
        };
      }
      
      return {
        status: 'error',
        message: `Unleash server connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Unleash check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Determine overall health status
 */
function determineOverallStatus(services: HealthResponse['services']): 'ok' | 'degraded' | 'error' {
  const statuses = Object.values(services).map((s) => s.status);
  
  if (statuses.some((s) => s === 'error')) {
    return 'error';
  }
  
  if (statuses.some((s) => s === 'degraded')) {
    return 'degraded';
  }
  
  return 'ok';
}

export async function GET(request: NextRequest) {
  try {
    // Run all health checks in parallel
    const [supabaseStatus, stripeStatus, sentryStatus, unleashStatus, envStatus] = await Promise.all([
      checkSupabase(),
      checkStripe(),
      Promise.resolve(checkSentry()),
      checkUnleash(),
      Promise.resolve(validateEnv()),
    ]);

    const services = {
      supabase: supabaseStatus,
      stripe: stripeStatus,
      sentry: sentryStatus,
      unleash: unleashStatus,
      env: envStatus,
    };

    const overallStatus = determineOverallStatus(services);

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'unknown',
      services,
    };

    // Log health check (only if degraded or error)
    if (overallStatus !== 'ok') {
      logger.warn('Health check returned non-ok status', {
        status: overallStatus,
        services,
      });
    }

    // Return appropriate status code
    const statusCode = overallStatus === 'error' ? 503 : overallStatus === 'degraded' ? 200 : 200;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    logger.error('Health check endpoint error', error);
    
    return NextResponse.json(
      {
        status: 'error' as const,
        timestamp: new Date().toISOString(),
        environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'unknown',
        services: {
          supabase: { status: 'error', message: 'Health check failed' },
          stripe: { status: 'error', message: 'Health check failed' },
          sentry: { status: 'error', message: 'Health check failed' },
          unleash: { status: 'error', message: 'Health check failed' },
          env: { status: 'error', message: 'Health check failed' },
        },
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

