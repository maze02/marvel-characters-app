/**
 * Query Keys Factory
 *
 * Centralized query key management for React Query.
 * Provides type-safe, hierarchical query keys for cache management.
 *
 * Benefits:
 * - Type-safe query keys
 * - Easy to invalidate related queries
 * - Clear cache key hierarchy
 * - Prevents typos and duplication
 *
 * Key Structure:
 * - ['characters'] - All character queries
 * - ['characters', 'list', { offset }] - Paginated character list
 * - ['characters', 'search', query] - Search results
 * - ['characters', 'detail', id] - Single character
 * - ['characters', 'comics', id] - Character's comics
 *
 * @example
 * ```typescript
 * // Invalidate all character queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.characters.all });
 *
 * // Invalidate specific character detail
 * queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(123) });
 * ```
 */

export const queryKeys = {
  /**
   * All character-related queries
   */
  characters: {
    /**
     * Base key for all character queries
     * Use to invalidate all character-related data
     */
    all: ["characters"] as const,

    /**
     * Character list queries (infinite scroll)
     * @param offset - Pagination offset
     */
    lists: () => [...queryKeys.characters.all, "list"] as const,
    list: (offset: number) =>
      [...queryKeys.characters.lists(), { offset }] as const,

    /**
     * Character search queries
     * @param query - Search query string
     */
    searches: () => [...queryKeys.characters.all, "search"] as const,
    search: (query: string) =>
      [...queryKeys.characters.searches(), query] as const,

    /**
     * Single character detail queries
     * @param id - Character ID
     */
    details: () => [...queryKeys.characters.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.characters.details(), id] as const,

    /**
     * Character comics queries
     * @param characterId - Character ID
     */
    comicsLists: () => [...queryKeys.characters.all, "comics"] as const,
    comics: (characterId: number) =>
      [...queryKeys.characters.comicsLists(), characterId] as const,
  },
} as const;
