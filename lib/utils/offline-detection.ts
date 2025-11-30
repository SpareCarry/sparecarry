/**
 * Offline Detection Utilities
 *
 * Detects when the app goes offline and provides hooks for handling offline state
 */

"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to retry a function with exponential backoff
 */
export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): [
  (...args: Parameters<T>) => Promise<ReturnType<T>>,
  { isRetrying: boolean; retryCount: number; error: Error | null },
] {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const retry = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setIsRetrying(attempt > 0);
          setRetryCount(attempt);
          setError(null);

          const result = await fn(...args);

          // Success - reset state
          setIsRetrying(false);
          setRetryCount(0);

          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          setError(lastError);

          // Don't retry if this was the last attempt
          if (attempt >= maxRetries) {
            setIsRetrying(false);
            throw lastError;
          }

          // Call retry callback
          if (onRetry) {
            onRetry(attempt + 1, lastError);
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      setIsRetrying(false);
      throw lastError || new Error("Retry failed");
    },
    [fn, maxRetries, initialDelay, maxDelay, onRetry]
  );

  return [retry, { isRetrying, retryCount, error }];
}

/**
 * Create a retryable fetch function
 */
export function createRetryableFetch(
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  } = {}
) {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;

  return async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(input, init);

        // Retry on 5xx errors and network errors
        if (
          response.status >= 500 ||
          response.status === 408 ||
          response.status === 429
        ) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry if this was the last attempt
        if (attempt >= maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("Fetch retry failed");
  };
}
