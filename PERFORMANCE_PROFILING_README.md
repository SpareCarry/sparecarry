# Performance Profiling & Instrumentation Guide

**Date**: November 20, 2025  
**Status**: ✅ **PERFORMANCE INSTRUMENTATION COMPLETE**

---

## Overview

The SpareCarry application includes comprehensive performance instrumentation for web (Next.js), mobile (Capacitor), database (Supabase), and React components. All performance metrics are automatically collected, aggregated, and logged with sensitive data anonymization.

---

## 1. Architecture

### Performance Modules

- **`lib/performance/web-profiler.ts`** - Web performance instrumentation
- **`lib/performance/mobile-profiler.ts`** - Mobile performance instrumentation
- **`lib/performance/db-profiler.ts`** - Database query profiling
- **`lib/performance/react-profiler.tsx`** - React component profiling
- **`lib/performance/logger.ts`** - Performance metrics aggregator and logger
- **`lib/supabase/profiled-client.ts`** - Profiled Supabase client wrapper

---

## 2. Web Performance Instrumentation

### Features

- **Performance Marks** - Track page load, route transitions, component mounts
- **Performance Measures** - Measure operation duration
- **Slow Operation Detection** - Automatically warns on operations > 150ms
- **Metrics Aggregation** - Collects and aggregates all performance data
- **Data Anonymization** - Automatically redacts sensitive data

### Usage

```typescript
import {
  perfMark,
  perfMeasure,
  perfWrap,
} from "@/lib/performance/web-profiler";

// Manual marking
perfMark("my-operation");
// ... do work ...
perfMeasure("my-operation");

// Automatic wrapping
const result = await perfWrap("fetch-data", async () => {
  return await fetch("/api/data");
});

// Sync operations
const result = perfWrapSync("process-data", () => {
  return processData();
});
```

### Tracked Metrics

- `page-load` - Full page load time
- `route-transition` - Route navigation time
- `layout-hydration` - Layout hydration time
- `component-mount` - Component mount time
- `supabase-fetch` - Supabase query latency

### Configuration

Set environment variables:

```env
NEXT_PUBLIC_ENABLE_PERF=true  # Enable in production
NEXT_PUBLIC_DEBUG_PERF=true   # Enable debug logging
```

---

## 3. Mobile Performance Instrumentation

### Features

- **Cold Start Tracking** - Time from app launch to first render
- **Warm Start Tracking** - Time when app returns from background
- **Bundle Load Time** - JavaScript bundle loading time
- **Bridge Latency** - Capacitor bridge command latency
- **Push Notification Latency** - Delivery time for push notifications

### Usage

```typescript
import { mobileProfiler, perfBridge } from "@/lib/performance/mobile-profiler";

// Track cold start (automatic)
mobileProfiler.recordColdStart();

// Track warm start (automatic on visibility change)
mobileProfiler.recordWarmStart();

// Wrap Capacitor plugin calls
import { Camera } from "@capacitor/camera";
const photo = await perfBridge("camera.getPhoto", () =>
  Camera.getPhoto({ quality: 90 })
);

// Track push notification
mobileProfiler.recordPushNotificationLatency(
  notificationId,
  Date.now(),
  sentAt
);
```

### Tracked Metrics

- `cold-start` - App cold start time
- `warm-start` - App warm start time
- `bundle-load` - Bundle loading time
- `bridge-latency` - Capacitor bridge latency
- `push-notification-latency` - Push notification delivery time

---

## 4. Database Performance Telemetry

### Features

- **Automatic Query Profiling** - All Supabase queries are automatically profiled
- **Slow Query Detection** - Warns on queries > 100ms
- **Query Metrics** - Records table, operation, duration, and metadata
- **Debug Logging** - Uses `logger.debug()` only, never `console.log`

### Usage

The profiled client is automatically used when you import from `@/lib/supabase/client`:

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
// All queries are automatically profiled
const { data } = await supabase
  .from("trips")
  .select("*")
  .eq("status", "active");
```

### Manual Profiling

```typescript
import { profileQuery } from "@/lib/performance/db-profiler";

const result = await profileQuery("trips", "select", async () => {
  return await supabase.from("trips").select("*");
});
```

### Tracked Metrics

- Query table name
- Operation type (select, insert, update, delete, upsert)
- Duration in milliseconds
- Success/error status
- Metadata (hasData, hasError)

### Configuration

```env
NEXT_PUBLIC_ENABLE_PERF=true   # Enable profiling
NEXT_PUBLIC_DEBUG_PERF=true    # Enable debug logging
```

---

## 5. React Performance Instrumentation

### Features

- **Component Render Tracking** - Tracks render count and duration
- **Slow Render Detection** - Warns on renders > 50ms
- **useEffect Timing** - Measures effect execution time
- **Suspense Timing** - Tracks Suspense fallback timing
- **React Profiler Integration** - Uses React's built-in Profiler

### Usage

```typescript
import { PerformanceProfiler, useRenderCount, usePerfEffect } from '@/lib/performance/react-profiler';

