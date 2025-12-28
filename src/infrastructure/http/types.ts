/**
 * Type definitions for HTTP client errors and utilities
 */

/**
 * Axios-like error with code property
 */
export interface ErrorWithCode {
  code?: string;
  message?: string;
}

/**
 * API error with status code
 */
export interface ApiErrorWithStatus {
  statusCode?: number;
  message?: string;
}

/**
 * Type guard to check if an error has a code property
 */
export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return typeof error === "object" && error !== null && "code" in error;
}

/**
 * Type guard to check if an error has a statusCode property
 */
export function isApiErrorWithStatus(
  error: unknown,
): error is ApiErrorWithStatus {
  return typeof error === "object" && error !== null && "statusCode" in error;
}

/**
 * Type guard to check if error is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error is cancellation-related
 */
export function isCancellationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as Partial<Error & ErrorWithCode>;

  return (
    err.name === "CanceledError" ||
    err.code === "ERR_CANCELED" ||
    err.message?.includes("cancel") === true
  );
}

/**
 * Type guard to check if error is a timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (!isErrorWithCode(error)) {
    return false;
  }

  return error.code === "ECONNABORTED";
}

/**
 * Get error message safely from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Unknown error";
}
