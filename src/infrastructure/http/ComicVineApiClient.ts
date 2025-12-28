import axios, { AxiosInstance } from "axios";
import { config } from "../config/env";
import { API } from "@config/constants";
import { logger } from "@infrastructure/logging/Logger";
import { isCancellationError, isTimeoutError, getErrorMessage } from "./types";

/**
 * Check if running in development mode
 * Works in both Vite and Jest environments
 */
const isDevelopment = (): boolean => {
  // Check if we're in a test environment first (Jest)
  if (process.env.NODE_ENV === "test") {
    return false; // Don't log in tests
  }

  // Use process.env which works in both Vite and Node
  // Vite sets NODE_ENV to 'development' in dev mode
  return process.env.NODE_ENV === "development";
};

/**
 * Cached response with timestamp
 */
interface CachedResponse<T> {
  data: T;
  timestamp: number;
}

/**
 * API Error with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Rate Limiter for Comic Vine API
 * Limits: 200 requests per resource per hour
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 200;
  private readonly timeWindow = 60 * 60 * 1000; // 1 hour in ms

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside time window
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow,
    );
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow,
    );
    return this.maxRequests - this.requests.length;
  }
}

/**
 * Comic Vine API Client
 *
 * HTTP client for Comic Vine API with authentication, caching, rate limiting, and error handling.
 * Implements request cancellation via AbortController.
 *
 * Features:
 * - Simple API key authentication
 * - Response caching with TTL
 * - Rate limiting (200 req/hour per resource)
 * - Request cancellation
 * - Comprehensive error handling
 *
 * @example
 * ```typescript
 * const client = new ComicVineApiClient();
 * const response = await client.get('/characters/', { filter: 'publisher:31', limit: 50 });
 * ```
 */
export class ComicVineApiClient {
  private readonly axios: AxiosInstance;
  private readonly cache: Map<string, CachedResponse<unknown>>;
  private readonly cacheTTL: number = API.CACHE_TTL;
  private readonly rateLimiter: RateLimiter;
  private abortControllers: Map<string, AbortController>;

  constructor() {
    // Never call ComicVine directly from a deployed browser (CORS + key exposure).
    // - On localhost dev, we use Vite proxy (/api -> comicvine) and a dev key.
    // - On any non-localhost host, we call our Vercel function (/api/proxy).
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const useServerProxy = !isLocalhost;

    this.axios = axios.create({
      baseURL: useServerProxy ? "" : config.apiBaseUrl,
      timeout: API.REQUEST_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.cache = new Map();
    this.rateLimiter = new RateLimiter();
    this.abortControllers = new Map();

    // Request interceptor - add API key and format
    this.axios.interceptors.request.use((requestConfig) => {
      if (useServerProxy) {
        // Deployed: call our Vercel proxy and let the server add the API key.
        const endpoint = requestConfig.url ?? "";
        requestConfig.url = "/api/proxy";
        requestConfig.params = {
          endpoint,
          ...requestConfig.params,
        };
      } else {
        // Local dev: go through Vite proxy (/api/* -> comicvine) and add dev key client-side.
        requestConfig.params = {
          ...requestConfig.params,
          api_key: config.comicVineApiKey,
          format: "json",
        };
      }
      return requestConfig;
    });

    // Response interceptor - check for Comic Vine errors
    this.axios.interceptors.response.use(
      (response) => {
        // Log response for debugging (only in development)
        if (isDevelopment()) {
          logger.debug("API Response", {
            url: response.config.url,
            status: response.status,
            error: response.data?.error,
            status_code: response.data?.status_code,
          });
        }

        // Comic Vine returns error:"OK" on success
        if (response.data?.error && response.data.error !== "OK") {
          logger.warn("Comic Vine API returned error in response body", {
            error: response.data.error,
            status_code: response.data.status_code,
            url: response.config.url,
          });
          throw new ApiError(
            `Comic Vine API Error: ${response.data.error}`,
            response.data.status_code,
          );
        }
        return response;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      },
    );
  }

  /**
   * Perform GET request with caching and rate limiting
   *
   * @param endpoint - API endpoint (e.g., '/characters/')
   * @param params - Query parameters
   * @param options - Request options (caching, cancellation)
   * @returns Typed response data
   * @throws {ApiError} When request fails or rate limit exceeded
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: {
      useCache?: boolean;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);

    // Check cache first
    if (options?.useCache !== false) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        logger.debug("Cache hit", { endpoint });
        return cached;
      }
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      const remaining = this.rateLimiter.getRemainingRequests();
      throw new ApiError(
        `Rate limit exceeded. ${remaining} requests remaining this hour.`,
        429,
      );
    }

    // Cancel previous request for same endpoint
    this.cancelPreviousRequest(cacheKey);

    // Create new abort controller
    const controller = new AbortController();
    this.abortControllers.set(cacheKey, controller);

    try {
      // Build full URL for debugging
      const queryString = new URLSearchParams(
        params as Record<string, string>,
      ).toString();
      const fullUrl = `${endpoint}?${queryString}`;

      logger.debug("API request", { endpoint, params, fullUrl });

      // Execute request with retry logic
      const response = await this.requestWithRetry<T>(
        endpoint,
        params,
        options?.signal || controller.signal,
      );

      // Record request for rate limiting
      this.rateLimiter.recordRequest();

      // Cache response
      if (options?.useCache !== false) {
        this.setInCache(cacheKey, response);
      }

      // Clean up controller
      this.abortControllers.delete(cacheKey);

      return response;
    } catch (error: unknown) {
      this.abortControllers.delete(cacheKey);

      // Handle both axios.isCancel and CanceledError
      if (axios.isCancel(error) || isCancellationError(error)) {
        logger.debug("Request cancelled", { endpoint });
        throw new ApiError("Request was cancelled");
      }

      throw this.handleError(error);
    }
  }

  /**
   * Execute request with automatic retry and exponential backoff
   * Retries on timeout (ECONNABORTED) and 5xx server errors
   *
   * Strategy:
   * - Attempt 1: Immediate (0ms delay)
   * - Attempt 2: 1 second delay
   * - Attempt 3: 2 second delay
   * - Attempt 4: 4 second delay
   *
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @param signal - Abort signal for cancellation
   * @returns API response data
   * @throws {ApiError} When all retries exhausted or non-retryable error
   */
  private async requestWithRetry<T>(
    endpoint: string,
    params: Record<string, string | number | boolean> | undefined,
    signal: AbortSignal,
  ): Promise<T> {
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000; // Start with 1 second

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.axios.get<T>(endpoint, {
          params,
          signal,
        });

        // Success - log if this was a retry
        if (attempt > 0) {
          logger.info("Request succeeded after retry", {
            endpoint,
            attempt,
            totalAttempts: attempt + 1,
          });
        }

        return response.data;
      } catch (error: unknown) {
        lastError = error;

        // Don't retry if request was cancelled
        if (axios.isCancel(error) || isCancellationError(error)) {
          throw error;
        }

        // Check if error is retryable
        const isTimeout = isTimeoutError(error);
        const isServerError =
          axios.isAxiosError(error) &&
          error.response?.status !== undefined &&
          error.response.status >= 500 &&
          error.response.status < 600;
        const shouldRetry =
          (isTimeout || isServerError) && attempt < MAX_RETRIES;

        if (!shouldRetry) {
          // Not retryable or max retries reached
          throw error;
        }

        // Calculate exponential backoff delay: 1s, 2s, 4s
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);

        logger.warn("Request failed, retrying with exponential backoff...", {
          endpoint,
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES + 1,
          nextRetryIn: `${delayMs}ms`,
          errorType: isTimeout ? "timeout" : "server_error",
          errorMessage: getErrorMessage(lastError),
        });

        // Wait before retry (exponential backoff)
        await this.sleep(delayMs);
      }
    }

