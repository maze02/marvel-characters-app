import { useQuery } from "@tanstack/react-query";
import { useUseCases } from "@ui/state";

/**
 * React Query hook for fetching favorite characters.
 *
 * Wraps ListFavorites use case with caching and auto-refetch on invalidation.
 * Automatically refetches when navigating to favorites page after toggling.
 */
export function useFavoritesList() {
  const { listFavorites } = useUseCases();

  return useQuery({
    // Stable key for proper invalidation when favorites change
    queryKey: ["favorites", "list"],
    queryFn: async () => await listFavorites.execute(),

    // Short stale time - favorites change frequently
    staleTime: 30 * 1000,

    // Override global config to refetch when stale (e.g., after invalidation)
    refetchOnMount: true,
    enabled: true,

    // Graceful error handling
    select: (data) => data ?? [],
  });
}
