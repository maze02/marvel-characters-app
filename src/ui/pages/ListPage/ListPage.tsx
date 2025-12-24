import React, { useState, useEffect } from "react";
import { SearchBar } from "@ui/designSystem/molecules/SearchBar/SearchBar";
import { CharacterCard } from "@ui/designSystem/molecules/CharacterCard/CharacterCard";
import { Layout } from "@ui/components/Layout/Layout";
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
import { routes } from "@ui/routes/routes";
import styles from "./ListPage.module.scss";

/**
 * List Page
 *
 * Main page displaying character list with infinite scroll and search.
 * Uses Comic Vine API to fetch Marvel characters.
 *
 * Features:
 * - Loads 50 characters initially
 * - Infinite scroll (loads more as user scrolls)
 * - Real-time search with debouncing
 * - Favorites persistence via localStorage
 * - Dependencies injected via Context (no direct instantiation)
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
  );

  // Sync infinite scroll loading state with global loading bar
  useEffect(() => {
    if (isInfiniteScrollLoading && !searchQuery) {
      startLoading();
    } else if (!searchQuery) {
      stopLoading();
    }
  }, [isInfiniteScrollLoading, searchQuery]);

  // Handle search - only runs when debouncedQuery changes (not on every keystroke!)
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery) {
        setSearchResults([]);
        setIsSearchLoading(false);
        setSearchError(null);
        stopLoading();
        return;
      }

      logger.info("Performing search", { debouncedQuery });
      setIsSearchLoading(true);
      setSearchError(null);
      startLoading();
      try {
        const result = await searchCharacters.execute(debouncedQuery);
        logger.info("Search results received", {
          query: debouncedQuery,
          count: result.count,
          charactersLength: result.characters.length,
        });
        setSearchResults(result.characters);
        setSearchError(null);
      } catch (error: any) {
        // Don't log cancelled requests as errors (expected behavior from debouncing)
        if (
          error?.message?.includes("cancel") ||
          error?.code === "ERR_CANCELED"
        ) {
          logger.debug("Search request cancelled (debouncing)", {
            query: debouncedQuery,
          });
          setSearchError(null);
        } else {
          logger.error("Search failed", error, { query: debouncedQuery });
          // Set user-friendly error message
          if (error?.message?.includes("timeout")) {
            setSearchError(
              "The search is taking too long. The Comic Vine API might be slow right now. Please try again.",
            );
          } else if (error?.message?.includes("rate limit")) {
            setSearchError(
              "Too many requests. Please wait a moment and try again.",
            );
          } else {
            setSearchError(
              "Search failed. Please check your connection and try again.",
            );
          }
        }
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
        stopLoading();
      }
    };

    void performSearch();
  }, [debouncedQuery, searchCharacters, startLoading, stopLoading]); // ✅ Removed searchQuery - only trigger on debouncedQuery!

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
    <Layout>
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
      <div className={styles.main} id="main-content">
        {/* H1 for SEO - visually hidden, helps search engines understand the page topic */}
        <h1 className={styles.srOnly}>
          Marvel Characters - Browse All Superheroes
        </h1>
        <div className={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="SEARCH A MARVEL CHARACTER..."
          />
        </div>

        <div className={styles.resultsCount}>
          {displayedCharacters.length} RESULTS
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.srOnly}
        >
          {displayedCharacters.length} characters found
        </div>

        {!isLoading && (
          <div className={styles.grid}>
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
            className={styles.sentinel}
            data-testid="sentinel"
          />
        )}

        {/* Search error state */}
        {!isLoading && searchError && searchQuery && (
          <div className={styles.errorState}>
            <h2 className={styles.emptyTitle}>Search Failed</h2>
            <p className={styles.emptyMessage}>{searchError}</p>
            <button onClick={retrySearch} className={styles.retryButton}>
              Retry Search
            </button>
          </div>
        )}

        {/* Error state - only show after loading completes */}
        {!isLoading &&
          infiniteScrollError &&
          !searchQuery &&
          infiniteScrollCharacters.length === 0 && (
            <div className={styles.errorState}>
              <p>Failed to load characters. Please try again.</p>
              <button onClick={retry} className={styles.retryButton}>
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
            <div className={styles.emptyState}>
              <h2 className={styles.emptyTitle}>
                {searchQuery ? "No Characters Found" : "No Data Available"}
              </h2>
              {searchQuery ? (
                <p className={styles.emptyMessage}>
                  Try searching for different character names like "Spider",
                  "Iron", or "Captain"
                </p>
              ) : (
                <>
                  <p className={styles.emptyMessage}>
                    Configure Comic Vine API key in .env to load character data
                  </p>
                  <p className={styles.emptyMessage}>
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
    </Layout>
  );
};