// Wrap component with profiler
function MyComponent() {
  const renderCount = useRenderCount('MyComponent');

  usePerfEffect(() => {
    // Effect code
  }, [deps], 'my-effect');

  return <div>Content</div>;
}

// Wrap with PerformanceProfiler
<PerformanceProfiler id="MyComponent">
  <MyComponent />
</PerformanceProfiler>
```

### Tracked Metrics

- Component name
- Render count
- Average render time
- Slow render count (> 16ms)
- useEffect execution time
- Suspense fallback time

---

## 6. Performance Logger

### Features

- **Metrics Aggregation** - Combines all performance metrics
- **Periodic Reporting** - Automatically reports every 60 seconds (dev)
- **Performance Summary** - Provides high-level performance overview
- **Endpoint Integration** - Can send metrics to monitoring endpoint

### Usage

```typescript
import { performanceLogger } from "@/lib/performance/logger";

// Generate report
const report = performanceLogger.generateReport();
console.log(report);

// Get all metrics
const metrics = performanceLogger.getAllMetrics();

// Start/stop reporting
performanceLogger.startReporting(60000); // Every 60 seconds
performanceLogger.stopReporting();

// Clear all metrics
performanceLogger.clearAll();
```

### Report Structure

```typescript
{
  timestamp: number;
  web: {
    totalMetrics: number;
    slowOperations: number;
    averagePageLoad?: number;
    averageRouteTransition?: number;
  };
  mobile?: {
    coldStartTime?: number;
    warmStartTime?: number;
    bundleLoadTime?: number;
    averageBridgeLatency?: number;
    totalMetrics: number;
  };
  database: {
    totalQueries: number;
    slowQueries: number;
    averageQueryTime: number;
    slowestQueries: QueryMetric[];
  };
  react: {
    totalComponents: number;
    slowestComponents: ComponentRenderMetrics[];
  };
}
```

---

## 7. How to Run Instrumentation

### Development

Instrumentation is **automatically enabled** in development mode:

```bash
# Development mode (automatic)
pnpm dev
```

Performance reports are logged to console every 60 seconds.

### Production

Enable in production with environment variable:

```env
NEXT_PUBLIC_ENABLE_PERF=true
```

### Debug Mode

Enable detailed debug logging:

```env
NEXT_PUBLIC_DEBUG_PERF=true
```

---

## 8. How to Read Results

### Console Output

Performance metrics are logged to the console:

```
[Performance Report]
Web Performance: {
  totalMetrics: 150,
  slowOperations: 5,
  averagePageLoad: 1200,
  averageRouteTransition: 250
}
Mobile Performance: {
  coldStartTime: 1500,
  bundleLoadTime: 800,
  averageBridgeLatency: 45
}
Database Performance: {
  totalQueries: 50,
  slowQueries: 3,
  averageQueryTime: 45,
  slowestQueries: [...]
}
React Performance: {
  totalComponents: 20,
  slowestComponents: [...]
}
```

### Slow Operation Warnings

Operations exceeding thresholds are automatically warned:

```
[Performance] Slow operation detected: page-load took 250.50ms
[DB Perf] Slow query detected: trips.select took 150.25ms
[React Performance] Slow render: MyComponent took 75.30ms
```

### Access Metrics Programmatically

```typescript
import {
  webProfiler,
  mobileProfiler,
  dbProfiler,
  reactProfiler,
} from "@/lib/performance";

// Get all metrics
const webMetrics = webProfiler.getMetrics();
const mobileMetrics = mobileProfiler.getMetrics();
const dbMetrics = dbProfiler.getMetrics();
const reactMetrics = reactProfiler.getAllMetrics();

// Get summaries
const webSummary = webProfiler.getSummary();
const mobileSummary = mobileProfiler.getSummary();
const dbSummary = dbProfiler.getSummary();

// Get slowest operations
const slowest = webProfiler.getSlowestOperations(10);
const slowQueries = dbProfiler.getSlowQueries();
const slowComponents = reactProfiler.getSlowestComponents(10);
```

---

## 9. How to Detect Regressions

### 1. Monitor Slow Operations

Watch for slow operation warnings in console:

```typescript
// Set custom thresholds
webProfiler.slowThreshold = 200; // ms
dbProfiler.slowThreshold = 150; // ms
```

### 2. Track Average Metrics

Compare average metrics over time:

```typescript
const report = performanceLogger.generateReport();

// Check if page load is regressing
if (report.web.averagePageLoad && report.web.averagePageLoad > 2000) {
  console.warn("Page load regression detected!");
}

// Check if database queries are slowing
if (report.database.averageQueryTime > 100) {
  console.warn("Database query regression detected!");
}
```

### 3. Monitor Slow Queries

Track slow database queries:

```typescript
const slowQueries = dbProfiler.getSlowQueries(100); // > 100ms
slowQueries.forEach((query) => {
  console.warn(
    `Slow query: ${query.table}.${query.operation} - ${query.duration}ms`
  );
});
```

### 4. Component Performance

Track React component performance:

```typescript
const slowComponents = reactProfiler.getSlowestComponents(10);
slowComponents.forEach((component) => {
  if (component.averageRenderTime > 50) {
    console.warn(
      `Slow component: ${component.componentName} - ${component.averageRenderTime}ms`
    );
  }
});
```

---

## 10. CI Integration

### Performance Testing in CI

Add performance checks to your CI pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm build
      - run: |
          # Run performance tests
          NEXT_PUBLIC_ENABLE_PERF=true pnpm test:performance

          # Check for regressions
          pnpm check-performance-regressions
```

