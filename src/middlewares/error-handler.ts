import { Request, Response, NextFunction } from "express";
import { ApiStatusCodes } from "../core/api/api-status";
import { ApiResponse } from "../core/api/response";
import { logger } from "../utils/logger.util";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) return next(err);

  // Log error details
  try {
    logger.error(
      JSON.stringify({
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      })
    );
  } catch {
    console.error("Error while logging:", err);
  }

  // Handle validation errors
  if (err?.name === "ValidationError") {
    const errors = err.details || err.errors;
    const status = err?.statusCode ?? ApiStatusCodes.VALIDATION_ERROR;

    if (Array.isArray(errors) && errors.length > 0) {
      const message = errors
        .map((e: any) => {
          const path = e?.path?.join?.(".") || e?.path || "";
          const msg = (e?.message || String(e))
            .replace(/"([^\"]+)"/g, "$1")
            .trim();
          // Avoid duplicate field name if message already starts with it
          if (path && msg.toLowerCase().startsWith(path.toLowerCase())) {
            return msg;
          }
          return path ? `${path}: ${msg}` : msg;
        })
        .filter(Boolean)
        .join(", ");

      return res.status(status).json({
        isSuccess: false,
        error: message || "Validation Error",
      } as ApiResponse<null>);
    }

    return res.status(status).json({
      isSuccess: false,
      error: "Validation Error",
    } as ApiResponse<null>);
  }

  // Handle known errors with statusCode
  if (typeof err?.statusCode === "number") {
    return res.status(err.statusCode).json({
      isSuccess: false,
      error: err.message || err.name || "Error",
    });
  }

  // Fallback for unexpected errors
  return res.status(ApiStatusCodes.INTERNAL_SERVER_ERROR).json({
    isSuccess: false,
    error: "Internal Server Error",
  });
};
