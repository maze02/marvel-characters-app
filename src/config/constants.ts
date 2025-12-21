/**
 * Application Constants
 * 
 * Centralized configuration for magic numbers and application-wide constants.
 * Following best practices to avoid scattered hardcoded values.
 */

/**
 * Pagination Configuration
 */
export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_LIMIT: 50,
  /** Maximum allowed items per page */
  MAX_LIMIT: 100,
  /** Default starting offset for pagination */
  DEFAULT_OFFSET: 0,
} as const;

/**
 * API Configuration
 */
export const API = {
  /** HTTP request timeout in milliseconds (15 seconds) */
  REQUEST_TIMEOUT: 15000,
  /** Cache time-to-live in milliseconds (5 minutes) */
  CACHE_TTL: 5 * 60 * 1000,
  /** Default limit for search results */
  SEARCH_RESULT_LIMIT: 50,
} as const;

/**
 * UI Configuration
 */
export const UI = {
  /** Intersection Observer margin for infinite scroll (starts loading before reaching end) */
  INFINITE_SCROLL_ROOT_MARGIN: '100px',
  /** Debounce delay for search input in milliseconds */
  SEARCH_DEBOUNCE_MS: 300,
} as const;

/**
 * Comics Configuration
 */
export const COMICS = {
  /** Default number of comics to fetch for a character */
  DEFAULT_DETAIL_PAGE_LIMIT: 20,
} as const;
