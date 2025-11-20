/**
 * Mobile Logging (Capacitor)
 * 
 * Captures device logs and runtime errors in Capacitor WebView
 */

import { isNativePlatform, getPlatform } from '@/lib/utils/capacitor-safe';
import { logger } from './index';

class MobileLogger {
  private enabled = isNativePlatform();

  constructor() {
    if (this.enabled && typeof window !== 'undefined') {
      this.initializeMobileLogging();
    }
  }

  /**
   * Initialize mobile logging
   */
  private initializeMobileLogging(): void {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logUnhandledRejection(event.reason);
    });

    // Capture global errors
    window.addEventListener('error', (event) => {
      this.logGlobalError(event.error || event.message);
    });

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      originalConsoleError.apply(console, args);
      this.logConsoleError(args);
    };
  }

  /**
   * Log unhandled promise rejection
   */
  private logUnhandledRejection(reason: unknown): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled promise rejection', error, {
      platform: getPlatform(),
      type: 'unhandled_rejection',
    });
  }

  /**
   * Log global error
   */
  private logGlobalError(error: Error | string): void {
    const errorObj = error instanceof Error ? error : new Error(error);
    logger.error('Global error caught', errorObj, {
      platform: getPlatform(),
      type: 'global_error',
    });
  }

  /**
   * Log console error
   */
  private logConsoleError(args: unknown[]): void {
    // Only log if it looks like an error
    const errorString = args.map(String).join(' ');
    if (errorString.toLowerCase().includes('error') || errorString.toLowerCase().includes('exception')) {
      logger.warn('Console error detected', {
        platform: getPlatform(),
        message: errorString,
        type: 'console_error',
      });
    }
  }

  /**
   * Log network failure
   */
  logNetworkFailure(url: string, error: Error | unknown): void {
    logger.error('Network request failed', error instanceof Error ? error : new Error(String(error)), {
      platform: getPlatform(),
      url,
      type: 'network_failure',
    });
  }

  /**
   * Log device info
   */
  logDeviceInfo(): void {
    if (typeof window === 'undefined') return;

    logger.info('Device info', {
      platform: getPlatform(),
      userAgent: navigator.userAgent.substring(0, 100), // Truncated
      language: navigator.language,
      onLine: navigator.onLine,
    });
  }
}

// Singleton instance
export const mobileLogger = new MobileLogger();

