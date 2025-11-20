/**
 * Web Performance Profiler
 * 
 * Lightweight performance instrumentation for Next.js web app
 * Uses Web Performance API and Next.js measure utilities
 */

interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  metadata?: Record<string, unknown>;
}

class WebPerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private metrics: PerformanceMetric[] = [];
  private slowThreshold = 150; // ms
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = process.env.NODE_ENV !== 'production' || 
                     process.env.NEXT_PUBLIC_ENABLE_PERF === 'true';
    }
  }

  /**
   * Start a performance mark
   */
  mark(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    this.marks.set(name, startTime);

    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.mark(`${name}-start`);
      } catch {
        // Performance API not available
      }
    }
  }

  /**
   * End a performance mark and record metric
   */
  measure(name: string, metadata?: Record<string, unknown>): number | null {
    if (!this.enabled) return null;

    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`[Performance] Mark "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Record metric
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      metadata: {
        ...metadata,
        startTime,
        endTime,
      },
    });

    // Log slow operations
    if (duration > this.slowThreshold) {
      this.logSlowOperation(name, duration, metadata);
    }

    // Clean up mark
    this.marks.delete(name);

    // Performance API measure
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.mark(`${name}-end`);
        window.performance.measure(name, `${name}-start`, `${name}-end`);
      } catch {
        // Performance API not available
      }
    }

    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Log slow operation
   */
  private logSlowOperation(
    name: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const sanitizedMetadata = this.sanitizeMetadata(metadata);
    console.warn(
      `[Performance] Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
      sanitizedMetadata
    );
  }

  /**
   * Sanitize metadata to remove sensitive data
   */
  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'key', 'authorization'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .filter((m) => m.unit === 'ms')
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    slowOperations: number;
    averagePageLoad?: number;
    averageRouteTransition?: number;
  } {
    const slowOps = this.metrics.filter(
      (m) => m.unit === 'ms' && m.value > this.slowThreshold
    ).length;

    const pageLoadMetrics = this.getMetricsByName('page-load');
    const routeTransitionMetrics = this.getMetricsByName('route-transition');

    return {
      totalMetrics: this.metrics.length,
      slowOperations: slowOps,
      averagePageLoad: pageLoadMetrics.length > 0
        ? pageLoadMetrics.reduce((acc, m) => acc + m.value, 0) / pageLoadMetrics.length
        : undefined,
      averageRouteTransition: routeTransitionMetrics.length > 0
        ? routeTransitionMetrics.reduce((acc, m) => acc + m.value, 0) / routeTransitionMetrics.length
        : undefined,
    };
  }
}

// Singleton instance
export const webProfiler = new WebPerformanceProfiler();

/**
 * Performance mark helper
 */
export function perfMark(name: string, metadata?: Record<string, unknown>): void {
  webProfiler.mark(name, metadata);
}

/**
 * Performance measure helper
 */
export function perfMeasure(name: string, metadata?: Record<string, unknown>): number | null {
  return webProfiler.measure(name, metadata);
}

/**
 * Performance wrapper for async functions
 */
export async function perfWrap<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  perfMark(name, metadata);
  try {
    const result = await fn();
    perfMeasure(name, { ...metadata, success: true });
    return result;
  } catch (error) {
    perfMeasure(name, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Performance wrapper for sync functions
 */
export function perfWrapSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  perfMark(name, metadata);
  try {
    const result = fn();
    perfMeasure(name, { ...metadata, success: true });
    return result;
  } catch (error) {
    perfMeasure(name, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

