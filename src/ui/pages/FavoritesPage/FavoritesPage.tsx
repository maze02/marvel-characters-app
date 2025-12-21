import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@ui/designSystem/atoms/Icon/Icon';
import { SearchBar } from '@ui/designSystem/molecules/SearchBar/SearchBar';
import { FavoriteButton } from '@ui/designSystem/molecules/FavoriteButton/FavoriteButton';
import { Layout } from '@ui/components/Layout/Layout';
import { useFavorites } from '@ui/state/FavoritesContext';
import { useLoading } from '@ui/state/LoadingContext';
import { useUseCases } from '@ui/state/DependenciesContext';
import { useDebouncedValue } from '@ui/hooks/useDebouncedValue';
import { routes } from '@ui/routes/routes';
import { Character } from '@domain/character/entities/Character';
import { UI } from '@config/constants';
import { logger } from '@infrastructure/logging/Logger';
import styles from './FavoritesPage.module.scss';

/**
 * Favorites Page
 * 
 * Dedicated page for viewing favorited characters with search functionality.
 * 
 * Features:
 * - Loads favorite characters from localStorage
 * - Real-time search filtering
 * - Proper loading states (prevents "No favorites" flash during load)
 * - Synchronized with favorites context for real-time updates
 * - Dependencies injected via Context (no direct instantiation)
 */
export const FavoritesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteCharacters, setFavoriteCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedQuery = useDebouncedValue(searchQuery, UI.SEARCH_DEBOUNCE_MS);
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();
  const { startLoading, stopLoading } = useLoading();

  // Inject use cases via DI container
  const { listFavorites, filterCharacters } = useUseCases();

  // Derived state: Check if there are any favorites
  const hasFavorites = favoritesCount > 0;

  // Load favorite characters on mount and when favorites change
  useEffect(() => {
    const loadFavorites = async () => {
      // Start loading state for navbar
      setIsLoading(true);
      startLoading();

      // Early return if no favorites - skip API call but maintain loading state briefly
      if (!hasFavorites) {
        setFavoriteCharacters([]);
        setIsLoading(false);
        stopLoading();
        return;
      }

      try {
        const characters = await listFavorites.execute();
        setFavoriteCharacters(characters);
      } catch (error) {
        logger.error('Failed to load favorites', error);
        setFavoriteCharacters([]);
      } finally {
        setIsLoading(false);
        stopLoading();
      }
    };

    void loadFavorites();
  }, [favoritesCount, listFavorites, hasFavorites, startLoading, stopLoading]); // Reload when favorites count changes

  // Filter characters based on search query using use case (business logic)
  const displayedCharacters = filterCharacters.execute(favoriteCharacters, debouncedQuery);

  return (
    <Layout>
      <div className={styles.main} id="main-content">
        <h1 className={styles.pageTitle}>FAVORITES</h1>
        
        <div className={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="SEARCH A CHARACTER..."
          />
        </div>

        <div className={styles.resultsCount}>
          {searchQuery 
            ? `${displayedCharacters.length} OF ${favoritesCount} RESULTS`
            : `${favoritesCount} RESULTS`
          }
        </div>

        <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
          {displayedCharacters.length} favorite characters found
        </div>

        {!isLoading && (
          <div className={styles.grid}>
            {displayedCharacters.map((character) => (
              <article key={character.id.value} className={styles.card} data-testid="character-card">
                <Link
                  to={routes.characterDetail(character.id.value)}
                  className={styles.cardLink}
                >
                  <div className={styles.cardImage}>
                    <img
                      src={character.getThumbnailUrl('portrait_uncanny')}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.cardFooter}>
                    <div className={styles.cardAccent} />
                    <div className={styles.cardContent}>
                      <h2 className={styles.cardTitle}>{character.name.value}</h2>
                      <FavoriteButton
                        isFavorite={isFavorite(character.id.value)}
                        onToggle={() => void toggleFavorite(character.id.value)}
                        characterName={character.name.value}
                        size="small"
                      />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Empty state - only show after loading completes AND when truly empty */}
        {!isLoading && !hasFavorites && displayedCharacters.length === 0 && (
          <div className={styles.emptyState}>
            <Icon name="heart" size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>
              {searchQuery ? 'No Characters Found' : 'No Favorites Yet'}
            </h2>
            {searchQuery ? (
              <p className={styles.emptyMessage}>
                Try searching for different character names
              </p>
            ) : (
              <p className={styles.emptyMessage}>
                Start favoriting characters to see them here!
              </p>
            )}
          </div>
        )}

        {/* Search filter empty state - when searching yields no results but favorites exist */}
        {!isLoading && hasFavorites && searchQuery && displayedCharacters.length === 0 && (
          <div className={styles.emptyState}>
            <Icon name="heart" size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No Characters Found</h2>
            <p className={styles.emptyMessage}>
              Try searching for different character names
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};
