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
import { useInfiniteScroll } from '@ui/hooks/useInfiniteScroll';
import { routes } from '@ui/routes/routes';
import { Character } from '@domain/character/entities/Character';
import { PAGINATION, UI } from '@config/constants';
import { logger } from '@infrastructure/logging/Logger';
import styles from './ListPage.module.scss';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Character[]>([]);
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
    retry 
  } = useInfiniteScroll(
    (offset) => listCharacters.execute({ limit: PAGINATION.DEFAULT_LIMIT, offset }),
    PAGINATION.DEFAULT_LIMIT
  );

  // Sync infinite scroll loading state with global loading bar
  useEffect(() => {
    if (isInfiniteScrollLoading && !searchQuery) {
      startLoading();
    } else if (!searchQuery) {
      stopLoading();
    }
  }, [isInfiniteScrollLoading, searchQuery]);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery) {
        setSearchResults([]);
        stopLoading();
        return;
      }

      startLoading();
      try {
        const result = await searchCharacters.execute(debouncedQuery);
        setSearchResults(result.characters);
      } catch (error) {
        logger.error('Search failed', error, { query: debouncedQuery });
        setSearchResults([]);
      } finally {
        stopLoading();
      }
    };

    void performSearch();
  }, [debouncedQuery, searchCharacters, startLoading, stopLoading]);

  // Determine which characters to display
  const displayedCharacters = searchQuery ? searchResults : infiniteScrollCharacters;
  
  // Determine if we're currently loading
  const isLoading = searchQuery ? false : isInfiniteScrollLoading && infiniteScrollCharacters.length === 0;

  return (
    <Layout>
      <div className={styles.main} id="main-content">
        <div className={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="SEARCH A CHARACTER..."
          />
        </div>

        <div className={styles.resultsCount}>
          {displayedCharacters.length} RESULTS
        </div>

        <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
          {displayedCharacters.length} characters found
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

        {/* Infinite scroll sentinel (only when not searching) */}
        {!searchQuery && hasMore && (
          <div ref={sentinelRef} className={styles.sentinel} data-testid="sentinel" />
        )}

        {/* Error state - only show after loading completes */}
        {!isLoading && infiniteScrollError && !searchQuery && infiniteScrollCharacters.length === 0 && (
          <div className={styles.errorState}>
            <p>Failed to load characters. Please try again.</p>
            <button onClick={retry} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {/* Empty state - only show after loading completes */}
        {!isLoading && displayedCharacters.length === 0 && (
          <div className={styles.emptyState}>
            <Icon name="heart" size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>
              {searchQuery ? 'No Characters Found' : 'No Data Available'}
            </h2>
            {searchQuery ? (
              <p className={styles.emptyMessage}>
                Try searching for different character names like "Spider", "Iron", or "Captain"
              </p>
            ) : (
              <>
                <p className={styles.emptyMessage}>
                  Configure Comic Vine API key in .env to load character data
                </p>
                <p className={styles.emptyMessage}>
                  Get your API key at <a href="https://comicvine.gamespot.com/api/" target="_blank" rel="noopener noreferrer" style={{ color: '#EC1D24', textDecoration: 'underline' }}>comicvine.gamespot.com/api</a>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
