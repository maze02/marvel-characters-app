import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CharacterHero } from "@ui/designSystem/molecules/CharacterHero/CharacterHero";
import { Button } from "@ui/designSystem/atoms/Button/Button";
import { ComicsHorizontalScroll } from "@ui/designSystem/molecules/ComicsHorizontalScroll/ComicsHorizontalScroll";
import { SEO } from "@ui/components/SEO";

import { useFavorites } from "@ui/state/FavoritesContext";
import { useLoading } from "@ui/state/LoadingContext";
import { useUseCases } from "@ui/state/DependenciesContext";
import { routes } from "@ui/routes/routes";

import { Character } from "@domain/character/entities/Character";
import { Comic } from "@domain/character/entities/Comic";
import { config } from "@infrastructure/config/env";
import { logger } from "@infrastructure/logging/Logger";
import styles from "./DetailPage.module.scss";

type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Detail Page
 *
 * Displays detailed character information and comics.
 * Dependencies injected via Context (no direct instantiation).
 */
export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [comics, setComics] = useState<Comic[]>([]); // Loaded comics (cumulative)
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [comicsLoading, setComicsLoading] = useState(true);
  const [loadingMoreComics, setLoadingMoreComics] = useState(false);
  const [comicsOffset, setComicsOffset] = useState(0); // Current pagination offset
  const [hasMoreComics, setHasMoreComics] = useState(false);

  const COMICS_PAGE_SIZE = 20; // Load 20 at a time
  const { isFavorite, toggleFavorite } = useFavorites();
  const { startLoading, stopLoading } = useLoading();

  // Access use cases from dependencies context that connects to infrastructure layer
  const { getCharacterDetail, listCharacterComics } = useUseCases();

  // Sync loadingState with global loading context
  // Shows loading bar for: character loading, initial comics loading, AND loading more comics
  useEffect(() => {
    if (loadingState === "loading" || comicsLoading || loadingMoreComics) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [
    loadingState,
    comicsLoading,
    loadingMoreComics,
    startLoading,
    stopLoading,
  ]);

  useEffect(() => {
    // Validate ID exists
    if (!id) {
      setLoadingState("error");
      return;
    }

    // Use flag to handle cleanup
    let isCancelled = false;

    // Set loading state immediately (synchronous)
    setLoadingState("loading");
    setCharacter(null);
    setComics([]);
    setComicsOffset(0);
    setHasMoreComics(false);

    // Defer async operation to next event loop iteration
    // Ensures React renders the loading bar before fetching data
    const timeoutId = setTimeout(() => {
      const loadData = async () => {
        try {
          // Load character (required)
          const charData = await getCharacterDetail.execute(Number(id));

          // Only update state if not cancelled
          if (!isCancelled) {
            setCharacter(charData);
            setLoadingState("success");
          }

          // Load FIRST PAGE of comics (lazy loading for fast initial render)
          try {
            setComicsLoading(true);

            // Fetch only first 20 comics (fast!)
            const firstPage = await listCharacterComics.execute(Number(id), {
              offset: 0,
              limit: COMICS_PAGE_SIZE,
            });

            // Check if there are more comics to load (use character data, no extra API call)
            const totalCount = charData.getIssueCount();

            if (!isCancelled) {
              setComics(firstPage);
              setComicsOffset(COMICS_PAGE_SIZE);
              setHasMoreComics(
                firstPage.length === COMICS_PAGE_SIZE &&
                  totalCount > COMICS_PAGE_SIZE,
              );
            }
          } catch (comicsError) {
            logger.warn("Failed to load comics, continuing anyway", {
              characterId: id,
              error: comicsError,
            });
            if (!isCancelled) {
              setComics([]);
              setHasMoreComics(false);
            }
          } finally {
            if (!isCancelled) {
              setComicsLoading(false);
            }
          }
        } catch (error: unknown) {
          // Ignore errors if the component was unmounted or effect cleaned up
          if (isCancelled) {
            return;
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : undefined;

          // Ignore cancellation errors - don't show error state
          if (
            errorMessage.includes("cancelled") ||
            errorName === "CanceledError" ||
            errorMessage.includes("canceled")
          ) {
            logger.debug("Request was cancelled, ignoring error", {
              characterId: id,
            });
            return;
          }

          logger.error("Failed to load character", error, { characterId: id });
          setLoadingState("error");
          setCharacter(null);
          setComics([]);
          setHasMoreComics(false);
        }
      };

      void loadData();
    }, 0);

    // Cleanup function to prevent state updates after unmount and cancel timeout
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [id, getCharacterDetail, listCharacterComics, COMICS_PAGE_SIZE]);

  /**
   * Deduplicates comics array by ID
   * Ensures React keys remain unique even if API returns duplicates
   *
   * @param existingComics - Current comics in state
   * @param newComics - Newly fetched comics to append
   * @returns Deduplicated array maintaining original order
   */
  const deduplicateComics = (
    existingComics: Comic[],
    newComics: Comic[],
  ): Comic[] => {
    // Create a Set of existing IDs for O(1) lookup
    const existingIds = new Set(existingComics.map((comic) => comic.id));

    // Filter out duplicates from new comics
    const uniqueNewComics = newComics.filter(
      (comic) => !existingIds.has(comic.id),
    );

    // Append only unique comics
    return [...existingComics, ...uniqueNewComics];
  };

  // Load more comics handler (true pagination - fetches from API)
  const loadMoreComics = async () => {
    if (loadingMoreComics || !hasMoreComics || !id) return;

    try {
      setLoadingMoreComics(true);

      // Fetch next page
      const nextPage = await listCharacterComics.execute(Number(id), {
        offset: comicsOffset,
        limit: COMICS_PAGE_SIZE,
      });

      // Append to existing comics with deduplication to prevent React key warnings
      setComics((prev) => deduplicateComics(prev, nextPage));
      setComicsOffset((prev) => prev + COMICS_PAGE_SIZE);

      // Check if there are more
      const totalCount = await listCharacterComics.getTotalCount(Number(id));
      setHasMoreComics(
        nextPage.length === COMICS_PAGE_SIZE &&
          comicsOffset + COMICS_PAGE_SIZE < totalCount,
      );
    } catch (error) {
      // Don't log cancelled requests as errors (expected behavior during navigation)
      const isCancellation =
        error instanceof Error && error.message === "Request was cancelled";

      if (!isCancellation) {
        logger.error("Failed to load more comics", error, { characterId: id });
      }
      setHasMoreComics(false);
    } finally {
      setLoadingMoreComics(false);
    }
  };

  // Show loading state (navbar already visible from AppRouter Layout)
  if (loadingState === "loading") {
    return <div className={styles.detailPage} />;
  }

  // Render error state only after loading attempt fails
  if (loadingState === "error" || !character) {
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
