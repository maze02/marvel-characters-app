import { useInfiniteQuery } from "@tanstack/react-query";
import { useUseCases } from "@ui/state";
import { queryKeys } from "./queryKeys";
import { PAGINATION } from "@config/constants";
import { Character } from "@domain/character/entities/Character";

/**
 * useCharactersList Hook
 *
 * React Query hook for fetching paginated character list with infinite scroll.
 * Wraps the ListCharacters use case while adding caching and automatic refetching.
 *
 * Features:
 * - Infinite scroll pagination
 * - Automatic caching (5min stale time)
 * - Automatic retry on failure
 * - Request deduplication
 * - Loading and error states
 *
 *
 * @example
 * ```typescript
 * const { data, fetchNextPage, hasNextPage, isLoading } = useCharactersList();
 *
 * // Access characters from all pages
 * const allCharacters = data?.pages.flatMap(page => page.items) ?? [];
 * ```
 */
export function useCharactersList() {
  // Get use case from DI container (maintains clean architecture)
  const { listCharacters } = useUseCases();

  return useInfiniteQuery({
    // Query key for caching
    queryKey: queryKeys.characters.lists(),

    // Query function - calls use case
    queryFn: async ({ pageParam = 0 }) => {
      return await listCharacters.execute({
        limit: PAGINATION.DEFAULT_LIMIT,
        offset: pageParam,
      });
    },

    // Initial page param
    initialPageParam: 0,

    // Calculate next page offset
    getNextPageParam: (lastPage, allPages) => {
      // Calculate total items loaded
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.items.length,
        0,
      );

      // Check if we have more data to load
      const hasMore = totalLoaded < lastPage.total;

      // Return next offset or undefined to stop pagination
      return hasMore ? totalLoaded : undefined;
    },

    // Select and transform data (flatten pages for easier consumption)
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Deduplicate characters across pages by ID
      characters: deduplicateCharacters(
        data.pages.flatMap((page) => page.items),
      ),
      total: data.pages[0]?.total ?? 0,
    }),
  });
}

/**
 * Deduplicate characters by ID
 * Prevents duplicate characters if same page is fetched twice
 */
function deduplicateCharacters(characters: Character[]): Character[] {
  const seen = new Set<number>();
  return characters.filter((character) => {
    const id = character.id.value;
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
}
