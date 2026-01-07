import React, { useState, useMemo } from "react";
import { SearchBar } from "@ui/designSystem/molecules/SearchBar/SearchBar";
import { CharacterCard } from "@ui/designSystem/molecules/CharacterCard/CharacterCard";
import { SEO } from "@ui/components/SEO";
import { useFavorites } from "@ui/state/FavoritesContext";
import { useUseCases } from "@ui/state/DependenciesContext";
import { useDebouncedValue } from "@ui/hooks/useDebouncedValue";
import { useFavoritesList } from "@ui/queries";
import { UI } from "@config/constants";
import { config } from "@infrastructure/config/env";
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
 * - Automatic loading states with global loading bar (via React Query)
 * - Synchronized with favorites context for real-time updates
 * - Automatic caching and refetching
 **/
export const FavoritesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, UI.SEARCH_DEBOUNCE_MS);
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();

  // Inject use cases via DI container
  const { filterCharacters } = useUseCases();

  // Fetch favorite characters with React Query (automatic loading bar)
  const { data: favoriteCharacters = [], isLoading } = useFavoritesList();

  // Derived state: Check if there are any favorites
  const hasFavorites = favoritesCount > 0;

  // Filter characters based on search query using use case (business logic)
  const displayedCharacters = useMemo(
    () => filterCharacters.execute(favoriteCharacters, debouncedQuery),
    [favoriteCharacters, debouncedQuery, filterCharacters],
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
