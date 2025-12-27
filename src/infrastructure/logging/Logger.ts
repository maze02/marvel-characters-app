import log from "loglevel";

/**
 * Application Logger
 *
 * Centralized logging service using loglevel library.
 * Provides structured logging with different severity levels.
 *
 * Features:
 * - Multiple log levels (trace, debug, info, warn, error)
 * - Configurable based on environment
 * - Consistent logging format across the app
 * - Can be easily replaced or extended (e.g., send to external service)
 *
 * @example
 * ```typescript
 * import { logger } from '@infrastructure/logging/Logger';
 *
 * logger.info('User logged in', { userId: 123 });
 * logger.error('API call failed', { error, endpoint: '/api/characters' });
 * logger.debug('Cache hit', { key: 'characters-page-1' });
 * ```
 */

/**
 * Log level type
 */
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "silent";

/**
 * Logger context data
 */
export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private readonly logger = log;

  constructor() {
    this.configure();
  }

  /**
   * Configure logger based on environment
   */
  private configure(): void {
    // Set log level based on environment
    const logLevel = this.getLogLevel();
    this.logger.setLevel(logLevel);

    // Add prefix to all log messages
    const originalFactory = this.logger.methodFactory;
    this.logger.methodFactory = (methodName, logLevel, loggerName) => {
      const rawMethod = originalFactory(methodName, logLevel, loggerName);

      return (...args: unknown[]) => {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${methodName.toUpperCase()}]`;
        rawMethod(prefix, ...args);
      };
    };

    // Apply the custom factory
    this.logger.setLevel(this.logger.getLevel());
  }

  /**
   * Get log level based on environment
   * Checks NODE_ENV to work in both browser and Node/Jest environments
   */
  private getLogLevel(): LogLevel {
    // Check NODE_ENV for test and development environments
    const nodeEnv =
      typeof process !== "undefined" ? process.env?.NODE_ENV : undefined;
    const isDev = nodeEnv === "development" || nodeEnv === "test";

    // In production, only show warnings and errors
    // In development/test, show debug and above
    if (isDev) {
      return "debug";
    }
    return "warn";
  }

  /**
   * Format context data for logging
   */
  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return "";
    }
    return JSON.stringify(context, null, 2);
  }

  /**
   * Log trace message (most verbose)
   */
  trace(message: string, context?: LogContext): void {
    const formattedContext = this.formatContext(context);
    if (formattedContext) {
      this.logger.trace(message, formattedContext);
    } else {
      this.logger.trace(message);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    const formattedContext = this.formatContext(context);
    if (formattedContext) {
      this.logger.debug(message, formattedContext);
    } else {
      this.logger.debug(message);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const formattedContext = this.formatContext(context);
    if (formattedContext) {
      this.logger.info(message, formattedContext);
    } else {
      this.logger.info(message);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const formattedContext = this.formatContext(context);
    if (formattedContext) {
      this.logger.warn(message, formattedContext);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };

    if (Object.keys(errorContext).length > 0) {
      this.logger.error(message, this.formatContext(errorContext));
    } else {
      this.logger.error(message, error);
    }
  }

  /**
   * Set log level programmatically
   */
  setLevel(level: LogLevel): void {
    this.logger.setLevel(level);
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    const level = this.logger.getLevel();
    const levels: LogLevel[] = [
      "trace",
      "debug",
      "info",
      "warn",
      "error",
      "silent",
    ];
    return levels[level] || "silent";
  }
}

/**
 * Singleton logger instance
 * Import this in your application code
 */
export const logger = new Logger();
