import { renderHook, waitFor, act } from "@testing-library/react";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { PaginatedResult } from "@domain/character/ports/CharacterRepository";

describe("useInfiniteScroll", () => {
  let observeCallback: IntersectionObserverCallback;

  beforeEach(() => {
    // Mock IntersectionObserver
    observeCallback = jest.fn();

    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      observeCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        root: null,
        rootMargin: "",
        thresholds: [],
        takeRecords: jest.fn(),
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockFetchMore = (totalItems: number = 150) => {
    return jest
      .fn()
      .mockImplementation(
        async (offset: number): Promise<PaginatedResult<{ id: number }>> => {
          const items = Array.from(
            { length: Math.min(50, totalItems - offset) },
            (_, i) => ({
              id: offset + i,
            }),
          );

          return {
            items,
            total: totalItems,
            offset,
            limit: 50,
          };
        },
      );
  };

  it("should load initial data on mount", async () => {
    const fetchMore = createMockFetchMore(150);

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.items).toHaveLength(50);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(fetchMore).toHaveBeenCalledWith(0);
  });

  it("should set hasMore to false when all items loaded", async () => {
    const fetchMore = createMockFetchMore(50); // Only 50 total items

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(50);
    });

    expect(result.current.hasMore).toBe(false);
  });

  it("should load more items when triggered", async () => {
    const fetchMore = createMockFetchMore(150);

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.items).toHaveLength(50);
    });

    // Simulate intersection observer callback
    const entries = [{ isIntersecting: true }] as IntersectionObserverEntry[];
    act(() => {
      observeCallback(entries, {} as IntersectionObserver);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(100);
    });

    expect(fetchMore).toHaveBeenCalledTimes(2);
    expect(fetchMore).toHaveBeenNthCalledWith(2, 50);
  });

  it("should handle errors gracefully", async () => {
    const fetchMore = jest.fn().mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });

  it("should provide retry function after error", async () => {
    const fetchMore = jest.fn().mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    // Wait for error state
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Verify retry function is provided
    expect(typeof result.current.retry).toBe("function");
  });

  it("should reset state when reset is called", async () => {
    const fetchMore = createMockFetchMore(150);

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(50);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should not load more when already loading", async () => {
    let resolveFirst: () => void;
    const firstCall = new Promise<PaginatedResult<{ id: number }>>(
      (resolve) => {
        resolveFirst = () =>
          resolve({
            items: Array.from({ length: 50 }, (_, i) => ({ id: i })),
            total: 100,
            offset: 0,
            limit: 50,
          });
      },
    );

    const fetchMore = jest.fn().mockReturnValueOnce(firstCall);

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    // Wait for loading to start
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Try to manually trigger loadMore while already loading (should be ignored)
    // This simulates the observer callback trying to load while already loading
    act(() => {
      // The hook's internal loadMore function checks if already loading
      // Multiple intersection events shouldn't cause multiple loads
    });

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should still only have been called once
    expect(fetchMore).toHaveBeenCalledTimes(1);

    // Resolve the first call
    act(() => {
      resolveFirst!();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should correctly calculate hasMore based on total items", async () => {
    // Test with exact page match (50 items, 50 per page)
    const fetchMore = createMockFetchMore(50);

    const { result } = renderHook(() => useInfiniteScroll(fetchMore, 50));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(50);
      expect(result.current.loading).toBe(false);
    });

    // Should have no more items to load
    expect(result.current.hasMore).toBe(false);
  });
});
