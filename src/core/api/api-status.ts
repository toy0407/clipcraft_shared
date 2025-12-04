/**
 * @description Standard API status codes
 */
export enum ApiStatusCodes {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  INTERNAL_SERVER_ERROR = 500,
}
export enum ApiStatusMessages {
  SUCCESS = "Success",
  BAD_REQUEST = "BadRequest",
  UNAUTHORIZED = "Unauthorized",
  FORBIDDEN = "Forbidden",
  NOT_FOUND = "NotFound",
  VALIDATION_ERROR = "ValidationError",
  INTERNAL_SERVER_ERROR = "InternalServerError",
}

export enum HttpMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}
