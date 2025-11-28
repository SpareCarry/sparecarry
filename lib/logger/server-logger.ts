/**
 * Server-side logger that outputs to console and can be extended to log to files
 */

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  url?: string;
  method?: string;
  statusCode?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

class ServerLogger {
  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.url) {
      parts.push(`URL: ${entry.method || 'GET'} ${entry.url}`);
    }

    if (entry.statusCode) {
      parts.push(`Status: ${entry.statusCode}`);
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`Stack: ${entry.error.stack}`);
      }
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`Metadata: ${JSON.stringify(entry.metadata, null, 2)}`);
    }

    return parts.join(' | ');
  }

  private log(entry: LogEntry) {
    const formatted = this.formatLog(entry);
    
    switch (entry.level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'debug':
        console.debug(formatted);
        break;
    }
  }

  error(message: string, options?: {
    url?: string;
    method?: string;
    statusCode?: number;
    error?: Error;
    metadata?: Record<string, any>;
  }) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...options,
    });
  }

  warn(message: string, options?: {
    url?: string;
    method?: string;
    statusCode?: number;
    error?: Error;
    metadata?: Record<string, any>;
  }) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...options,
    });
  }

  info(message: string, options?: {
    url?: string;
    method?: string;
    metadata?: Record<string, any>;
  }) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...options,
    });
  }

  debug(message: string, options?: {
    url?: string;
    method?: string;
    metadata?: Record<string, any>;
  }) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      ...options,
    });
  }
}

export const serverLogger = new ServerLogger();

