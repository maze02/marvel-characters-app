import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@ui/designSystem/atoms/Icon/Icon';
import { CharacterHero } from '@ui/designSystem/molecules/CharacterHero/CharacterHero';
import { ComicsHorizontalScroll } from '@ui/designSystem/molecules/ComicsHorizontalScroll/ComicsHorizontalScroll';
import { Skeleton } from '@ui/designSystem/atoms/Skeleton/Skeleton';
import { Layout } from '@ui/components/Layout/Layout';
import { useFavorites } from '@ui/state/FavoritesContext';
import { useLoading } from '@ui/state/LoadingContext';
import { useUseCases } from '@ui/state/DependenciesContext';
import { routes } from '@ui/routes/routes';
import { Character } from '@domain/character/entities/Character';
import { Comic } from '@domain/character/entities/Comic';
import { COMICS } from '@config/constants';
import { logger } from '@infrastructure/logging/Logger';
import styles from './DetailPage.module.scss';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Detail Page
 * 
 * Displays detailed character information and comics.
 * Dependencies injected via Context (no direct instantiation).
 */
export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [comics, setComics] = useState<Comic[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [comicsLoading, setComicsLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { startLoading, stopLoading } = useLoading();

  // Inject use cases via DI container
  const { getCharacterDetail, listCharacterComics } = useUseCases();

  useEffect(() => {
    // Validate ID exists
    if (!id) {
      setLoadingState('error');
      stopLoading();
      return;
    }

    // Use AbortController to handle cleanup
    let isCancelled = false;

    // Immediately set loading state - this is synchronous and atomic
    setLoadingState('loading');
    setCharacter(null);
    setComics([]);
    startLoading();

    const loadData = async () => {
      try {
        // Load character (required)
        const charData = await getCharacterDetail.execute(Number(id));
        
        // Only update state if not cancelled
        if (!isCancelled) {
          setCharacter(charData);
          setLoadingState('success');
        }
        
        // Load comics separately (optional - don't fail page if this errors)
        try {
          setComicsLoading(true);
          const comicsData = await listCharacterComics.execute(Number(id), COMICS.DEFAULT_DETAIL_PAGE_LIMIT);
          if (!isCancelled) {
            setComics(comicsData);
            setComicsLoading(false);
          }
        } catch (comicsError) {
          logger.warn('Failed to load comics, continuing anyway', { characterId: id, error: comicsError });
          if (!isCancelled) {
            setComics([]); // Empty array if comics fail
            setComicsLoading(false);
          }
        }
      } catch (error: any) {
        // Ignore errors if the component was unmounted or effect cleaned up
        if (isCancelled) {
          return;
        }
        
        // Ignore cancellation errors - don't show error state
        if (error?.message?.includes('cancelled') || error?.name === 'CanceledError' || error?.message?.includes('canceled')) {
          logger.debug('Request was cancelled, ignoring error', { characterId: id });
          return;
        }
        
        logger.error('Failed to load character', error, { characterId: id });
        setLoadingState('error');
        setCharacter(null);
        setComics([]);
      } finally {
        if (!isCancelled) {
          stopLoading();
        }
      }
    };

    void loadData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isCancelled = true;
    };
  }, [id, getCharacterDetail, listCharacterComics, startLoading, stopLoading]);

  // Render loading skeleton while fetching data
  if (loadingState === 'loading') {
    return (
      <Layout>
        <div className={styles.main}>
          <Skeleton variant="rectangular" height="400px" />
        </div>
      </Layout>
    );
  }

  // Render error state only after loading attempt fails
  if (loadingState === 'error' || !character) {
    return (
      <Layout>
        <div className={styles.main}>
          <div className={styles.emptyState}>
            <Icon name="heart" size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>Character Not Found</h2>
            <p className={styles.emptyMessage}>
              Unable to load character details. This may be due to an API error or the character may not exist.
            </p>
            <Link to={routes.home} className={styles.backButton}>
              Return to Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Render character details (success state)
  return (
    <Layout>
      <div className={styles.main}>
        <CharacterHero
          imageUrl={character.getThumbnailUrl()}
          characterName={character.name.value}
          isFavorite={isFavorite(character.id.value)}
          onToggleFavorite={() => void toggleFavorite(character.id.value)}
          {...(character.hasDescription() && { description: character.description })}
        />

        <ComicsHorizontalScroll comics={comics} showEmptyState loading={comicsLoading} />
      </div>
    </Layout>
  );
};
