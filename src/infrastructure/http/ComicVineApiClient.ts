import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { API } from '@config/constants';
import { logger } from '@infrastructure/logging/Logger';

/**
 * Check if running in development mode
 * Works in both Vite (import.meta) and Jest (process.env)
 */
const isDevelopment = (): boolean => {
  // Check if we're in a test environment first (Jest)
  if (process.env.NODE_ENV === 'test') {
    return false; // Don't log in tests
  }
  
  // Check for Vite dev mode (use eval to avoid Jest parsing import.meta)
  try {
    // eslint-disable-next-line no-eval
    return eval('typeof import.meta !== "undefined" && import.meta.env?.DEV') === true;
  } catch {
    // Fallback to Node environment check
    return process.env.NODE_ENV === 'development';
  }
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
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
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
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
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
    this.axios = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: API.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.cache = new Map();
    this.rateLimiter = new RateLimiter();
    this.abortControllers = new Map();

    // Request interceptor - add API key and format
    this.axios.interceptors.request.use((requestConfig) => {
      requestConfig.params = {
        ...requestConfig.params,
        api_key: config.comicVineApiKey,
        format: 'json',
      };
      return requestConfig;
    });

    // Response interceptor - check for Comic Vine errors
    this.axios.interceptors.response.use(
      (response) => {
        // Log response for debugging (only in development)
        if (isDevelopment()) {
          logger.debug('API Response', {
            url: response.config.url,
            status: response.status,
            error: response.data?.error,
            status_code: response.data?.status_code,
          });
        }

        // Comic Vine returns error:"OK" on success
        if (response.data?.error && response.data.error !== 'OK') {
          logger.warn('Comic Vine API returned error in response body', {
            error: response.data.error,
            status_code: response.data.status_code,
            url: response.config.url,
          });
          throw new ApiError(
            `Comic Vine API Error: ${response.data.error}`,
            response.data.status_code
          );
        }
        return response;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
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
    params?: Record<string, any>,
    options?: {
      useCache?: boolean;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    if (options?.useCache !== false) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { endpoint });
        return cached;
      }
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      const remaining = this.rateLimiter.getRemainingRequests();
      throw new ApiError(
        `Rate limit exceeded. ${remaining} requests remaining this hour.`,
        429
      );
    }

    // Cancel previous request for same endpoint
    this.cancelPreviousRequest(cacheKey);

    // Create new abort controller
    const controller = new AbortController();
    this.abortControllers.set(cacheKey, controller);

    try {
      logger.debug('API request', { endpoint, params });
      
      const response = await this.axios.get<T>(endpoint, {
        params,
        signal: options?.signal || controller.signal,
      });

      // Record request for rate limiting
      this.rateLimiter.recordRequest();

      // Cache response
      if (options?.useCache !== false) {
        this.setInCache(cacheKey, response.data);
      }

      // Clean up controller
      this.abortControllers.delete(cacheKey);

      return response.data;
    } catch (error: any) {
      this.abortControllers.delete(cacheKey);
      
      // Handle both axios.isCancel and CanceledError
      if (axios.isCancel(error) || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        logger.debug('Request cancelled', { endpoint });
        throw new ApiError('Request was cancelled');
      }
      
      throw this.handleError(error);
    }
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(endpoint: string, params?: Record<string, any>): void {
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
  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const sortedParams = params 
      ? Object.keys(params)
          .sort()
          .map(key => `${key}=${params[key]}`)
          .join('&')
      : '';
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
    if (
      (error as any)?.name === 'CanceledError' || 
      (error as any)?.code === 'ERR_CANCELED' ||
      (error as any)?.message?.includes('canceled')
    ) {
      logger.debug('Request was canceled (expected behavior)');
      return new ApiError('Request was cancelled');
    }

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return new ApiError('Request timeout - Comic Vine API is slow or unreachable', 408, error);
      }

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || error.message;

        switch (status) {
          case 401:
            return new ApiError('Invalid API key. Please check your Comic Vine API key.', 401, error);
          case 404:
            return new ApiError('Resource not found', 404, error);
          case 429:
            return new ApiError('Rate limit exceeded. Please wait before making more requests.', 429, error);
          case 500:
          case 502:
          case 503:
            return new ApiError('Comic Vine API is currently unavailable. Please try again later.', status, error);
          default:
            return new ApiError(`API Error: ${message}`, status, error);
        }
      }

      if (error.request) {
        return new ApiError('No response from Comic Vine API. Please check your internet connection.', undefined, error);
      }
    }

    // Log unexpected errors for debugging
    logger.error('Unexpected error in API client', error, {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return new ApiError('An unexpected error occurred', undefined, error);
  }
}
