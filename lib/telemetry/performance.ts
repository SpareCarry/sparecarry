/**
 * Performance Telemetry
 * 
 * Captures real-device performance metrics
 * Web: TTFB, FCP, LCP, FID, CLS
 * Mobile: Cold start, warm start, API latency
 */

import { trackEvent } from './client';
import { getAppEnvironment } from '../env/config';

/**
 * Web Performance Metrics
 */
export function captureWebPerformanceMetrics(): void {
  if (typeof window === 'undefined') return;

  // Wait for performance API
  if (!window.performance || !window.performance.getEntriesByType) return;

  // Capture TTFB (Time to First Byte)
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    trackEvent('performance.metric', {
      metric: 'ttfb',
      value: ttfb,
      unit: 'ms',
    }, { ttfb });
  }

  // Capture FCP (First Contentful Paint)
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    trackEvent('performance.metric', {
      metric: 'fcp',
      value: fcpEntry.startTime,
      unit: 'ms',
    }, { fcp: fcpEntry.startTime });
  }

  // Capture LCP (Largest Contentful Paint) using PerformanceObserver
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        trackEvent('performance.metric', {
          metric: 'lcp',
          value: lastEntry.renderTime || lastEntry.loadTime,
          unit: 'ms',
        }, { lcp: lastEntry.renderTime || lastEntry.loadTime });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP not supported
    }
  }

  // Capture FID (First Input Delay) using PerformanceObserver
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          trackEvent('performance.metric', {
            metric: 'fid',
            value: entry.processingStart - entry.startTime,
            unit: 'ms',
          }, { fid: entry.processingStart - entry.startTime });
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch {
      // FID not supported
    }
  }

  // Capture CLS (Cumulative Layout Shift) using PerformanceObserver
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        trackEvent('performance.metric', {
          metric: 'cls',
          value: clsValue,
          unit: 'score',
        }, { cls: clsValue });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch {
      // CLS not supported
    }
  }
}

/**
 * Capture page load performance
 */
export function capturePageLoadPerformance(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigationEntry) {
      const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
      
      trackEvent('page.load', {
        path: window.location.pathname,
        loadTime,
      }, {
        duration: loadTime,
        ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
      });
    }
  });
}

/**
 * Capture API request latency
 */
export function captureApiLatency(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  error?: string
): void {
  trackEvent('api.request', {
    endpoint,
    method,
    statusCode,
    error,
  }, {
    duration,
  });

  // Log slow requests
  if (duration > 1000) {
    trackEvent('api.error', {
      endpoint,
      method,
      statusCode,
      error: 'Slow request',
      duration,
    });
  }
}

/**
 * Mobile Performance Metrics
 * (Called from Capacitor plugins)
 */
export function captureMobilePerformance(
  metric: 'cold_start' | 'warm_start' | 'api_latency',
  value: number,
  metadata?: Record<string, unknown>
): void {
  trackEvent('performance.metric', {
    metric,
    value,
    unit: 'ms',
    ...metadata,
  }, {
    duration: value,
  });
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Only in staging/production
  if (getAppEnvironment() === 'development') return;

  // Capture web performance metrics
  captureWebPerformanceMetrics();
  
  // Capture page load performance
  capturePageLoadPerformance();
}

