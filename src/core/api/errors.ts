import { ApiStatusCodes, ApiStatusMessages } from "./api-status";

export class UnauthenticatedError extends Error {
  statusCode = ApiStatusCodes.UNAUTHORIZED;
  constructor(message: string) {
    super(message);
    this.name = ApiStatusMessages.UNAUTHORIZED;
  }
}

export class ForbiddenError extends Error {
  statusCode = ApiStatusCodes.FORBIDDEN;
  constructor(message: string) {
    super(message);
    this.name = ApiStatusMessages.FORBIDDEN;
  }
}

export class NotFoundError extends Error {
  statusCode = ApiStatusCodes.NOT_FOUND;
  constructor(message: string) {
    super(message);
    this.name = ApiStatusMessages.NOT_FOUND;
  }
}

export class BadRequestError extends Error {
  statusCode = ApiStatusCodes.BAD_REQUEST;
  constructor(message: string) {
    super(message);
    this.name = ApiStatusMessages.BAD_REQUEST;
  }
}

export class ValidationError extends Error {
  statusCode = ApiStatusCodes.VALIDATION_ERROR;
  constructor(message: string) {
    super(message);
    this.name = ApiStatusMessages.VALIDATION_ERROR;
  }
}

export class InternalServerError extends Error {
  statusCode = ApiStatusCodes.INTERNAL_SERVER_ERROR;
  constructor(message: string) {
    super(message);
    this.name = ApiStatusMessages.INTERNAL_SERVER_ERROR;
  }
}
