import pino from "pino";
import { resolve } from "path";
import { mkdir } from "fs/promises";

// Define log levels type for better type safety
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

// Configuration interface
interface LoggerConfig {
  level: LogLevel;
  directory: string;
  filename: string;
  prettyPrint: boolean;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  // Use verbose logging in non-production (dev/test) and info in production
  level: process.env.NODE_ENV === "prod" ? "info" : "trace",
  directory: resolve(process.cwd(), "logs"),
  filename: "app.log",
  prettyPrint: process.env.NODE_ENV !== "prod",
};

// Error serializer for better error logging
const errorSerializer = (error: Error) => ({
  type: error.name,
  message: error.message,
  stack: error.stack,
  ...(error as any), // Include any custom properties
});

// Request serializer for HTTP requests
const requestSerializer = (req: any) => ({
  method: req.method,
  url: req.url,
  headers: req.headers,
  hostname: req.hostname,
  remoteAddress: req.ip || req.remoteAddress,
  remotePort: req.socket?.remotePort,
});

/**
 * Logger class with singleton pattern for consistent logging across the application
 */
export class Logger {
  private static instance: Logger;
  private readonly pinoLogger: pino.Logger;

  private constructor(customConfig?: Partial<LoggerConfig>) {
    const config = { ...defaultConfig, ...customConfig };

    // Ensure logs directory exists
    mkdir(config.directory, { recursive: true }).catch(console.error);

    // Create the logger configuration
    const loggerConfig: pino.LoggerOptions = {
      level: config.level,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => ({ level: label.toUpperCase() }),
      },
      serializers: {
        err: errorSerializer,
        error: errorSerializer,
        req: requestSerializer,
      },
      base: {
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version,
      },
      transport: config.prettyPrint
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
        : undefined,
    };

    this.pinoLogger = config.prettyPrint
      ? pino(loggerConfig)
      : pino(
          loggerConfig,
          pino.destination(resolve(config.directory, config.filename))
        );
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  // Logging methods
  public trace(msg: string, ...args: any[]): void {
    this.pinoLogger.trace(msg, ...args);
  }

  public debug(msg: string, ...args: any[]): void {
    this.pinoLogger.debug(msg, ...args);
  }

  public info(msg: string, ...args: any[]): void {
    this.pinoLogger.info(msg, ...args);
  }

  public warn(msg: string, ...args: any[]): void {
    this.pinoLogger.warn(msg, ...args);
  }

  public error(msg: string | Error, ...args: any[]): void {
    if (msg instanceof Error) {
      const payload = {
        type: msg.name || "Error",
        message: msg.message,
        stack: msg.stack,
        ...(msg as any),
      };
      this.pinoLogger.error(payload, ...args);
    } else {
      this.pinoLogger.error(msg, ...args);
    }
  }

  public fatal(msg: string | Error, ...args: any[]): void {
    if (msg instanceof Error) {
      const payload = {
        type: msg.name || "Error",
        message: msg.message,
        stack: msg.stack,
        ...(msg as any),
      };
      this.pinoLogger.fatal(payload, ...args);
    } else {
      this.pinoLogger.fatal(msg, ...args);
    }
  }

  // Method to log with context object
  public log(level: LogLevel, context: object, message: string): void {
    this.pinoLogger[level](context, message);
  }

  // Get raw pino logger (for advanced use cases)
  public getPinoLogger(): pino.Logger {
    return this.pinoLogger;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Default export for compatibility
export default logger;
