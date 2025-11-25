import morgan from "morgan";
import { Request } from "express";
import { logger } from "../utils/logger.util";

// Use a deterministic morgan format function (pipe-separated) to simplify parsing
const formatFn = (tokens: any, req: any, res: any) => {
  const method = tokens.method(req, res) || "";
  const url = tokens.url(req, res) || "";
  const status = tokens.status(req, res) || "0";
  const responseTime = tokens["response-time"](req, res) || "0";
  return `${method}|${url}|${status}|${responseTime}`;
};

const stream = {
  write: (message: string) => {
    const trimmed = message.trim();

    // Expect format from formatFn: METHOD|URL|STATUS|RESPONSETIME
    const parts = trimmed.split("|");
    let method = parts[0] || "";
    let url = parts[1] || "";
    let statusStr = parts[2] || "0";
    let responseTimeStr = parts[3] || "0";
    const status = parseInt(statusStr, 10);
    const responseTime = parseFloat(responseTimeStr);

    const logContext = {
      req: { method, url },
      res: { status, responseTime },
    };

    const level: any =
      status >= 500 ? "fatal" : status >= 400 ? "error" : "info";
    logger.log(
      level,
      logContext,
      `HTTP ${method} ${url} ${status} ${responseTime}ms`
    );
  },
};

const skip = (req: Request) => req.url === "/health" || req.url === "/ping";

export const requestLogger = morgan(formatFn, {
  stream,
  skip,
  immediate: false,
});

export const configureRequestLogger = (options?: {
  skipPaths?: string[];
  logLevel?: (status: number) => "info" | "warn" | "error" | "fatal";
}) => {
  const customSkip = (req: Request) => {
    if (options?.skipPaths?.includes(req.url)) return true;
    return skip(req);
  };

  const customStream = {
    write: (message: string) => {
      const trimmed = message.trim();
      // Expect the same pipe-separated formatFn output
      const parts = trimmed.split("|");
      const method = parts[0] || "";
      const url = parts[1] || "";
      const status = parseInt(parts[2] || "0", 10);
      const responseTime = parseFloat(parts[3] || "0");

      const logContext = {
        req: { method, url },
        res: { status, responseTime },
      };

      const level =
        options?.logLevel?.(status) ||
        (status >= 500 ? "fatal" : status >= 400 ? "error" : "info");
      logger.log(
        level,
        logContext,
        `HTTP ${method} ${url} ${status} ${responseTime}ms`
      );
    },
  };

  return morgan(formatFn, {
    stream: customStream,
    skip: customSkip,
    immediate: false,
  });
};
