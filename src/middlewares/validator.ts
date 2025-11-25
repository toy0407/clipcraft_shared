import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ValidationError } from "../core/api/errors";
import { ApiStatusCodes } from "../core/api/api-status";

type ValidatorSchema<T = any> = {
  body?: Joi.Schema<T>;
  query?: Joi.Schema<T>;
  params?: Joi.Schema<T>;
  headers?: Joi.Schema<T>;
};

/**
 * @description Middleware to validate incoming requests using Joi schemas.
 * Validates request body, query parameters, path parameters, and headers.
 * If validation fails, throws a ValidationError which will be caught by the error handler.
 * @param schemas The Joi schemas to validate different parts of the request
 */
export const validator = (schemas: ValidatorSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{ path: string; message: string }> = [];
    const parts: Array<keyof ValidatorSchema> = [
      "body",
      "query",
      "params",
      "headers",
    ];

    for (const part of parts) {
      const schema = schemas[part];
      if (!schema) continue;

      const { error, value } = schema.validate(req[part], {
        abortEarly: false,
      });

      if (error) {
        error.details.forEach((detail) => {
          const path = detail.path.length > 0 ? detail.path.join(".") : part;
          const message =
            detail.path.length > 0 ? detail.message : `${part} is required`;
          errors.push({ path, message });
        });
      } else {
        // Assign validated value back to request
        if (part === "body") {
          req.body = value;
        } else {
          // For query, params, headers - assign individual properties
          Object.assign(req[part] as any, value);
        }
      }
    }

    if (errors.length > 0) {
      const ve = new ValidationError("Validation Error");
      (ve as any).errors = errors;
      if (typeof (ve as any).statusCode !== "number") {
        (ve as any).statusCode = ApiStatusCodes.VALIDATION_ERROR;
      }
      throw ve;
    }

    next();
  };
};
