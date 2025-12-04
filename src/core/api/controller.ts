import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiResponse } from "./response";
import { ApiStatusCodes } from "./api-status";

// Type for async request handlers
export type AsyncRequestHandler<T = any> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<ApiResponse<T>>;

// Interface for route configuration
export interface RouteConfig {
  handler: AsyncRequestHandler;
  middlewares?: RequestHandler[];
}

/**
 * @description Wraps a request handler with error handling and response formatting
 * @param handler The async request handler function that returns ApiResponse
 * @returns Express middleware function
 */
export const wrapHandler = (handler: AsyncRequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handler(req, res, next);

      // If the response has already been sent, return
      if (res.headersSent) {
        return;
      }

      const response: ApiResponse<any> = {
        isSuccess: result.isSuccess,
        message: result.message,
        error: result.error,
        data: result.data,
      };

      res.status(ApiStatusCodes.SUCCESS).json(response);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * @description Creates an API controller with uniform error handling and response formatting
 */
export class ApiController {
  private routes: Map<string, RouteConfig> = new Map();

  /**
   * @description Registers a GET route
   * @param path Route path
   * @param handler Request handler
   * @param middlewares Optional middleware array
   */
  public get(
    path: string,
    handler: AsyncRequestHandler,
    middlewares: RequestHandler[] = []
  ): this {
    this.routes.set(`GET:${path}`, { handler, middlewares });
    return this;
  }

  /**
   * @description Registers a POST route
   * @param path Route path
   * @param handler Request handler
   * @param middlewares Optional middleware array
   */
  public post(
    path: string,
    handler: AsyncRequestHandler,
    middlewares: RequestHandler[] = []
  ): this {
    this.routes.set(`POST:${path}`, { handler, middlewares });
    return this;
  }

  /**
   * @description Registers a PUT route
   * @param path Route path
   * @param handler Request handler
   * @param middlewares Optional middleware array
   */
  public put(
    path: string,
    handler: AsyncRequestHandler,
    middlewares: RequestHandler[] = []
  ): this {
    this.routes.set(`PUT:${path}`, { handler, middlewares });
    return this;
  }

  /**
   * @description Registers a DELETE route
   * @param path Route path
   * @param handler Request handler
   * @param middlewares Optional middleware array
   */
  public delete(
    path: string,
    handler: AsyncRequestHandler,
    middlewares: RequestHandler[] = []
  ): this {
    this.routes.set(`DELETE:${path}`, { handler, middlewares });
    return this;
  }

  /**
   * @description Registers a PATCH route
   * @param path Route path
   * @param handler Request handler
   * @param middlewares Optional middleware array
   */
  public patch(
    path: string,
    handler: AsyncRequestHandler,
    middlewares: RequestHandler[] = []
  ): this {
    this.routes.set(`PATCH:${path}`, { handler, middlewares });
    return this;
  }

  /**
   * @description Applies routes to an Express router
   * @param router Express Router instance
   */
  public applyRoutes(router: any) {
    this.routes.forEach((config, key) => {
      const sepIndex = key.indexOf(":");
      if (sepIndex === -1) return;
      const method = key.substring(0, sepIndex);
      const path = key.substring(sepIndex + 1);
      const { handler, middlewares = [] } = config;

      switch (method.toLowerCase()) {
        case "get":
          router.get(path, ...middlewares, wrapHandler(handler));
          break;
        case "post":
          router.post(path, ...middlewares, wrapHandler(handler));
          break;
        case "put":
          router.put(path, ...middlewares, wrapHandler(handler));
          break;
        case "delete":
          router.delete(path, ...middlewares, wrapHandler(handler));
          break;
        case "patch":
          router.patch(path, ...middlewares, wrapHandler(handler));
          break;
      }
    });
  }
}
