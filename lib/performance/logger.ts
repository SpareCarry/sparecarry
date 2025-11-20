/**
 * Performance Logger
 * 
 * Aggregates and logs performance metrics
 * Anonymizes sensitive data and provides structured logging
 */

import { webProfiler } from './web-profiler';
import { mobileProfiler } from './mobile-profiler';
import { dbProfiler } from './db-profiler';
import { reactProfiler } from './react-profiler';

interface PerformanceReport {
  timestamp: number;
  web: ReturnType<typeof webProfiler.getSummary>;
  mobile?: ReturnType<typeof mobileProfiler.getSummary>;
  database: ReturnType<typeof dbProfiler.getSummary>;
  react: {
    totalComponents: number;
    slowestComponents: ReturnType<typeof reactProfiler.getSlowestComponents>;
  };
}

class PerformanceLogger {
  private enabled = true;
  private reportInterval?: NodeJS.Timeout;

  constructor() {
    this.enabled = process.env.NODE_ENV !== 'production' || 
                   process.env.NEXT_PUBLIC_ENABLE_PERF === 'true';
  }

  /**
   * Start periodic reporting
   */
  startReporting(intervalMs: number = 60000): void {
    if (!this.enabled || this.reportInterval) return;

    this.reportInterval = setInterval(() => {
      this.logReport();
    }, intervalMs);
  }

  /**
   * Stop periodic reporting
   */
  stopReporting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = undefined;
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    return {
      timestamp: Date.now(),
      web: webProfiler.getSummary(),
      mobile: typeof window !== 'undefined' && window.Capacitor
        ? mobileProfiler.getSummary()
        : undefined,
      database: dbProfiler.getSummary(),
      react: {
        totalComponents: reactProfiler.getAllMetrics().length,
        slowestComponents: reactProfiler.getSlowestComponents(5),
      },
    };
  }

  /**
   * Log performance report
   */
  logReport(): void {
    if (!this.enabled) return;

    const report = this.generateReport();
    
    console.group('[Performance Report]');
    console.log('Web Performance:', report.web);
    if (report.mobile) {
      console.log('Mobile Performance:', report.mobile);
    }
    console.log('Database Performance:', report.database);
    console.log('React Performance:', report.react);
    console.groupEnd();

    // In production, you might want to send this to a monitoring service
    if (process.env.NEXT_PUBLIC_PERF_ENDPOINT) {
      this.sendToEndpoint(report);
    }
  }

  /**
   * Send report to monitoring endpoint
   */
  private async sendToEndpoint(report: PerformanceReport): Promise<void> {
    try {
      await fetch(process.env.NEXT_PUBLIC_PERF_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch (error) {
      // Silently fail - don't break the app
      console.debug('[Performance] Failed to send report to endpoint', error);
    }
  }

  /**
   * Get all metrics in a structured format
   */
  getAllMetrics(): {
    web: ReturnType<typeof webProfiler.getMetrics>;
    mobile: ReturnType<typeof mobileProfiler.getMetrics>;
    database: ReturnType<typeof dbProfiler.getMetrics>;
    react: ReturnType<typeof reactProfiler.getAllMetrics>;
  } {
    return {
      web: webProfiler.getMetrics(),
      mobile: mobileProfiler.getMetrics(),
      database: dbProfiler.getMetrics(),
      react: reactProfiler.getAllMetrics(),
    };
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    webProfiler.clear();
    mobileProfiler.clear();
    dbProfiler.clear();
    reactProfiler.clear();
  }
}

// Singleton instance
export const performanceLogger = new PerformanceLogger();

// Auto-start reporting in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  performanceLogger.startReporting(60000); // Report every minute in dev
}

