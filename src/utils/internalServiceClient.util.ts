import { HttpMethods } from "../core/api/api-status";
import { GenericResponse } from "../dto/generic/generic-response";
import axios from "axios";
import logger from "./logger.util";

export const InternalServiceApiClient = async (
  method: HttpMethods,
  serviceBaseUrl: string,
  slug?: string,
  headers?: Record<string, string>,
  queryParams?: Record<string, string>,
  body?: any,
  internalServiceKey?: string
): Promise<GenericResponse<any>> => {
  let finalHeaders: Record<string, string> = headers ?? {};
  if (internalServiceKey || process.env.INTERNAL_SERVICE_KEY) {
    finalHeaders["x-service-key"] =
      internalServiceKey ?? process.env.INTERNAL_SERVICE_KEY!;
  }
  try {
    const response = await axios.request({
      method: method ?? HttpMethods.GET,
      baseURL: `${serviceBaseUrl}/internal/${slug ?? ""}`,
      headers: finalHeaders,
      params: queryParams,
      data: body,
    });
    if (response.status < 200 || response.status >= 300) {
      logger.error(
        `InternalServiceApiClient error: ${response.status} - ${response.statusText}`
      );
      return {
        isSuccess: false,
        error:
          response.data?.error ??
          `Failed to call internal service ${serviceBaseUrl}/internal/${
            slug ?? ""
          }: ${response.status} : ${response.statusText}`,
      };
    }
    return response.data;
  } catch (err: any) {
    // Normalize axios/network errors into GenericResponse instead of throwing
    logger.error(`InternalServiceApiClient exception: ${err?.message}`);
    const status = err?.response?.status;
    const statusText = err?.response?.statusText;
    const dataError = err?.response?.data?.error ?? err?.message;
    return {
      isSuccess: false,
      error:
        dataError ??
        `Request failed${status ? `: ${status} ${statusText}` : ""}`,
    };
  }
};
