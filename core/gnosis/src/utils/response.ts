import { Context } from "hono";

type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

/**
 * Creates a standardized success response matching the ApiResponse structure
 *
 * @param c - Hono context
 * @param data - Response data to return
 * @param status - HTTP status code (default: 200)
 * @returns JSON response with standardized structure
 */
export function successResponse<T>(
  c: Context,
  data: T,
  status: 200 | 201 = 200
) {
  return c.json(
    {
      success: true,
      data,
    },
    status
  );
}

/**
 * Creates a standardized error response matching the ApiResponse structure
 *
 * @param c - Hono context
 * @param error - Error message string
 * @param status - HTTP status code (default: 500)
 * @returns JSON response with standardized structure
 */
export function errorResponse(
  c: Context,
  error: string,
  status: 400 | 401 | 403 | 404 | 500 = 500
) {
  return c.json(
    {
      success: false,
      error,
    },
    status
  );
}
