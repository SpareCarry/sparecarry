/**
 * Accessible Button Component
 *
 * Enhanced button with better accessibility features
 */

import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export interface AccessibleButtonProps extends ButtonProps {
  /**
   * ARIA label for screen readers (required if button text is not descriptive)
   */
  "aria-label"?: string;
  /**
   * ARIA description for additional context
   */
  "aria-describedby"?: string;
  /**
   * Whether button is loading (shows spinner and disables)
   */
  loading?: boolean;
  /**
   * Loading text for screen readers
   */
  loadingLabel?: string;
}

const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      className,
      children,
      disabled,
      loading = false,
      loadingLabel = "Loading...",
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        className={className}
        disabled={isDisabled}
        aria-label={loading ? loadingLabel : ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

export { AccessibleButton };
