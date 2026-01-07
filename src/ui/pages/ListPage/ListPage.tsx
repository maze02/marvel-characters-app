import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { SearchBar } from "@ui/designSystem/molecules/SearchBar/SearchBar";
import { CharacterCard } from "@ui/designSystem/molecules/CharacterCard/CharacterCard";
import { SEO } from "@ui/components/SEO";
import { useFavorites } from "@ui/state/FavoritesContext";
import { useDebouncedValue } from "@ui/hooks";
import { UI } from "@config/constants";
import { config } from "@infrastructure/config/env";
import { routes } from "@ui/routes/routes";
import { useCharactersList, useCharactersSearch } from "@ui/queries";
import styles from "./ListPage.module.scss";

/**
 * Main page showing all Marvel characters
 *
 * Shows a grid of character cards that you can scroll through infinitely.
 * You can search for characters and mark favorites.
 *
 * How it works:
 * - Uses React Query for data fetching and caching
 * - Loads 50 characters at a time as you scroll (infinite scroll)
 * - Search waits 400ms after you stop typing before making API call
 * - Favorites are saved in your browser (localStorage)
 * - React Query automatically cancels old search requests
 */
export const ListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, UI.SEARCH_DEBOUNCE_MS);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Infinite scroll for main character list (no search query)
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetching: isInfiniteScrollFetching,
    isLoading: isInfiniteScrollLoading,
    error: infiniteScrollError,
    refetch: retryInfiniteScroll,
  } = useCharactersList();

  // Search results (only when query exists)
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    refetch: retrySearch,
  } = useCharactersSearch(debouncedQuery);

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Get characters from infinite scroll query
  const infiniteScrollCharacters = infiniteData?.characters ?? [];

  // Get characters from search query
  const searchResults = searchData?.characters ?? [];

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    // Don't set up observer if searching or no more data
    if (searchQuery || !hasNextPage || isInfiniteScrollFetching) {
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        // Trigger load when sentinel is visible
        if (
          firstEntry &&
          firstEntry.isIntersecting &&
          hasNextPage &&
          !isInfiniteScrollFetching
        ) {
          void fetchNextPage();
        }
      },
      {
        root: null, // Use viewport
        rootMargin: UI.INFINITE_SCROLL_ROOT_MARGIN,
        threshold: 0.1, // Trigger when 10% visible
      },
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
  }, [searchQuery, hasNextPage, isInfiniteScrollFetching, fetchNextPage]);

  // Retry search handler - memoized to prevent re-creating on every render
  const handleRetrySearch = useCallback(() => {
    void retrySearch();
  }, [retrySearch]);

  // Retry infinite scroll handler - memoized to prevent re-creating on every render
  const handleRetryInfiniteScroll = useCallback(() => {
    void retryInfiniteScroll();
  }, [retryInfiniteScroll]);

  // Determine which characters to display - memoized to prevent recalculation
  const displayedCharacters = useMemo(() => {
    return searchQuery ? searchResults : infiniteScrollCharacters;
  }, [searchQuery, searchResults, infiniteScrollCharacters]);

  // Determine if we're currently loading - memoized to prevent recalculation
  const isLoading = useMemo(() => {
    return searchQuery
      ? isSearchLoading && searchResults.length === 0 // Show loading for search
      : isInfiniteScrollLoading && infiniteScrollCharacters.length === 0; // Show loading for initial list
  }, [
    searchQuery,
    isSearchLoading,
    searchResults.length,
    isInfiniteScrollLoading,
    infiniteScrollCharacters.length,
  ]);

  // Determine which error to show - memoized to prevent recalculation
  const currentError = useMemo(() => {
    return searchQuery ? searchError : infiniteScrollError;
  }, [searchQuery, searchError, infiniteScrollError]);

  return (
    <>
      <SEO
        title="Marvel Characters - Browse All Superheroes | Character Database"
        description="Browse and explore Marvel's vast universe of characters. Search Marvel heroes, view character profiles, comics, and save your favorites. Complete Marvel character database with Spider-Man, Iron Man, Captain America, and more."
        image={`${config.appUrl}/marvel-logo.png`}
        type="website"
        canonicalUrl={`${config.appUrl}${routes.home}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Marvel Characters",
          description:
            "Browse and search Marvel characters, heroes, and superheroes",
          url: `${config.appUrl}${routes.home}`,
        }}
      />
      <div className={styles.listPage} id="main-content">
        {/* H1 for SEO - visually hidden, helps search engines understand the page topic */}
        <h1 className={styles.listPage__srOnly}>
          Marvel Characters - Browse All Superheroes
        </h1>
        <div className={styles.listPage__search}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="SEARCH A MARVEL CHARACTER..."
          />
        </div>

        <div
          className={styles.listPage__resultsCount}
          data-testid="results-count"
        >
          {displayedCharacters.length} RESULTS
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.listPage__srOnly}
        >
          {displayedCharacters.length} characters found
        </div>

        {!isLoading && (
          <div className={styles.listPage__grid}>
            {displayedCharacters.map((character, index) => {
              const characterId = character.id.value;
              const characterName = character.name.value;
              const imageUrl = character.getThumbnailUrl("portrait_uncanny");
              const favorite = isFavorite(characterId);
              // First 6 cards are priority (above the fold) for LCP optimization
              const isPriority = index < 6;

              return (
                <CharacterCard
                  key={characterId}
                  id={characterId}
                  name={characterName}
                  imageUrl={imageUrl}
                  isFavorite={favorite}
                  onToggleFavorite={() => void toggleFavorite(characterId)}
                  priority={isPriority}
                />
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel (only when not searching) */}
        {!searchQuery && hasNextPage && (
          <div
            ref={sentinelRef}
            className={styles.listPage__sentinel}
            data-testid="sentinel"
          />
        )}

        {/* Search error state */}
        {!isLoading && searchError && searchQuery && (
          <div className={styles.listPage__errorState}>
            <h2 className={styles.listPage__heading}>Search Failed</h2>
            <p className={styles.listPage__message}>
              {searchError instanceof Error
                ? searchError.message
                : "Search failed. Please check your connection and try again."}
            </p>
            <button
              onClick={handleRetrySearch}
              className={styles.listPage__action}
            >
              Retry Search
            </button>
          </div>
        )}

        {/* Error state - only show after loading completes */}
        {!isLoading &&
          infiniteScrollError &&
          !searchQuery &&
          infiniteScrollCharacters.length === 0 && (
            <div className={styles.listPage__errorState}>
              <p>Failed to load characters. Please try again.</p>
              <button
                onClick={handleRetryInfiniteScroll}
                className={styles.listPage__action}
              >
                Retry
              </button>
            </div>
          )}

        {/* Empty state - only show after loading completes and search has actually executed */}
        {!isLoading &&
          !currentError &&
          displayedCharacters.length === 0 &&
          // If user is typing but debounce hasn't triggered yet, don't show empty state
          (searchQuery && !debouncedQuery ? null : (
            <div className={styles.listPage__emptyState}>
              <h2 className={styles.listPage__heading}>
                {searchQuery ? "No Characters Found" : "No Data Available"}
              </h2>
              {searchQuery ? (
                <p className={styles.listPage__message}>
                  Try searching for different character names like "Spider",
                  "Iron", or "Captain"
                </p>
              ) : (
                <>
                  <p className={styles.listPage__message}>
                    Configure Comic Vine API key in .env to load character data
                  </p>
                  <p className={styles.listPage__message}>
                    Get your API key at{" "}
                    <a
                      href="https://comicvine.gamespot.com/api/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#EC1D24", textDecoration: "underline" }}
                    >
                      comicvine.gamespot.com/api
                    </a>
                  </p>
                </>
              )}
            </div>
          ))}
      </div>
    </>
  );
};
