/**
 * Mobile app logger that outputs to console and Metro bundler
 * All errors will appear in the terminal where you ran `pnpm start`
 */

interface LogEntry {
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  message: string;
  route?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

class MobileLogger {
  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[MOBILE]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.route) {
      parts.push(`Route: ${entry.route}`);
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
      if (entry.error.stack && __DEV__) {
        parts.push(`Stack: ${entry.error.stack}`);
      }
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`Metadata: ${JSON.stringify(entry.metadata, null, 2)}`);
    }

    return parts.join(" | ");
  }

  private log(entry: LogEntry) {
    const formatted = this.formatLog(entry);

    // Always log to console (appears in Metro bundler)
    // Use console.log for all levels so they're visible
    console.log(formatted);

    switch (entry.level) {
      case "error":
        console.error("❌ ERROR:", formatted);
        // Also log to console.error for React Native
        if (entry.error) {
          console.error("❌ ERROR STACK:", entry.error);
          if (entry.error.stack) {
            console.error("❌ STACK TRACE:", entry.error.stack);
          }
        }
        break;
      case "warn":
        console.warn("⚠️ WARN:", formatted);
        break;
      case "info":
        console.info("ℹ️ INFO:", formatted);
        break;
      case "debug":
        if (__DEV__) {
          console.debug("🔍 DEBUG:", formatted);
        }
        break;
    }
  }

  error(
    message: string,
    options?: {
      route?: string;
      error?: Error;
      metadata?: Record<string, any>;
    }
  ) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      ...options,
    });
  }

  warn(
    message: string,
    options?: {
      route?: string;
      error?: Error;
      metadata?: Record<string, any>;
    }
  ) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      ...options,
    });
  }

  info(
    message: string,
    options?: {
      route?: string;
      metadata?: Record<string, any>;
    }
  ) {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      ...options,
    });
  }

  debug(
    message: string,
    options?: {
      route?: string;
      metadata?: Record<string, any>;
    }
  ) {
    if (__DEV__) {
      this.log({
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        ...options,
      });
    }
  }
}

export const mobileLogger = new MobileLogger();
