/**
 * Enhanced Performance Profiler
 *
 * Auto-detects bottlenecks, suggests optimizations, and tracks performance metrics.
 * Integrates with existing profiler system.
 */

"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { webProfiler } from "./web-profiler";
import { reactProfiler } from "./react-profiler";

// ============================================================================
// Types
// ============================================================================

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
  slowRenders: number;
  lastRenderTime: number;
  propsChanges: number;
  stateChanges: number;
}

interface Bottleneck {
  component: string;
  issue: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestion: string;
  impact: string;
}

interface NetworkMetrics {
  endpoint: string;
  callCount: number;
  averageDuration: number;
  errorRate: number;
  cacheHitRate: number;
  errorCount: number;
  cacheHitCount: number;
}

// ============================================================================
// Performance Analyzer
// ============================================================================

class PerformanceAnalyzer {
  private componentMetrics = new Map<string, PerformanceMetrics>();
  private networkMetrics = new Map<string, NetworkMetrics>();
  private renderHistory: Array<{
    component: string;
    time: number;
    timestamp: number;
  }> = [];
  private readonly MAX_HISTORY = 1000;
  private readonly SLOW_RENDER_THRESHOLD = 16; // 1 frame at 60fps
  private readonly CRITICAL_RENDER_THRESHOLD = 50; // 3+ frames

  /**
   * Record component render
   */
  recordRender(
    componentName: string,
    renderTime: number,
    propsChanged: boolean = false,
    stateChanged: boolean = false
  ): void {
    const existing = this.componentMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      averageRenderTime: 0,
      maxRenderTime: 0,
      slowRenders: 0,
      lastRenderTime: renderTime,
      propsChanges: 0,
      stateChanges: 0,
    };

    existing.renderCount++;
    existing.averageRenderTime =
      (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) /
      existing.renderCount;
    existing.maxRenderTime = Math.max(existing.maxRenderTime, renderTime);
    existing.lastRenderTime = renderTime;

    if (renderTime > this.SLOW_RENDER_THRESHOLD) {
      existing.slowRenders++;
    }

    if (propsChanged) existing.propsChanges++;
    if (stateChanged) existing.stateChanges++;

    this.componentMetrics.set(componentName, existing);

    // Add to history
    this.renderHistory.push({
      component: componentName,
      time: renderTime,
      timestamp: Date.now(),
    });

    if (this.renderHistory.length > this.MAX_HISTORY) {
      this.renderHistory.shift();
    }
  }

  /**
   * Record network request
   */
  recordNetworkRequest(
    endpoint: string,
    duration: number,
    cached: boolean = false,
    error: boolean = false
  ): void {
    const existing = this.networkMetrics.get(endpoint) || {
      endpoint,
      callCount: 0,
      averageDuration: 0,
      errorRate: 0,
      cacheHitRate: 0,
      errorCount: 0,
      cacheHitCount: 0,
    };

    existing.callCount++;
    existing.averageDuration =
      (existing.averageDuration * (existing.callCount - 1) + duration) /
      existing.callCount;

    if (cached) existing.cacheHitCount++;
    if (error) existing.errorCount++;

    existing.cacheHitRate = existing.cacheHitCount / existing.callCount;
    existing.errorRate = existing.errorCount / existing.callCount;

    this.networkMetrics.set(endpoint, existing);
  }

  /**
   * Detect bottlenecks
   */
  detectBottlenecks(): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Check component performance
    for (const [name, metrics] of this.componentMetrics.entries()) {
      // High render count
      if (metrics.renderCount > 100 && metrics.averageRenderTime > 10) {
        bottlenecks.push({
          component: name,
          issue: "High render count with slow renders",
          severity:
            metrics.averageRenderTime > this.CRITICAL_RENDER_THRESHOLD
              ? "critical"
              : "high",
          suggestion: `Consider using React.memo() and useMemo() for ${name}. Review props and state changes.`,
          impact: `${metrics.renderCount} renders, ${metrics.slowRenders} slow renders (>${this.SLOW_RENDER_THRESHOLD}ms)`,
        });
      }

      // Frequent props changes
      if (
        metrics.propsChanges > metrics.renderCount * 0.8 &&
        metrics.renderCount > 20
      ) {
        bottlenecks.push({
          component: name,
          issue: "Excessive props changes causing re-renders",
          severity: "medium",
          suggestion: `Stabilize props with useMemo() or useCallback() in parent components. Consider splitting ${name} into smaller components.`,
          impact: `${metrics.propsChanges} props changes out of ${metrics.renderCount} renders`,
        });
      }

      // Critical render time
      if (metrics.maxRenderTime > this.CRITICAL_RENDER_THRESHOLD) {
        bottlenecks.push({
          component: name,
          issue: "Critical render time detected",
          severity: "critical",
          suggestion: `Immediate optimization needed for ${name}. Consider lazy loading, code splitting, or virtualizing lists.`,
          impact: `Max render time: ${metrics.maxRenderTime.toFixed(2)}ms`,
        });
      }
    }

    // Check network performance
    for (const [endpoint, metrics] of this.networkMetrics.entries()) {
      // High error rate
      if (metrics.errorRate > 0.1 && metrics.callCount > 10) {
        bottlenecks.push({
          component: endpoint,
          issue: "High API error rate",
          severity: "high",
          suggestion: `Review error handling for ${endpoint}. Consider retry logic or fallback mechanisms.`,
          impact: `${(metrics.errorRate * 100).toFixed(1)}% error rate (${metrics.callCount} calls)`,
        });
      }

      // Low cache hit rate for cacheable endpoints
      if (
        metrics.cacheHitRate < 0.3 &&
        metrics.callCount > 20 &&
        endpoint.includes("autocomplete")
      ) {
        bottlenecks.push({
          component: endpoint,
          issue: "Low cache utilization",
          severity: "low",
          suggestion: `Improve caching strategy for ${endpoint}. Consider longer TTL or better cache keys.`,
          impact: `${(metrics.cacheHitRate * 100).toFixed(1)}% cache hit rate`,
        });
      }

      // Slow network requests
      if (metrics.averageDuration > 1000 && metrics.callCount > 5) {
        bottlenecks.push({
          component: endpoint,
          issue: "Slow API response times",
          severity: "medium",
          suggestion: `Optimize ${endpoint} or add request debouncing/throttling. Consider server-side optimization.`,
          impact: `Average duration: ${metrics.averageDuration.toFixed(0)}ms`,
        });
      }
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get performance report
   */
  getReport(): {
    components: PerformanceMetrics[];
    network: NetworkMetrics[];
    bottlenecks: Bottleneck[];
    summary: {
      totalRenders: number;
      averageRenderTime: number;
      slowComponents: number;
      totalNetworkCalls: number;
      averageNetworkTime: number;
    };
  } {
    const components = Array.from(this.componentMetrics.values());
    const network = Array.from(this.networkMetrics.values());
    const bottlenecks = this.detectBottlenecks();

    const totalRenders = components.reduce((sum, m) => sum + m.renderCount, 0);
    const avgRenderTime =
      components.length > 0
        ? components.reduce((sum, m) => sum + m.averageRenderTime, 0) /
          components.length
        : 0;
    const slowComponents = components.filter((m) => m.slowRenders > 0).length;

    const totalNetworkCalls = network.reduce((sum, m) => sum + m.callCount, 0);
    const avgNetworkTime =
      network.length > 0
        ? network.reduce((sum, m) => sum + m.averageDuration, 0) /
          network.length
        : 0;

    return {
      components,
      network,
      bottlenecks,
      summary: {
        totalRenders,
        averageRenderTime: avgRenderTime,
        slowComponents,
        totalNetworkCalls,
        averageNetworkTime: avgNetworkTime,
      },
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.componentMetrics.clear();
    this.networkMetrics.clear();
    this.renderHistory = [];
  }
}

// Singleton instance
export const performanceAnalyzer = new PerformanceAnalyzer();

// ============================================================================
// React Hook for Component Performance Tracking
// ============================================================================

export function usePerformanceTracking(
  componentName: string,
  props?: Record<string, any>,
  state?: any
): void {
  const prevPropsRef = useRef(props);
  const prevStateRef = useRef(state);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;

    const propsChanged =
      prevPropsRef.current && props
        ? JSON.stringify(prevPropsRef.current) !== JSON.stringify(props)
        : false;

    const stateChanged =
      prevStateRef.current !== undefined && state !== undefined
        ? JSON.stringify(prevStateRef.current) !== JSON.stringify(state)
        : false;

    performanceAnalyzer.recordRender(
      componentName,
      renderTime,
      propsChanged,
      stateChanged
    );

    prevPropsRef.current = props;
    prevStateRef.current = state;
  });
}

