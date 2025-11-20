/**
 * Error Test Endpoint
 * 
 * Only available in staging environment
 * Used to test error logging and Sentry integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only allow in staging or development
  const isStaging = process.env.NODE_ENV === 'development' || 
                    process.env.VERCEL_ENV === 'preview' ||
                    process.env.NEXT_PUBLIC_APP_URL?.includes('staging') ||
                    process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

  if (!isStaging) {
    return NextResponse.json(
      { error: 'Error test endpoint is only available in staging/development' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type') || 'generic';

  try {
    switch (errorType) {
      case 'generic':
        throw new Error('Test error for health check - generic error');
      
      case 'api':
        throw new Error('Test error for health check - API error');
      
      case 'database':
        const dbError = new Error('Test error for health check - database error');
        (dbError as any).code = 'DB_CONNECTION_ERROR';
        throw dbError;
      
      case 'validation':
        const validationError = new Error('Test error for health check - validation error');
        (validationError as any).code = 'VALIDATION_ERROR';
        (validationError as any).details = {
          field: 'email',
          message: 'Invalid email format',
        };
        throw validationError;
      
      case 'sentry':
        // Explicitly test Sentry capture
        logger.error('Sentry health check test error', new Error('Test error for Sentry'), {
          test: true,
          source: 'health_check',
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({
          success: true,
          message: 'Test error logged to Sentry',
          errorType: 'sentry',
        });
      
      default:
        return NextResponse.json(
          { error: `Unknown error type: ${errorType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    // Log the error (which should send to Sentry if configured)
    logger.error('Error test endpoint triggered', error, {
      errorType,
      test: true,
      source: 'health_check',
      timestamp: new Date().toISOString(),
    });

    // Return error response
    return NextResponse.json(
      {
        success: true,
        message: 'Test error triggered and logged',
        errorType,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: (error as any).code,
          details: (error as any).details,
        },
      },
      { status: 500 }
    );
  }
}

