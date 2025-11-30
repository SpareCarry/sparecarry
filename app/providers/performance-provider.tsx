/**
 * Performance Provider
 *
 * Initializes performance profiling for the app
 * Includes enhanced profiler with bottleneck detection
 */

"use client";

import { useEffect } from "react";
import { webProfiler } from "@/lib/performance/web-profiler";
import { mobileProfiler } from "@/lib/performance/mobile-profiler";
import { performanceLogger } from "@/lib/performance/logger";
import { mobileLogger } from "@/lib/logger/mobile";
import { PerformanceReport } from "@/lib/performance/enhanced-profiler";

export function PerformanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Mark page load start
    webProfiler.mark("page-load");

    // Record cold start on mobile
    if (typeof window !== "undefined" && (window as any).Capacitor) {
      mobileProfiler.recordColdStart();
      mobileLogger.logDeviceInfo();
    }

    // Measure page load when complete
    const handleLoad = () => {
      webProfiler.measure("page-load", {
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 50), // Anonymized
      });
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    // Track route transitions
    const handleRouteChange = () => {
      webProfiler.mark("route-transition");
      setTimeout(() => {
        webProfiler.measure("route-transition", {
          url: window.location.href,
        });
      }, 0);
    };

    // Listen for Next.js route changes
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  // Show performance report in development
  const showPerformanceReport =
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    window.location.search.includes("perf=true");

  return (
    <>
      {children}
      {showPerformanceReport && <PerformanceReport enabled={true} />}
    </>
  );
}
