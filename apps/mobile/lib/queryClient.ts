/**
 * Shared QueryClient instance for the mobile app
 * This ensures all QueryClientProviders use the same instance
 */

import { QueryClient } from "@tanstack/react-query";

// Create QueryClient at module level to ensure it's always available
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      placeholderData: (previousValue: any) => previousValue,
    },
  },
});

console.log("✅ Shared QueryClient created at:", new Date().toISOString());

