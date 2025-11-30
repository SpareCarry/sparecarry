/**
 * React Performance Profiler
 *
 * Instruments React components for performance monitoring
 * Tracks render counts, useEffect timing, and Suspense fallback timing
 */

/* eslint-disable react-hooks/exhaustive-deps -- callers intentionally control dependency arrays for these perf hooks */
"use client";

import React, {
  useEffect,
  useRef,
  Profiler,
  type ProfilerOnRenderCallback,
} from "react";
import { webProfiler } from "./web-profiler";

interface ComponentRenderMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  slowRenders: number;
}

class ReactProfiler {
  private componentMetrics: Map<string, ComponentRenderMetrics> = new Map();
  private enabled = true;

  constructor() {
    this.enabled =
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_ENABLE_PERF === "true";
  }

  /**
   * Record component render
   */
  recordRender(
    componentName: string,
    renderTime: number,
    metadata?: {
      phase?: "mount" | "update";
      actualDuration?: number;
      baseDuration?: number;
    }
  ): void {
    if (!this.enabled) return;

    const existing = this.componentMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      slowRenders: 0,
    };

    existing.renderCount++;
    existing.totalRenderTime += renderTime;
    existing.averageRenderTime =
      existing.totalRenderTime / existing.renderCount;

    if (renderTime > 16) {
      // > 1 frame at 60fps
      existing.slowRenders++;
    }

    this.componentMetrics.set(componentName, existing);

    // Log slow renders
    if (renderTime > 50) {
      console.warn(
        `[React Performance] Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`,
        metadata
      );
    }
  }

  /**
   * Get component metrics
   */
  getComponentMetrics(
    componentName: string
  ): ComponentRenderMetrics | undefined {
    return this.componentMetrics.get(componentName);
  }

  /**
   * Get all component metrics
   */
  getAllMetrics(): ComponentRenderMetrics[] {
    return Array.from(this.componentMetrics.values());
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(limit: number = 10): ComponentRenderMetrics[] {
    return Array.from(this.componentMetrics.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.componentMetrics.clear();
  }
}

// Singleton instance
export const reactProfiler = new ReactProfiler();

/**
 * Profiler on render callback
 */
export const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  reactProfiler.recordRender(id, actualDuration, {
    phase: phase as "mount" | "update",
    actualDuration,
    baseDuration,
  });

  webProfiler.recordMetric({
    name: `react-render-${id}`,
    value: actualDuration,
    unit: "ms",
    metadata: {
      phase,
      baseDuration,
    },
  });
};

/**
 * Hook to track component render count
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    reactProfiler.recordRender(componentName, 0, { phase: "mount" });
  }, [componentName]);

  return renderCount.current;
}

/**
 * Hook to measure useEffect execution time
 *
 * Note: This hook intentionally accepts a dynamic dependency array as a parameter.
 * The effect and effectName are intentionally excluded from dependencies as they
 * are meant to be provided by the caller and the deps array controls when the effect runs.
 */
export function usePerfEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  effectName?: string
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const name = effectName || "useEffect";
    webProfiler.mark(name);

    const cleanup = effect();

    webProfiler.measure(name);

    return cleanup;
  }, deps);
}

/**
 * Hook to measure async useEffect execution time
 *
 * Note: This hook intentionally accepts a dynamic dependency array as a parameter.
 * The effect and effectName are intentionally excluded from dependencies as they
 * are meant to be provided by the caller and the deps array controls when the effect runs.
 */
export function usePerfEffectAsync(
  effect: () => Promise<void | (() => void)>,
  deps: React.DependencyList,
  effectName?: string
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const name = effectName || "useEffect-async";
    webProfiler.mark(name);

    effect().then((cleanup) => {
      webProfiler.measure(name);
      return cleanup;
    });

    // Note: async cleanup not supported, but we still measure
  }, deps);
}

/**
 * Wrapper component for React Profiler
 */
export function PerformanceProfiler({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  if (!reactProfiler["enabled"]) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}

/**
 * Hook to track Suspense fallback timing
 */
export function useSuspenseTiming(suspenseId: string): void {
  useEffect(() => {
    webProfiler.mark(`suspense-${suspenseId}`);

    return () => {
      webProfiler.measure(`suspense-${suspenseId}`);
    };
  }, [suspenseId]);
}
