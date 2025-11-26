"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { PerformanceProvider } from './providers/performance-provider';
import { FeatureFlagProvider } from './providers/FeatureFlagProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: false, // Don't retry automatically - handle errors gracefully
            throwOnError: false, // Don't throw errors - let components handle them
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider>
        <PerformanceProvider>
          {children}
        </PerformanceProvider>
      </FeatureFlagProvider>
    </QueryClientProvider>
  );
}

