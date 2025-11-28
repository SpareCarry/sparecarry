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
 * Helper to create dynamic import paths that webpack can't statically analyze
 */
function getCapacitorModulePath(moduleName: string): string {
  // Use string concatenation to prevent webpack static analysis
  const base = '@capacitor';
  return base + '/' + moduleName;
}

/**
 * Safely import Capacitor (client-side only)
 */
export async function getCapacitor(): Promise<any> {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // Use dynamic path construction to prevent webpack from statically analyzing
    const corePath = getCapacitorModulePath('core');
    const { Capacitor } = await import(/* @vite-ignore */ /* webpackIgnore: true */ corePath);
    return Capacitor;
  } catch {
    return null;
  }
}

