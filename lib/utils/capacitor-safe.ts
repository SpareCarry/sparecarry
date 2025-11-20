/**
 * Safe Capacitor utilities for SSR compatibility
 * 
 * These utilities safely check for Capacitor without causing SSR errors
 */

/**
 * Check if running on native platform (client-side only)
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR - always return false
  }
  
  // Check for Capacitor in a safe way
  try {
    const capacitor = (window as any).Capacitor;
    return capacitor?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

/**
 * Get platform name (client-side only)
 */
export function getPlatform(): string {
  if (typeof window === 'undefined') {
    return 'web'; // SSR - default to web
  }
  
  try {
    const capacitor = (window as any).Capacitor;
    return capacitor?.getPlatform?.() ?? 'web';
  } catch {
    return 'web';
  }
}

/**
 * Safely import Capacitor (client-side only)
 */
export async function getCapacitor(): Promise<any> {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor;
  } catch {
    return null;
  }
}

