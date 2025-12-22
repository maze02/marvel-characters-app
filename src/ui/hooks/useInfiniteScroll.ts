import { useState, useEffect, useRef, useCallback } from 'react';
import { PaginatedResult } from '@domain/character/ports/CharacterRepository';
import { PAGINATION, UI } from '@config/constants';
import { logger } from '@infrastructure/logging/Logger';

/**
 * useInfiniteScroll Hook
 * 
 * Custom React hook for implementing infinite scroll with Intersection Observer API.
 * Automatically loads more data when user scrolls to bottom.
 * 
 * Features:
 * - Uses Intersection Observer (better performance than scroll events)
 * - Automatic loading on scroll
 * - Handles loading states
 * - Prevents duplicate requests
 * - Cleanup on unmount
 * 
 * @example
 * ```typescript
 * const { items, loading, hasMore, sentinelRef, reset } = useInfiniteScroll(
 *   (offset) => listCharactersUseCase.execute({ limit: 50, offset }),
 *   50
 * );
 * 
 * return (
 *   <div>
 *     {items.map(item => <Card key={item.id} {...item} />)}
 *     {hasMore && <div ref={sentinelRef}>Loading...</div>}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll<T>(
  fetchMore: (offset: number) => Promise<PaginatedResult<T>>,
  initialLimit: number = PAGINATION.DEFAULT_LIMIT
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);

  /**
   * Load more items from the API
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMore(offset);
      
      setItems(prev => [...prev, ...result.items]);
      setOffset(prev => prev + initialLimit);
      
      // Check if we have more data
      const totalLoaded = offset + result.items.length;
      setHasMore(totalLoaded < result.total);
      
      logger.debug('Infinite scroll loaded items', { 
        loaded: result.items.length, 
        totalLoaded, 
        total: result.total 
      });
    } catch (err) {
      logger.error('Error loading more items', err);
      setError(err as Error);
      setHasMore(false); // Stop trying on error
    } finally {
      setLoading(false);
    }
  }, [fetchMore, offset, initialLimit, loading, hasMore]);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      void loadMore();
    }
  }, []);

  /**
   * Set up Intersection Observer
   */
  useEffect(() => {
    // Don't set up observer if no more data or loading
    if (!hasMore || loading) {
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        
        // Trigger load when sentinel is visible
        if (firstEntry && firstEntry.isIntersecting && hasMore && !loading) {
          logger.debug('Sentinel visible, loading more items');
          void loadMore();
        }
      },
      {
        root: null, // Use viewport
        rootMargin: UI.INFINITE_SCROLL_ROOT_MARGIN,
        threshold: 0.1, // Trigger when 10% visible
      }
    );

    // Observe the sentinel element
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  /**
   * Reset hook state (useful for search/filter changes)
   */
  const reset = useCallback(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    isFirstLoad.current = true;
  }, []);

  /**
   * Manually trigger load more (useful for retry after error)
   */
  const retry = useCallback(() => {
    if (error) {
      setError(null);
      setHasMore(true);
    }
    void loadMore();
  }, [error, loadMore]);

  return {
    items,
    loading,
    hasMore,
    error,
    sentinelRef,
    reset,
    retry,
  };
}

/**
 * Type for the hook return value
 */
export type UseInfiniteScrollReturn<T> = ReturnType<typeof useInfiniteScroll<T>>;
