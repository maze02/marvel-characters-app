import React, { useState, useEffect } from "react";
import { SearchBar } from "@ui/designSystem/molecules/SearchBar/SearchBar";
import { CharacterCard } from "@ui/designSystem/molecules/CharacterCard/CharacterCard";
import { SEO } from "@ui/components/SEO";
import { useFavorites } from "@ui/state/FavoritesContext";
import { useLoading } from "@ui/state/LoadingContext";
import { useUseCases } from "@ui/state/DependenciesContext";
import { useDebouncedValue } from "@ui/hooks/useDebouncedValue";
import { useInfiniteScroll } from "@ui/hooks/useInfiniteScroll";
import { Character } from "@domain/character/entities/Character";
import { PAGINATION, UI } from "@config/constants";
import { config } from "@infrastructure/config/env";
import { logger } from "@infrastructure/logging/Logger";
import {
  isCancellationError,
  getErrorMessage,
} from "@infrastructure/http/types";
import { routes } from "@ui/routes/routes";
import styles from "./ListPage.module.scss";

/**
 * Main page showing all Marvel characters
 *
 * Shows a grid of character cards that you can scroll through infinitely.
 * You can search for characters and mark favorites.
 *
 * How it works:
 * - Loads 50 characters at a time as you scroll
 * - Search waits 400ms after you stop typing before making API call
 * - Favorites are saved in your browser
 * - Cancels old search requests when you type new text
 */
export const ListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Character[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(searchQuery, UI.SEARCH_DEBOUNCE_MS);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { startLoading, stopLoading } = useLoading();

  // Inject use cases via DI container
  const { listCharacters, searchCharacters } = useUseCases();

  // Infinite scroll for main character list (no search query)
  const {
    items: infiniteScrollCharacters,
    loading: isInfiniteScrollLoading,
    hasMore,
    sentinelRef,
    error: infiniteScrollError,
    retry,
  } = useInfiniteScroll(
    (offset) =>
      listCharacters.execute({ limit: PAGINATION.DEFAULT_LIMIT, offset }),
    PAGINATION.DEFAULT_LIMIT,
    (character) => character.id.value, // Extract unique ID for deduplication
  );

  // Sync infinite scroll loading state with global loading bar
  // Sync loading state from infinite scroll
  useEffect(() => {
    if (isInfiniteScrollLoading && !searchQuery) {
      startLoading();
    } else if (!searchQuery) {
      stopLoading();
    }
    // startLoading/stopLoading are stable context functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInfiniteScrollLoading, searchQuery]);

  // Handle search - only runs when debouncedQuery changes (not on every keystroke!)
  // Uses AbortController to cancel outdated requests and prevent race conditions
  useEffect(() => {
    // Create abort controller for this search request
    const abortController = new AbortController();
    // Track if this is still the latest request
    const requestId = Date.now();
    let isLatestRequest = true;

    const performSearch = async () => {
      if (!debouncedQuery) {
        setSearchResults([]);
        setIsSearchLoading(false);
        setSearchError(null);
        stopLoading();
        return;
      }

      logger.info("Performing search", { debouncedQuery, requestId });
      setIsSearchLoading(true);
      setSearchError(null);
      startLoading();

      try {
        // Pass abort signal to allow cancellation
        const result = await searchCharacters.execute(debouncedQuery, {
          signal: abortController.signal,
        });

        // Only update state if this is still the latest request and not aborted
        if (isLatestRequest && !abortController.signal.aborted) {
          logger.info("Search results received", {
            query: debouncedQuery,
            requestId,
            count: result.count,
            charactersLength: result.characters.length,
          });
          setSearchResults(result.characters);
          setSearchError(null);
        } else {
          logger.debug("Search result ignored (newer request exists)", {
            query: debouncedQuery,
            requestId,
          });
        }
      } catch (error: unknown) {
        // Ignore errors from aborted requests (expected behavior)
        if (abortController.signal.aborted || isCancellationError(error)) {
          logger.debug("Search aborted (expected)", {
            query: debouncedQuery,
            requestId,
          });
          return;
        }

        // Don't log cancelled requests as errors (expected behavior from debouncing)
        if (isCancellationError(error)) {
          logger.debug("Search request cancelled (debouncing)", {
            query: debouncedQuery,
            requestId,
          });
          return;
        }

        // Only update error state if this is still the latest request
        if (isLatestRequest) {
          logger.error("Search failed", error, {
            query: debouncedQuery,
            requestId,
          });

          // Set user-friendly error message
          const errorMessage = getErrorMessage(error);
          if (errorMessage.includes("timeout")) {
            setSearchError(
              "The search is taking too long. The Comic Vine API might be slow right now. Please try again.",
            );
          } else if (errorMessage.includes("rate limit")) {
            setSearchError(
              "Too many requests. Please wait a moment and try again.",
            );
          } else {
            setSearchError(
              "Search failed. Please check your connection and try again.",
            );
          }
          setSearchResults([]);
        }
      } finally {
        // Only update loading state if this is still the latest request and not aborted
        if (isLatestRequest && !abortController.signal.aborted) {
          setIsSearchLoading(false);
          stopLoading();
        }
      }
    };

    void performSearch();

    // Cleanup: abort request when component unmounts or debouncedQuery changes
    return () => {
      isLatestRequest = false;
      abortController.abort();
    };
  }, [debouncedQuery, searchCharacters, startLoading, stopLoading]);

  // Retry search handler
  const retrySearch = () => {
    setSearchError(null);
    setSearchQuery(""); // Clear search
    setTimeout(() => setSearchQuery(debouncedQuery), 0); // Retrigger with same query
  };

  // Determine which characters to display
  const displayedCharacters = searchQuery
    ? searchResults
    : infiniteScrollCharacters;

  // Determine if we're currently loading
  const isLoading = searchQuery
    ? isSearchLoading && searchResults.length === 0 // Show loading for search
    : isInfiniteScrollLoading && infiniteScrollCharacters.length === 0; // Show loading for initial list

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
            {displayedCharacters.map((character) => (
              <CharacterCard
                key={character.id.value}
                id={character.id.value}
                name={character.name.value}
                imageUrl={character.getThumbnailUrl("portrait_uncanny")}
                isFavorite={isFavorite(character.id.value)}
                onToggleFavorite={() => void toggleFavorite(character.id.value)}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel (only when not searching) */}
        {!searchQuery && hasMore && (
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
            <p className={styles.listPage__message}>{searchError}</p>
            <button onClick={retrySearch} className={styles.listPage__action}>
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
              <button onClick={retry} className={styles.listPage__action}>
                Retry
              </button>
            </div>
          )}

        {/* Empty state - only show after loading completes and search has actually executed */}
        {!isLoading &&
          !searchError &&
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
