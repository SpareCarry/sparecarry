/**
 * Centralized Logging System
 *
 * Provides structured logging with optional Sentry integration
 */

interface LogContext {
  [key: string]: unknown;
}

interface ErrorInfo {
  message: string;
  stack?: string;
  code?: string;
  context?: LogContext;
}

class Logger {
  private sentryEnabled = false;
  private debugEnabled = process.env.NODE_ENV !== "production";
  private samplingRate: number;

  constructor() {
    // Initialize Sentry if DSN is provided
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      this.initializeSentry();
    }

    // Configure sampling rate for production logs
    // Default: 10% of logs in production (to reduce volume)
    this.samplingRate =
      process.env.NODE_ENV === "production"
        ? parseFloat(process.env.LOG_SAMPLING_RATE || "0.1")
        : 1.0;
  }

  /**
   * Initialize Sentry
   */
  private initializeSentry(): void {
    // Only initialize on client-side
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Use Function constructor to prevent Next.js from statically analyzing the import
      // eslint-disable-next-line no-implied-eval
      const importPromise = new Function(
        'return import("@sentry/nextjs")'
      )() as Promise<any>;
      importPromise
        .then((Sentry: any) => {
          if (Sentry && Sentry.init) {
            Sentry.init({
              dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
              environment: process.env.NODE_ENV || "development",
              tracesSampleRate: 1.0,
              debug: process.env.NODE_ENV === "development",
            });
            this.sentryEnabled = true;
          }
        })
        .catch((error: any) => {
          // Silently fail if Sentry is not installed or fails to load
          // This is expected in development or if Sentry is not configured
          if (process.env.NODE_ENV === "development") {
            // Only log in development to avoid console noise
            console.debug(
              "[Logger] Sentry not available (this is OK if not installed)"
            );
          }
          this.sentryEnabled = false;
        });
    } catch (error) {
      console.warn("[Logger] Failed to initialize Sentry:", error);
      this.sentryEnabled = false;
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const sanitizedContext = this.sanitizeContext(context);
    const logData = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context: sanitizedContext,
    };

    // Sample info logs in production
    if (this.samplingRate >= 1.0 || Math.random() < this.samplingRate) {
      console.log(`[INFO] ${message}`, sanitizedContext || "");

      if (this.sentryEnabled) {
        this.captureSentryMessage("info", message, sanitizedContext);
      }
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const sanitizedContext = this.sanitizeContext(context);
    const logData = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context: sanitizedContext,
    };

    // Sample warnings in production (but less aggressively than info)
    const warnSamplingRate = Math.min(this.samplingRate * 2, 1.0); // 2x info rate
    if (warnSamplingRate >= 1.0 || Math.random() < warnSamplingRate) {
      console.warn(`[WARN] ${message}`, sanitizedContext || "");

      if (this.sentryEnabled) {
        this.captureSentryMessage("warning", message, sanitizedContext);
      }
    }
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorInfo = this.extractErrorInfo(error);
    const sanitizedContext = this.sanitizeContext(context);

    const logData = {
      level: "error",
      message,
      error: errorInfo,
      timestamp: new Date().toISOString(),
      context: sanitizedContext,
    };

    // Always log errors to console (not sampled)
    console.error(`[ERROR] ${message}`, errorInfo, sanitizedContext || "");

    // Send to Sentry with sampling in production
    if (
      this.sentryEnabled &&
      (this.samplingRate >= 1.0 || Math.random() < this.samplingRate)
    ) {
      this.captureSentryError(message, error, sanitizedContext);
    }
  }

  /**
   * Log debug message (disabled in production)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.debugEnabled) return;

    const logData = {
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
    };

    console.debug(
      `[DEBUG] ${message}`,
      context ? this.sanitizeContext(context) : ""
    );
  }

  /**
   * Extract error information
   */
  private extractErrorInfo(error?: Error | unknown): ErrorInfo {
    if (!error) {
      return { message: "Unknown error" };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return {
      message: String(error),
    };
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sensitiveKeys = [
      "password",
      "token",
      "jwt",
      "secret",
      "key",
      "authorization",
      "cookie",
      "session",
      "access_token",
      "refresh_token",
      "api_key",
      "apikey",
      "private_key",
      "privatekey",
    ];

    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();

      // Check for sensitive keys
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = "[REDACTED]";
        continue;
      }

      // Redact email addresses
      if (lowerKey.includes("email") && typeof value === "string") {
        sanitized[key] = this.redactEmail(value);
        continue;
      }

      // Redact credit card numbers
      if (typeof value === "string" && this.isCreditCard(value)) {
        sanitized[key] = "[REDACTED_CARD]";
        continue;
      }

      // Redact phone numbers (basic pattern)
      if (lowerKey.includes("phone") && typeof value === "string") {
        sanitized[key] = this.redactPhone(value);
        continue;
      }

      // Redact SSN (basic pattern)
      if (lowerKey.includes("ssn") && typeof value === "string") {
        sanitized[key] = "[REDACTED_SSN]";
        continue;
      }

      // Recursively sanitize nested objects
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        sanitized[key] = this.sanitizeContext(value as LogContext);
      } else if (Array.isArray(value)) {
        // Sanitize array elements
        sanitized[key] = value.map((item) => {
          if (typeof item === "object" && item !== null) {
            return this.sanitizeContext(item as LogContext);
          }
          return item;
        });
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Redact email address (keep domain visible)
   */
  private redactEmail(email: string): string {
    if (!email || typeof email !== "string") return email;
    const parts = email.split("@");
    if (parts.length !== 2) return "[REDACTED_EMAIL]";
    const [local, domain] = parts;
    if (local.length <= 2) {
      return `**@${domain}`;
    }
    return `${local.substring(0, 2)}***@${domain}`;
  }

  /**
   * Check if string looks like a credit card number
   */
  private isCreditCard(value: string): boolean {
    // Remove spaces and dashes
    const cleaned = value.replace(/[\s-]/g, "");
    // Check if it's 13-19 digits (credit card range)
    if (!/^\d{13,19}$/.test(cleaned)) return false;
    // Basic Luhn check
    return this.luhnCheck(cleaned);
  }

  /**
   * Luhn algorithm check for credit card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  /**
   * Redact phone number (keep last 4 digits)
   */
  private redactPhone(phone: string): string {
    if (!phone || typeof phone !== "string") return phone;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4) return "[REDACTED_PHONE]";
    return `***-***-${digits.slice(-4)}`;
  }

  /**
   * Capture message to Sentry
   */
  private async captureSentryMessage(
    level: "info" | "warning",
    message: string,
    context?: LogContext
  ): Promise<void> {
    if (!this.sentryEnabled || typeof window === "undefined") return;

    try {
      // Use Function constructor to prevent Next.js from statically analyzing the import
      // eslint-disable-next-line no-implied-eval
      const importPromise = new Function(
        'return import("@sentry/nextjs")'
      )() as Promise<any>;
      const Sentry = await importPromise;
      Sentry.captureMessage(message, {
        level,
        extra: this.sanitizeContext(context),
      });
    } catch {
      // Sentry not available
      this.sentryEnabled = false;
    }
  }

  /**
   * Capture error to Sentry
   */
  private async captureSentryError(
    message: string,
    error?: Error | unknown,
    context?: LogContext
  ): Promise<void> {
    if (!this.sentryEnabled || typeof window === "undefined") return;

    try {
      // Use Function constructor to prevent Next.js from statically analyzing the import
      // eslint-disable-next-line no-implied-eval
      const importPromise = new Function(
        'return import("@sentry/nextjs")'
      )() as Promise<any>;
      const Sentry = await importPromise;

      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: {
            message,
            ...this.sanitizeContext(context),
          },
        });
      } else {
        Sentry.captureMessage(message, {
          level: "error",
          extra: {
            error: String(error),
            ...this.sanitizeContext(context),
          },
        });
      }
    } catch {
      // Sentry not available
      this.sentryEnabled = false;
    }
  }

  /**
   * Set user context for Sentry
   */
  async setUser(
    user: { id: string; email?: string; username?: string } | null
  ): Promise<void> {
    if (!this.sentryEnabled || typeof window === "undefined") return;

    try {
      // Use Function constructor to prevent Next.js from statically analyzing the import
      // eslint-disable-next-line no-implied-eval
      const importPromise = new Function(
        'return import("@sentry/nextjs")'
      )() as Promise<any>;
      const Sentry = await importPromise;
      Sentry.setUser(
        user
          ? {
              id: user.id,
              email: user.email,
              username: user.username,
            }
          : null
      );
    } catch {
      // Sentry not available
      this.sentryEnabled = false;
    }
  }

  /**
   * Add breadcrumb for Sentry
   */
  async addBreadcrumb(
    message: string,
    category: string,
    level: "info" | "warning" | "error" = "info",
    data?: LogContext
  ): Promise<void> {
    if (!this.sentryEnabled || typeof window === "undefined") return;

    try {
      // Use Function constructor to prevent Next.js from statically analyzing the import
      // eslint-disable-next-line no-implied-eval
      const importPromise = new Function(
        'return import("@sentry/nextjs")'
      )() as Promise<any>;
      const Sentry = await importPromise;
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data: this.sanitizeContext(data),
      });
    } catch {
      // Sentry not available
      this.sentryEnabled = false;
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);
export const logError = (
  message: string,
  error?: Error | unknown,
  context?: LogContext
) => logger.error(message, error, context);
export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);