// ============================================================================
// Network Performance Hook
// ============================================================================

export function useNetworkTracking() {
  const trackRequest = useCallback(
    async <T,>(
      endpoint: string,
      requestFn: () => Promise<T>,
      cacheKey?: string
    ): Promise<T> => {
      const start = performance.now();
      const cached = cacheKey !== undefined;

      try {
        const result = await requestFn();
        const duration = performance.now() - start;
        performanceAnalyzer.recordNetworkRequest(
          endpoint,
          duration,
          cached,
          false
        );
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        performanceAnalyzer.recordNetworkRequest(
          endpoint,
          duration,
          cached,
          true
        );
        throw error;
      }
    },
    []
  );

  return { trackRequest };
}

// ============================================================================
// Performance Report Component (Dev Only)
// ============================================================================

export function PerformanceReport({ enabled = false }: { enabled?: boolean }) {
  const [report, setReport] = React.useState(performanceAnalyzer.getReport());

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === "production") return;

    const interval = setInterval(() => {
      setReport(performanceAnalyzer.getReport());
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || process.env.NODE_ENV === "production") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: "1rem",
        maxWidth: "400px",
        maxHeight: "400px",
        overflow: "auto",
        fontSize: "12px",
        zIndex: 9999,
        fontFamily: "monospace",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem 0" }}>Performance Report</h3>
      <div>
        <strong>Summary:</strong>
        <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
          <li>Total Renders: {report.summary.totalRenders}</li>
          <li>
            Avg Render Time: {report.summary.averageRenderTime.toFixed(2)}ms
          </li>
          <li>Slow Components: {report.summary.slowComponents}</li>
          <li>Network Calls: {report.summary.totalNetworkCalls}</li>
          <li>
            Avg Network Time: {report.summary.averageNetworkTime.toFixed(0)}ms
          </li>
        </ul>
      </div>
      {report.bottlenecks.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Bottlenecks ({report.bottlenecks.length}):</strong>
          <ul
            style={{
              margin: "0.5rem 0",
              paddingLeft: "1.5rem",
              fontSize: "11px",
            }}
          >
            {report.bottlenecks.slice(0, 5).map((b, i) => (
              <li
                key={i}
                style={{
                  color:
                    b.severity === "critical"
                      ? "#ff6b6b"
                      : b.severity === "high"
                        ? "#ffa500"
                        : "#ffd700",
                }}
              >
                [{b.severity.toUpperCase()}] {b.component}: {b.issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
