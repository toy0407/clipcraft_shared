/**
 * @description Generic response structure
 */
export interface GenericResponse<T> {
  isSuccess: boolean;
  message?: string;
  data?: T;
  error?: string;
}
