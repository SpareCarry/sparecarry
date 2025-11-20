/**
 * Authentication Guards
 * 
 * Server-side authentication validation and guards
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeError } from './validation';

/**
 * Authenticated user data
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Assert that request is authenticated
 * Throws sanitized error if not authenticated
 */
export async function assertAuthenticated(
  request: NextRequest
): Promise<AuthenticatedUser> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const sanitized = sanitizeError(authError || new Error('Not authenticated'));
      throw new Error(sanitized.message);
    }

    // Get session for token validation
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      const sanitized = sanitizeError(sessionError || new Error('No active session'));
      throw new Error(sanitized.message);
    }

    // Never log tokens - only return safe user data
    return {
      id: user.id,
      email: user.email || '',
      session: {
        access_token: session.access_token, // Used internally, never logged
        refresh_token: session.refresh_token, // Used internally, never logged
      },
    };
  } catch (error) {
    // Sanitize all errors
    const sanitized = sanitizeError(error);
    throw new Error(sanitized.message);
  }
}

/**
 * Get authenticated user (returns null if not authenticated)
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    return await assertAuthenticated(request);
  } catch {
    return null;
  }
}

/**
 * Require specific user ID (for admin or resource ownership checks)
 */
export async function requireUserId(
  request: NextRequest,
  requiredUserId: string
): Promise<AuthenticatedUser> {
  const user = await assertAuthenticated(request);

  if (user.id !== requiredUserId) {
    throw new Error('Access denied');
  }

  return user;
}

/**
 * Check if user has required role/permission
 * (Extend this based on your permission system)
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<AuthenticatedUser> {
  const user = await assertAuthenticated(request);

  // TODO: Implement permission checking based on your system
  // For now, just ensure user is authenticated
  // Example:
  // const profile = await getProfile(user.id);
  // if (!profile.permissions.includes(permission)) {
  //   throw new Error('Insufficient permissions');
  // }

  return user;
}

/**
 * Safe logger that never logs sensitive data
 */
export function safeLog(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  
  if (level === 'error') {
    console.error(`[${level.toUpperCase()}]`, message, sanitizedData);
  } else if (level === 'warn') {
    console.warn(`[${level.toUpperCase()}]`, message, sanitizedData);
  } else {
    console.log(`[${level.toUpperCase()}]`, message, sanitizedData);
  }
}

/**
 * Sanitize log data to remove sensitive information
 */
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'token',
    'jwt',
    'access_token',
    'refresh_token',
    'session',
    'secret',
    'key',
    'authorization',
    'cookie',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

