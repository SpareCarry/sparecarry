/**
 * Mobile Performance Profiler
 * 
 * Lightweight performance instrumentation for Capacitor mobile app
 * Tracks cold start, warm start, bundle load, and bridge latency
 */

import { isNativePlatform, getPlatform } from '@/lib/utils/capacitor-safe';

interface MobilePerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class MobilePerformanceProfiler {
  private metrics: MobilePerformanceMetric[] = [];
  private appStartTime: number;
  private bundleLoadTime?: number;
  private enabled = true;

  constructor() {
    this.appStartTime = Date.now();
    this.enabled = isNativePlatform() && 
                   (process.env.NODE_ENV !== 'production' || 
                    process.env.NEXT_PUBLIC_ENABLE_PERF === 'true');

    if (this.enabled && typeof window !== 'undefined') {
      this.initializeMobileProfiling();
    }
  }

  /**
   * Initialize mobile profiling
   */
  private initializeMobileProfiling(): void {
    // Track bundle load time
    if (document.readyState === 'complete') {
      this.recordBundleLoad();
    } else {
      window.addEventListener('load', () => {
        this.recordBundleLoad();
      });
    }

    // Track app visibility changes (warm start detection)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.recordWarmStart();
      }
    });
  }

  /**
   * Record cold start time
   */
  recordColdStart(): void {
    if (!this.enabled) return;

    const coldStartTime = Date.now() - this.appStartTime;
    this.recordMetric({
      name: 'cold-start',
      value: coldStartTime,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        platform: getPlatform(),
      },
    });
  }

  /**
   * Record warm start time
   */
  recordWarmStart(): void {
    if (!this.enabled) return;

    const warmStartTime = performance.now();
    this.recordMetric({
      name: 'warm-start',
      value: warmStartTime,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        platform: getPlatform(),
      },
    });
  }

  /**
   * Record bundle load time
   */
  recordBundleLoad(): void {
    if (!this.enabled || this.bundleLoadTime !== undefined) return;

    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.bundleLoadTime = loadTime;

        this.recordMetric({
          name: 'bundle-load',
          value: loadTime,
          unit: 'ms',
          timestamp: Date.now(),
          metadata: {
            platform: getPlatform(),
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstPaint: this.getFirstPaint(),
          },
        });
      }
    }
  }

  /**
   * Get first paint time
   */
  private getFirstPaint(): number | undefined {
    if (typeof window === 'undefined' || !window.performance) return undefined;

    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find((entry) => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : undefined;
  }

  /**
   * Record bridge command latency
   */
  async recordBridgeLatency<T>(
    command: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const startTime = performance.now();
    try {
      const result = await fn();
      const latency = performance.now() - startTime;

      this.recordMetric({
        name: 'bridge-latency',
        value: latency,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: {
          command,
          platform: getPlatform(),
        },
      });

      // Warn if bridge call is slow
      if (latency > 100) {
        console.warn(
          `[Mobile Performance] Slow bridge call: ${command} took ${latency.toFixed(2)}ms`
        );
      }

      return result;
    } catch (error) {
      const latency = performance.now() - startTime;
      this.recordMetric({
        name: 'bridge-latency',
        value: latency,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: {
          command,
          platform: getPlatform(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Record push notification delivery latency
   */
  recordPushNotificationLatency(
    notificationId: string,
    receivedAt: number,
    sentAt?: number
  ): void {
    if (!this.enabled) return;

    const latency = sentAt ? receivedAt - sentAt : 0;
    this.recordMetric({
      name: 'push-notification-latency',
      value: latency,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        notificationId,
        platform: getPlatform(),
      },
    });
  }

  /**
   * Record metric
   */
  private recordMetric(metric: MobilePerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): MobilePerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): MobilePerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average latency for bridge commands
   */
  getAverageBridgeLatency(): number | null {
    const metrics = this.getMetricsByName('bridge-latency');
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    coldStartTime?: number;
    warmStartTime?: number;
    bundleLoadTime?: number;
    averageBridgeLatency?: number;
    totalMetrics: number;
  } {
    const coldStart = this.getMetricsByName('cold-start')[0];
    const warmStart = this.getMetricsByName('warm-start')[0];
    const bundleLoad = this.getMetricsByName('bundle-load')[0];
    const avgBridgeLatency = this.getAverageBridgeLatency();

    return {
      coldStartTime: coldStart?.value,
      warmStartTime: warmStart?.value,
      bundleLoadTime: bundleLoad?.value,
      averageBridgeLatency: avgBridgeLatency || undefined,
      totalMetrics: this.metrics.length,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const mobileProfiler = new MobilePerformanceProfiler();

/**
 * Wrap Capacitor plugin calls with performance tracking
 */
export async function perfBridge<T>(
  command: string,
  fn: () => Promise<T>
): Promise<T> {
  return mobileProfiler.recordBridgeLatency(command, fn);
}

