/**
 * React Query Hook with Retry Logic
 *
 * Wraps useQuery with automatic retry on network errors
 */

"use client";

import React from "react";
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { useOnlineStatus } from "@/lib/utils/offline-detection";
import { useToast } from "@/components/ui/toast";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  showErrorToast?: boolean;
}

/**
 * Enhanced useQuery with retry logic and offline detection
 */
export function useQueryWithRetry<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    retryOptions?: RetryOptions;
  }
): UseQueryResult<TData, TError> {
  const {
    retryOptions = {},
    retry = 3,
    retryDelay = 1000,
    ...queryOptions
  } = options;

  // Extract onError if provided (for custom error handling) - React Query v5 doesn't support onError in options
  const customOnError = (options as any).onError;

  const {
    maxRetries = retry as number,
    retryDelay: customRetryDelay = retryDelay,
    showErrorToast = false,
  } = retryOptions;

  const isOnline = useOnlineStatus();
  const { error: showError } = useToast();

  const result = useQuery<TData, TError>({
    ...queryOptions,
    retry: (failureCount, error) => {
      // Don't retry if offline
      if (!isOnline) {
        return false;
      }

      // Don't retry if max retries reached
      if (failureCount >= maxRetries) {
        return false;
      }

      // Retry on network errors or 5xx errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isNetworkError =
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("ECONNREFUSED");

      if (isNetworkError) {
        return true;
      }

      // Check if error is a Response object with 5xx status
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as any).status;
        return status >= 500 || status === 429;
      }

      return false;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff
      const delay =
        typeof customRetryDelay === "number" ? customRetryDelay : 1000;
      return Math.min(delay * Math.pow(2, attemptIndex), 10000);
    },
  });

  // Handle custom onError if provided (React Query v5 uses useEffect for error handling)
  React.useEffect(() => {
    if (customOnError && result.error) {
      customOnError(result.error);
    }
  }, [result.error, customOnError]);

  // Handle error toast display
  React.useEffect(() => {
    if (showErrorToast && result.error) {
      if (!isOnline) {
        showError("You are offline. Please check your internet connection.");
      } else {
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : typeof result.error === "string"
              ? result.error
              : "An error occurred";
        showError(errorMessage);
      }
    }
  }, [result.error, showErrorToast, isOnline, showError]);

  return result as UseQueryResult<TData, TError>;
}
