import { z } from "zod";
import { logger } from "@infrastructure/logging/Logger";

/**
 * Environment Configuration for Comic Vine API
 *
 * Validates and provides type-safe access to environment variables.
 * Uses Zod for runtime validation.
 */

const envSchema = z.object({
  /**
   * Frontend API key (dev only). In production, the API key must be server-side
   * (e.g. `COMICVINE_API_KEY` on Vercel) so it is not shipped in the browser bundle.
   */
  VITE_COMICVINE_API_KEY: z.string().optional().default(""),
  VITE_API_BASE_URL: z.string().default("/api"),
});

function validateEnv() {
  try {
    const parsed = envSchema.parse(import.meta.env);

    // Additional check for placeholder values (dev use only)
    if (
      parsed.VITE_COMICVINE_API_KEY &&
      (parsed.VITE_COMICVINE_API_KEY === "your_comic_vine_api_key_here" ||
        parsed.VITE_COMICVINE_API_KEY.length < 40)
    ) {
      logger.warn(
        "⚠️  Comic Vine API key looks invalid. " +
          "For local development, set VITE_COMICVINE_API_KEY in your .env file. " +
          "For production on Vercel, set COMICVINE_API_KEY server-side (do NOT use VITE_ variables).",
      );
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join(".")).join(", ");
      logger.error(
        `Missing or invalid environment variables: ${missingVars}. ` +
          "Please check your .env file and ensure all required variables are set. " +
          "See .env.example for reference.",
        error,
      );
      // Return default values to prevent complete crash
      return {
        VITE_COMICVINE_API_KEY: "",
        VITE_API_BASE_URL: "/api",
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
  isConfigured:
    !!env.VITE_COMICVINE_API_KEY && env.VITE_COMICVINE_API_KEY.length >= 40,
} as const;
