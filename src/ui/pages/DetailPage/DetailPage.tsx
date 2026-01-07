import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CharacterHero } from "@ui/designSystem/molecules/CharacterHero/CharacterHero";
import { Button } from "@ui/designSystem/atoms/Button/Button";
import { ComicsHorizontalScroll } from "@ui/designSystem/molecules/ComicsHorizontalScroll/ComicsHorizontalScroll";
import { SEO } from "@ui/components/SEO";
import { useFavorites } from "@ui/state/FavoritesContext";
import { routes } from "@ui/routes/routes";
import { config } from "@infrastructure/config/env";
import { useCharacterDetail } from "@ui/queries";
import { useUseCases } from "@ui/state";
import { Comic } from "@domain/character/entities/Comic";
import { logger } from "@infrastructure/logging/Logger";
import styles from "./DetailPage.module.scss";

const COMICS_PAGE_SIZE = 20; // Load 20 comics at a time

/**
 * Detail Page
 *
 * Displays detailed character information and comics with pagination.
 * Uses React Query for character data and manual state for comics pagination.
 *
 */
export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { listCharacterComics } = useUseCases();

  // Comics pagination state
  const [comics, setComics] = useState<Comic[]>([]);
  const [comicsOffset, setComicsOffset] = useState(0);
  const [comicsLoading, setComicsLoading] = useState(false);
  const [loadingMoreComics, setLoadingMoreComics] = useState(false);
  const [hasMoreComics, setHasMoreComics] = useState(false);

  // Parse character ID
  const characterId = id ? Number(id) : 0;

  // Fetch character details
  const {
    data: character,
    isLoading: isCharacterLoading,
    error: characterError,
  } = useCharacterDetail(characterId);

  // Load initial comics when character is loaded
  useEffect(() => {
    if (!character) return;

    const loadInitialComics = async () => {
      try {
        setComicsLoading(true);

        // Fetch first page of comics
        const firstPage = await listCharacterComics.execute(characterId, {
          offset: 0,
          limit: COMICS_PAGE_SIZE,
        });

        // Check if there are more comics
        const totalCount = character.getIssueCount();

        setComics(firstPage);
        setComicsOffset(COMICS_PAGE_SIZE);
        setHasMoreComics(
          firstPage.length === COMICS_PAGE_SIZE &&
            totalCount > COMICS_PAGE_SIZE,
        );
      } catch (error) {
        logger.warn("Failed to load comics, continuing anyway", {
          characterId,
          error,
        });
        setComics([]);
        setHasMoreComics(false);
      } finally {
        setComicsLoading(false);
      }
    };

    void loadInitialComics();
  }, [character, characterId, listCharacterComics]);

  /**
   * Deduplicates comics array by ID
   * Ensures React keys remain unique even if API returns duplicates
   */
  const deduplicateComics = useCallback(
    (existingComics: Comic[], newComics: Comic[]): Comic[] => {
      // Create a Set of existing IDs for O(1) lookup
      const existingIds = new Set(existingComics.map((comic) => comic.id));

      // Filter out duplicates from new comics
      const uniqueNewComics = newComics.filter(
        (comic) => !existingIds.has(comic.id),
      );

      // Append only unique comics
      return [...existingComics, ...uniqueNewComics];
    },
    [],
  );

  /**
   * Load more comics handler (true pagination - fetches from API)
   */
  const loadMoreComics = useCallback(async () => {
    if (loadingMoreComics || !hasMoreComics || !character) return;

    try {
      setLoadingMoreComics(true);

      // Fetch next page
      const nextPage = await listCharacterComics.execute(characterId, {
        offset: comicsOffset,
        limit: COMICS_PAGE_SIZE,
      });

      // Append to existing comics with deduplication
      setComics((prev) => deduplicateComics(prev, nextPage));
      setComicsOffset((prev) => prev + COMICS_PAGE_SIZE);

      // Check if there are more
      const totalCount = character.getIssueCount();
      setHasMoreComics(
        nextPage.length === COMICS_PAGE_SIZE &&
          comicsOffset + COMICS_PAGE_SIZE < totalCount,
      );
    } catch (error) {
      logger.error("Failed to load more comics", error, { characterId });
      setHasMoreComics(false);
    } finally {
      setLoadingMoreComics(false);
    }
  }, [
    loadingMoreComics,
    hasMoreComics,
    character,
    characterId,
    comicsOffset,
    listCharacterComics,
    deduplicateComics,
  ]);

  // Determine overall loading state
  const isLoading = isCharacterLoading;
  const hasError = !!characterError || !character;

  // Show loading state (navbar already visible from AppRouter Layout)
  if (isLoading) {
    return <div className={styles.detailPage} />;
  }

  // Render error state only after loading attempt fails
  if (hasError || !character) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.detailPage__emptyState}>
          <h2 className={styles.detailPage__heading}>Character Not Found</h2>
          <p className={styles.detailPage__message}>
            Unable to load character details. This may be due to an API error or
            the character may not exist.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(routes.home)}
            aria-label="Return to home page"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Render character details (success state)
  return (
    <>
      <SEO
        title={`${character.name.value} - Marvel Character Profile | Comics & Info`}
        description={
          character.hasDescription()
            ? `${character.name.value}: ${character.description.substring(0, 150)}...`
            : `Learn about ${character.name.value}, a Marvel superhero. View character profile, comics, and detailed information.`
        }
        image={character.getThumbnailUrl()}
        type="profile"
        canonicalUrl={`${config.appUrl}${routes.characterDetail(character.id.value)}`}
        character={{
          name: character.name.value,
          ...(character.hasDescription() && {
            description: character.description,
          }),
          image: character.getThumbnailUrl(),
        }}
      />
      <div className={styles.detailPage}>
        <CharacterHero
          imageUrl={character.getThumbnailUrl()}
          characterName={character.name.value}
          isFavorite={isFavorite(character.id.value)}
          onToggleFavorite={() => void toggleFavorite(character.id.value)}
          {...(character.hasDescription() && {
            description: character.description,
          })}
        />

        <ComicsHorizontalScroll
          comics={comics}
          showEmptyState
          loading={comicsLoading}
          hasMore={hasMoreComics}
          loadingMore={loadingMoreComics}
          onLoadMore={loadMoreComics}
        />
      </div>
    </>
  );
};
