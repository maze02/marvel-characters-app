import { z } from 'zod';
import { logger } from '@infrastructure/logging/Logger';

/**
 * Environment Configuration for Comic Vine API
 * 
 * Validates and provides type-safe access to environment variables.
 * Uses Zod for runtime validation.
 */

const envSchema = z.object({
  VITE_COMICVINE_API_KEY: z.string().min(40, 'Comic Vine API key must be at least 40 characters'),
  VITE_API_BASE_URL: z.string().default('/api'),
});

function validateEnv() {
  try {
    const parsed = envSchema.parse(import.meta.env);
    
    // Additional check for placeholder values
    if (parsed.VITE_COMICVINE_API_KEY === 'your_comic_vine_api_key_here' ||
        parsed.VITE_COMICVINE_API_KEY.length < 40) {
      logger.warn(
        '⚠️  Comic Vine API key not configured! ' +
        'Please update your .env file with actual key from https://comicvine.gamespot.com/api/ ' +
        'The app will show empty states until the key is configured.'
      );
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      logger.error(
        `Missing or invalid environment variables: ${missingVars}. ` +
        'Please check your .env file and ensure all required variables are set. ' +
        'See .env.example for reference.',
        error
      );
      // Return default values to prevent complete crash
      return {
        VITE_COMICVINE_API_KEY: 'not_configured_placeholder_key_needs_40_chars',
        VITE_API_BASE_URL: '/api',
      };
    }
    throw error;
  }
}

const env = validateEnv();

export const config = {
  comicVineApiKey: env.VITE_COMICVINE_API_KEY,
  apiBaseUrl: env.VITE_API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isConfigured: env.VITE_COMICVINE_API_KEY !== 'your_comic_vine_api_key_here' && 
                env.VITE_COMICVINE_API_KEY !== 'not_configured_placeholder_key_needs_40_chars' &&
                env.VITE_COMICVINE_API_KEY.length >= 40,
} as const;
