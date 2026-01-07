import React, { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { logger } from "@infrastructure/logging/Logger";
import {
  isCancellationError,
  getErrorMessage,
} from "@infrastructure/http/types";

/**
 * Configures React Query with caching, retries, and global error handling.
 */

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

/** Factory for QueryClient with custom config (separated for testing) */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        gcTime: TEN_MINUTES,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: false,

        // Retry logic: skip cancellations and 4xx errors, retry others up to 3 times
        retry: (failureCount, error) => {
          if (isCancellationError(error)) return false;

          if (error && typeof error === "object" && "statusCode" in error) {
            const statusCode = (error as { statusCode: number }).statusCode;
            if (statusCode >= 400 && statusCode < 500) return false;
          }

          return failureCount < 3;
        },

        // Exponential backoff: 1s, 2s, 4s
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: false,
      },
    },

    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isCancellationError(error)) {
          logger.debug("Query cancelled (expected)", {
            queryKey: query.queryKey,
          });
          return;
        }

        logger.error("Query error", error, {
          queryKey: query.queryKey,
          errorMessage: getErrorMessage(error),
        });
      },
    }),

    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logger.error("Mutation error", error, {
          mutationKey: mutation.options.mutationKey,
          errorMessage: getErrorMessage(error),
        });
      },
    }),
  });
};

interface QueryProviderProps {
  children: React.ReactNode;
  client?: QueryClient; // Optional for testing
}

/** Wraps app with QueryClientProvider and DevTools (dev only) */
export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  client,
}) => {
  const [queryClient] = useState(() => client || createQueryClient());
  const isDev = process.env.NODE_ENV === "development";

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDev && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};