### Performance Regression Detection

Create a script to detect regressions:

```typescript
// scripts/check-performance-regressions.ts
import { performanceLogger } from "@/lib/performance/logger";

const report = performanceLogger.generateReport();

// Define thresholds
const thresholds = {
  pageLoad: 2000, // 2 seconds
  routeTransition: 500, // 500ms
  dbQuery: 100, // 100ms
  componentRender: 50, // 50ms
};

// Check for regressions
const regressions = [];

if (
  report.web.averagePageLoad &&
  report.web.averagePageLoad > thresholds.pageLoad
) {
  regressions.push(
    `Page load regression: ${report.web.averagePageLoad}ms > ${thresholds.pageLoad}ms`
  );
}

if (report.database.averageQueryTime > thresholds.dbQuery) {
  regressions.push(
    `DB query regression: ${report.database.averageQueryTime}ms > ${thresholds.dbQuery}ms`
  );
}

if (regressions.length > 0) {
  console.error("Performance regressions detected:");
  regressions.forEach((r) => console.error(`  - ${r}`));
  process.exit(1);
}
```

### Performance Budgets

Set performance budgets in `package.json`:

```json
{
  "scripts": {
    "check-performance": "node scripts/check-performance-regressions.ts"
  },
  "performance": {
    "budgets": {
      "pageLoad": 2000,
      "routeTransition": 500,
      "dbQuery": 100,
      "componentRender": 50
    }
  }
}
```

---

## 11. Monitoring Endpoint Integration

### Send Metrics to Monitoring Service

Configure endpoint for production monitoring:

```env
NEXT_PUBLIC_PERF_ENDPOINT=https://your-monitoring-service.com/api/metrics
```

The performance logger will automatically send reports to this endpoint.

### Custom Monitoring Integration

```typescript
import { performanceLogger } from "@/lib/performance/logger";

// Custom integration
performanceLogger["sendToEndpoint"] = async (report) => {
  // Send to your monitoring service
  await fetch("https://your-service.com/metrics", {
    method: "POST",
    body: JSON.stringify(report),
  });
};
```

---

## 12. Best Practices

### 1. Use Performance Wrappers

Always wrap expensive operations:

```typescript
// Good
const result = await perfWrap("expensive-operation", async () => {
  return await expensiveOperation();
});

// Avoid
const result = await expensiveOperation(); // No tracking
```

### 2. Profile Database Queries

All Supabase queries are automatically profiled, but you can add context:

```typescript
const { data } = await supabase
  .from("trips")
  .select("*")
  .eq("status", "active");
// Automatically profiled as 'trips.select'
```

### 3. Profile React Components

Wrap expensive components:

```typescript
<PerformanceProfiler id="ExpensiveComponent">
  <ExpensiveComponent />
</PerformanceProfiler>
```

### 4. Monitor Slow Operations

Set up alerts for slow operations:

```typescript
const slowOps = webProfiler.getSlowestOperations(10);
if (slowOps.length > 0) {
  // Send alert
}
```

### 5. Clear Metrics Periodically

Clear metrics to prevent memory issues:

```typescript
// Clear every hour
setInterval(
  () => {
    performanceLogger.clearAll();
  },
  60 * 60 * 1000
);
```

---

## 13. Troubleshooting

### Performance Not Logging

1. Check environment variables:

   ```env
   NEXT_PUBLIC_ENABLE_PERF=true
   ```

2. Verify profiler is enabled:
   ```typescript
   console.log(webProfiler.enabled); // Should be true
   ```

### Metrics Not Appearing

1. Check if operations are being wrapped
2. Verify profiler is initialized
3. Check browser console for errors

### High Memory Usage

1. Clear metrics periodically:

   ```typescript
   performanceLogger.clearAll();
   ```

2. Reduce metric retention:
   ```typescript
   // Metrics are automatically limited to 1000 entries
   ```

---

## 14. Performance Thresholds

### Recommended Thresholds

- **Page Load**: < 2000ms
- **Route Transition**: < 500ms
- **Database Query**: < 100ms
- **Component Render**: < 50ms
- **Bridge Latency**: < 100ms
- **Cold Start**: < 2000ms
- **Bundle Load**: < 1000ms

### Custom Thresholds

```typescript
webProfiler.slowThreshold = 200; // ms
dbProfiler.slowThreshold = 150; // ms
```

---

## 15. Summary

✅ **Performance Instrumentation Complete**

- Web performance tracking (Next.js)
- Mobile performance tracking (Capacitor)
- Database query profiling (Supabase)
- React component profiling
- Performance metrics aggregation
- Automatic slow operation detection
- Sensitive data anonymization
- CI integration ready

**Status**: Production-ready performance instrumentation system.

---

**Last Updated**: November 20, 2025
