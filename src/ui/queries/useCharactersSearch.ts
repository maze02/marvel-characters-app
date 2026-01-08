import { useQuery } from "@tanstack/react-query";
import { useUseCases } from "@ui/state";
import { queryKeys } from "./queryKeys";

/**
 * useCharactersSearch Hook
 *
 * React Query hook for searching characters by name.
 * Wraps the SearchCharacters use case with caching and automatic cancellation.
 *
 * Features:
 * - Automatic request cancellation when query changes
 * - Caching of search results
 * - Debouncing handled by caller (pass debounced query)
 * - Empty query returns no data (disabled query)
 * - Loading and error states
 *
 * Architecture:
 * - UI Layer hook that wraps Application Layer use case
 * - Use case handles business logic, React Query handles caching
 * - AbortSignal automatically provided by React Query
 *
 * @param query - Search query (should be debounced by caller)
 * @param enabled - Whether the query should run (default: true when query exists)
 *
 * @example
 * ```typescript
 * const debouncedQuery = useDebouncedValue(searchInput, 400);
 * const { data, isLoading, error } = useCharactersSearch(debouncedQuery);
 *
 * const results = data?.characters ?? [];
 * ```
 */
export function useCharactersSearch(query: string, enabled: boolean = true) {
  // Get use case from DI container
  const { searchCharacters } = useUseCases();

  // Trim query for consistent caching
  const trimmedQuery = query.trim();

  return useQuery({
    // Query key includes search term for proper caching
    queryKey: queryKeys.characters.search(trimmedQuery),

    // Query function - calls use case with abort signal
    queryFn: async ({ signal }) => {
      return await searchCharacters.execute(trimmedQuery, {
        signal,
      });
    },

    // Only run query if:
    // 1. Query is not empty
    // 2. enabled flag is true (allows external control)
    enabled: enabled && trimmedQuery.length > 0,

    // Don't retry search queries (user can retry manually)
    retry: false,

    // Keep search results in cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
