import React, { useState, useEffect } from "react";
import { SearchBar } from "@ui/designSystem/molecules/SearchBar/SearchBar";
import { CharacterCard } from "@ui/designSystem/molecules/CharacterCard/CharacterCard";
import { SEO } from "@ui/components/SEO";
import { useFavorites } from "@ui/state/FavoritesContext";
import { useLoading } from "@ui/state/LoadingContext";
import { useUseCases } from "@ui/state/DependenciesContext";
import { useDebouncedValue } from "@ui/hooks/useDebouncedValue";
import { Character } from "@domain/character/entities/Character";
import { UI } from "@config/constants";
import { config } from "@infrastructure/config/env";
import { logger } from "@infrastructure/logging/Logger";
import { routes } from "@ui/routes/routes";
import styles from "./FavoritesPage.module.scss";

/**
 * Favorites Page
 *
 * Page for viewing favorited characters with search functionality.
 *
 * Features:
 * - Loads favorite characters from localStorage
 * - Real-time search filtering with debouncing
 * - Proper loading states with global loading bar visibility
 * - Synchronized with favorites context for real-time updates
 * - Shared API cache for fast subsequent loads
 *
 * Technical Implementation:
 * - Dependencies injected via DependencyContainer (DI pattern)
 * - Uses shared repository instances for consistent caching
 * - setTimeout(0) ensures loading bar renders before data fetch
 * - Separates concerns: UI state, loading state, and business logic
 */
export const FavoritesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteCharacters, setFavoriteCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedQuery = useDebouncedValue(searchQuery, UI.SEARCH_DEBOUNCE_MS);
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();
  const { startLoading, stopLoading } = useLoading();

  // Inject use cases via DI container
  const { listFavorites, filterCharacters } = useUseCases();

  // Derived state: Check if there are any favorites
  const hasFavorites = favoritesCount > 0;

  // Sync local loading state with global loading bar
  useEffect(() => {
    if (isLoading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [isLoading, startLoading, stopLoading]);

  // Load favorite characters on mount and when favorites change
  useEffect(() => {
    /**
     * Load favorites with proper loading state management
     *
     * Sets loading state immediately, then defers the async operation using
     * setTimeout(0), which schedules it as a macrotask. This ensures React
     * commits and renders the loading bar before the data fetch begins.
     */

    // Early return if no favorites - no need for loading state
    if (!hasFavorites) {
      setFavoriteCharacters([]);
      setIsLoading(false);
      return;
    }

    // Set loading state immediately (synchronous)
    setIsLoading(true);

    // Defer async operation to next event loop iteration (macrotask)
    // This guarantees React renders the loading bar before fetching data
    const timeoutId = setTimeout(() => {
      const loadFavorites = async () => {
        try {
          // API call - will use shared cache from DependencyContainer
          const characters = await listFavorites.execute();
          setFavoriteCharacters(characters);
        } catch (error) {
          logger.error("Failed to load favorites", error);
          setFavoriteCharacters([]);
        } finally {
          // Always stop loading, even on error
          setIsLoading(false);
        }
      };

      void loadFavorites();
    }, 0);

    // Cleanup: cancel timeout if component unmounts
    return () => clearTimeout(timeoutId);
  }, [favoritesCount, listFavorites, hasFavorites]);

  // Filter characters based on search query using use case (business logic)
  const displayedCharacters = filterCharacters.execute(
    favoriteCharacters,
    debouncedQuery,
  );

  return (
    <>
      <SEO
        title="My Favorite Marvel Characters - Saved Heroes"
        description="View your saved favorite Marvel characters. Browse your personal collection of Marvel heroes and superheroes."
        image={`${config.appUrl}/marvel-logo.png`}
        type="website"
        canonicalUrl={`${config.appUrl}${routes.favorites}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "My Favorite Marvel Characters",
          description: "Personal collection of favorite Marvel characters",
          url: `${config.appUrl}${routes.favorites}`,
        }}
      />
      <div className={styles.favoritesPage} id="main-content">
        <h1 className={styles.favoritesPage__title}>FAVORITES</h1>

        <div className={styles.favoritesPage__search}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="SEARCH A CHARACTER..."
          />
        </div>

        <div className={styles.favoritesPage__resultsCount}>
          {searchQuery
            ? `${displayedCharacters.length} OF ${favoritesCount} RESULTS`
            : `${favoritesCount} RESULTS`}
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.favoritesPage__srOnly}
        >
          {displayedCharacters.length} favorite characters found
        </div>

        {!isLoading && (
          <div className={styles.favoritesPage__grid}>
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

        {/* Empty state - only show after loading completes AND when truly empty */}
        {!isLoading && !hasFavorites && displayedCharacters.length === 0 && (
          <div className={styles.favoritesPage__emptyState}>
            <h2 className={styles.favoritesPage__heading}>
              {debouncedQuery ? "No Characters Found" : "No Favorites Yet"}
            </h2>
            {debouncedQuery ? (
              <p className={styles.favoritesPage__message}>
                Try searching for different character names
              </p>
            ) : (
              <p className={styles.favoritesPage__message}>
                Start favoriting characters to see them here!
              </p>
            )}
          </div>
        )}

        {/* Search filter empty state - when searching yields no results but favorites exist */}
        {!isLoading &&
          hasFavorites &&
          debouncedQuery &&
          displayedCharacters.length === 0 && (
            <div className={styles.favoritesPage__emptyState}>
              <h2 className={styles.favoritesPage__heading}>
                No Characters Found
              </h2>
              <p className={styles.favoritesPage__message}>
                Try searching for different character names
              </p>
            </div>
          )}
      </div>
    </>
  );
};