    // All retries exhausted
    logger.error("All retry attempts exhausted", {
      endpoint,
      totalAttempts: MAX_RETRIES + 1,
    });
    throw lastError;
  }

  /**
   * Sleep utility for implementing retry delays
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): void {
    const cacheKey = this.getCacheKey(endpoint, params);
    const controller = this.abortControllers.get(cacheKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(cacheKey);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get remaining API requests this hour
   */
  getRemainingRequests(): number {
    return this.rateLimiter.getRemainingRequests();
  }

  /**
   * Generate cache key from endpoint and params
   */
  private getCacheKey(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    const sortedParams = params
      ? Object.keys(params)
          .sort()
          .map((key) => `${key}=${params[key]}`)
          .join("&")
      : "";
    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Get response from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key) as CachedResponse<T> | undefined;

    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.cacheTTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Store response in cache with timestamp
   */
  private setInCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Cancel previous request for the same endpoint
   */
  private cancelPreviousRequest(cacheKey: string): void {
    const controller = this.abortControllers.get(cacheKey);
    if (controller) {
      controller.abort();
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    // Check for cancellation errors first (don't log these as errors)
    if (isCancellationError(error)) {
      logger.debug("Request was canceled (expected behavior)");
      return new ApiError("Request was cancelled");
    }

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return new ApiError(
          "Request timeout - The Comic Vine API took too long to respond. This request was automatically retried but still failed. Please try again or check back later.",
          408,
          error,
        );
      }

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || error.message;

        switch (status) {
          case 401:
            return new ApiError(
              "Invalid API key. Please check your Comic Vine API key.",
              401,
              error,
            );
          case 404:
            return new ApiError("Resource not found", 404, error);
          case 429:
            return new ApiError(
              "Rate limit exceeded. Please wait before making more requests.",
              429,
              error,
            );
          case 500:
          case 502:
          case 503:
            return new ApiError(
              "Comic Vine API is currently unavailable. Please try again later.",
              status,
              error,
            );
          default:
            return new ApiError(`API Error: ${message}`, status, error);
        }
      }

      if (error.request) {
        return new ApiError(
          "No response from Comic Vine API. Please check your internet connection.",
          undefined,
          error,
        );
      }
    }

    // Log unexpected errors for debugging
    logger.error("Unexpected error in API client", error, {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return new ApiError("An unexpected error occurred", undefined, error);
  }
}
