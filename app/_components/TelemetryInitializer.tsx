'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring } from '@/lib/telemetry/performance';

/**
 * Client-side telemetry initializer
 * Initializes performance monitoring in staging/production
 */
export function TelemetryInitializer() {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring();
  }, []);

  return null;
}

