import { useQuery } from "@tanstack/react-query";
import { useUseCases } from "@ui/state";
import { queryKeys } from "./queryKeys";

/**
 * useCharacterDetail Hook
 *
 * React Query hook for fetching single character details.
 * Wraps the GetCharacterDetail use case with caching.
 *
 * Features:
 * - Automatic caching (5min stale time)
 * - Automatic retry on failure
 * - Request deduplication
 * - Handles 404 (character not found)
 * - Loading and error states
 *
 * Architecture:
 * - UI Layer hook that wraps Application Layer use case
 * - Use case handles business logic and repository access
 * - React Query handles caching and state management
 *
 * @param characterId - Character ID to fetch
 * @param enabled - Whether the query should run (default: true)
 *
 * @example
 * ```typescript
 * const { data: character, isLoading, error } = useCharacterDetail(123);
 *
 * if (isLoading) return <Spinner />;
 * if (!character) return <NotFound />;
 * return <CharacterProfile character={character} />;
 * ```
 */
export function useCharacterDetail(
  characterId: number,
  enabled: boolean = true,
) {
  // Get use case from DI container
  const { getCharacterDetail } = useUseCases();

  return useQuery({
    // Query key for caching
    queryKey: queryKeys.characters.detail(characterId),

    // Query function - calls use case (use case creates CharacterId internally)
    queryFn: async () => {
      return await getCharacterDetail.execute(characterId);
    },

    // Only run if enabled and ID is valid
    enabled: enabled && characterId > 0,

    // Retry on failure (but not on 404)
    retry: (failureCount, error) => {
      // Don't retry if character not found (404)
      if (error && typeof error === "object" && "statusCode" in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        if (statusCode === 404) {
          return false;
        }
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },

    // Keep character details in cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
