import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../core/api/response";
import { logger } from "../utils/logger.util";

/**
 * In-memory rate limit store
 */
class MemoryStore {
  private hits: Map<string, number> = new Map();
  private resetTime: Map<string, number> = new Map();

  increment(key: string): number {
    const current = this.hits.get(key) || 0;
    this.hits.set(key, current + 1);
    return current + 1;
  }

  reset(key: string): void {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }

  getExpiry(key: string): number | null {
    return this.resetTime.get(key) || null;
  }

  setExpiry(key: string, ttl: number): void {
    const resetAt = Date.now() + ttl;
    this.resetTime.set(key, resetAt);

    // Auto-cleanup after TTL expires
    setTimeout(() => {
      this.reset(key);
    }, ttl);
  }
}

/**
 * Rate limiter configuration options
 */
export interface RateLimiterOptions {
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;

  /**
   * Maximum number of requests per window
   * @default 100
   */
  max?: number;

  /**
   * Custom message when rate limit is exceeded
   */
  message?: string;

  /**
   * Key generator function to identify clients
   * @default Uses IP address
   */
  keyGenerator?: (req: Request) => string;
}

/**
 * Get client identifier from request
 */
const getClientKey = (req: Request): string => {
  // Try X-Forwarded-For header first (for proxied requests)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips =
      typeof forwarded === "string" ? forwarded.split(",") : forwarded;
    return ips[0].trim();
  }
  // Fallback to IP address
  return req.ip || req.socket.remoteAddress || "unknown";
};

/**
 * Create rate limiter middleware
 *
 * @example
 * // Basic usage - 100 requests per minute
 * app.use(createRateLimiter());
 *
 * @example
 * // Custom limits
 * app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }));
 *
 * @example
 * // Different limits for different routes
 * app.use('/api/auth', createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 }));
 * app.use('/api/', createRateLimiter({ max: 100 }));
 */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 100,
    message = "Too many requests, please try again later.",
    keyGenerator,
  } = options;

  const store = new MemoryStore();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get client identifier
      const key = keyGenerator ? keyGenerator(req) : getClientKey(req);

      if (!key || key === "unknown") {
        logger.warn("Rate limiter: Unable to determine client identifier");
        return next();
      }

      const rateLimitKey = `ratelimit:${key}`;

      // Increment hit count
      const hits = store.increment(rateLimitKey);

      // Set expiry on first hit
      let resetTime = store.getExpiry(rateLimitKey);
      if (!resetTime || hits === 1) {
        store.setExpiry(rateLimitKey, windowMs);
        resetTime = Date.now() + windowMs;
      }

      // Add rate limit headers
      const remaining = Math.max(0, max - hits);
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader("X-RateLimit-Reset", new Date(resetTime).toISOString());

      // Check if limit exceeded
      if (hits > max) {
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        res.setHeader("Retry-After", retryAfter.toString());

        logger.warn(
          `Rate limit exceeded: ip=${req.ip}, path=${req.path}, hits=${hits}/${max}`
        );

        return res.status(429).json({
          isSuccess: false,
          error: message,
        } as ApiResponse<null>);
      }

      next();
    } catch (error) {
      logger.error("Rate limiter error:", error);
      // On error, allow request through (fail open)
      next();
    }
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Auth endpoints - 5 requests per 15 minutes
   */
  auth: () =>
    createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: "Too many authentication attempts, please try again later.",
    }),

  /**
   * API endpoints - 100 requests per minute
   */
  api: () =>
    createRateLimiter({
      windowMs: 60 * 1000,
      max: 100,
    }),

  /**
   * Strict limits - 10 requests per hour
   */
  strict: () =>
    createRateLimiter({
      windowMs: 60 * 60 * 1000,
      max: 10,
    }),
};

export default createRateLimiter;
