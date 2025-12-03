/**
 * Toast Notification Utility Hook
 * 
 * Provides a convenient wrapper around the toast system for common use cases.
 * This hook makes it easier to show user-friendly notifications throughout the app.
 */

import { useToast } from "@/components/ui/toast";

export interface ToastNotificationOptions {
  title?: string;
  duration?: number;
}

/**
 * Enhanced toast hook with common patterns for user feedback
 */
export function useToastNotification() {
  const { success, error, warning, info, showToast } = useToast();

  /**
   * Show success notification for successful operations
   */
  const showSuccess = (
    message: string,
    options?: ToastNotificationOptions
  ) => {
    success(message, options?.title);
  };

  /**
   * Show error notification with user-friendly messages
   */
  const showError = (
    message: string,
    options?: ToastNotificationOptions
  ) => {
    error(message, options?.title);
  };

  /**
   * Show warning notification
   */
  const showWarning = (
    message: string,
    options?: ToastNotificationOptions
  ) => {
    warning(message, options?.title);
  };

  /**
   * Show info notification
   */
  const showInfo = (message: string, options?: ToastNotificationOptions) => {
    info(message, options?.title);
  };

  /**
   * Show notification for form submission success
   */
  const showFormSuccess = (action: string) => {
    success(`${action} successfully!`, "Success");
  };

  /**
   * Show notification for form submission error
   */
  const showFormError = (action: string, details?: string) => {
    const message = details
      ? `Failed to ${action.toLowerCase()}. ${details}`
      : `Failed to ${action.toLowerCase()}. Please try again.`;
    error(message, "Error");
  };

  /**
   * Show notification for API operation success
   */
  const showApiSuccess = (operation: string) => {
    success(`${operation} completed successfully`, "Success");
  };

  /**
   * Show notification for API operation error
   */
  const showApiError = (operation: string, errorMessage?: string) => {
    const message = errorMessage || `Failed to ${operation.toLowerCase()}. Please try again.`;
    error(message, "Error");
  };

  /**
   * Show notification for network errors
   */
  const showNetworkError = () => {
    error(
      "Network error. Please check your connection and try again.",
      "Connection Error"
    );
  };

  /**
   * Show notification for validation errors
   */
  const showValidationError = (field?: string) => {
    const message = field
      ? `Please check the ${field} field and try again.`
      : "Please check your input and try again.";
    warning(message, "Validation Error");
  };

  /**
   * Show notification for authentication errors
   */
  const showAuthError = (message?: string) => {
    error(
      message || "Authentication required. Please sign in.",
      "Authentication Error"
    );
  };

  /**
   * Show notification for file upload errors
   */
  const showUploadError = (details?: string) => {
    const message = details
      ? `Upload failed: ${details}`
      : "File upload failed. Please try again.";
    error(message, "Upload Error");
  };

  /**
   * Show notification for copy to clipboard success
   */
  const showCopiedToClipboard = (item: string = "Link") => {
    success(`${item} copied to clipboard!`, "Copied");
  };

  return {
    // Direct methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    // Convenience methods
    showFormSuccess,
    showFormError,
    showApiSuccess,
    showApiError,
    showNetworkError,
    showValidationError,
    showAuthError,
    showUploadError,
    showCopiedToClipboard,
    // Raw toast access
    showToast,
  };
}

