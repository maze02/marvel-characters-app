/**
 * Mock for env.ts
 * 
 * Provides test-safe configuration without import.meta
 */

export const config = {
  comicVineApiKey: 'test_api_key_for_testing_needs_40_chars_min',
  apiBaseUrl: '/api',
  isDevelopment: true,
  isProduction: false,
  isConfigured: true,
} as const;
