"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { PerformanceProvider } from "./providers/performance-provider";
import { FeatureFlagProvider } from "./providers/FeatureFlagProvider";
import { RealtimeMonitor } from "@/components/dev/RealtimeMonitor";
import { DevModeBanner } from "@/components/dev/DevModeBanner";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for longer
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch on mount if we have cached data
            refetchOnReconnect: false, // Don't refetch on reconnect
            retry: false, // Don't retry automatically - handle errors gracefully
            throwOnError: false, // Don't throw errors - let components handle them
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <FeatureFlagProvider>
          <PerformanceProvider>
            <DevModeBanner />
            {children}
            <RealtimeMonitor />
          </PerformanceProvider>
        </FeatureFlagProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
