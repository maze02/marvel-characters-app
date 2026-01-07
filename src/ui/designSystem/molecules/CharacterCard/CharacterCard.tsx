import React, { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { FavoriteButton } from "../FavoriteButton/FavoriteButton";
import { routes } from "@ui/routes/routes";
import { preloadDetailPage } from "@ui/routes/AppRouter";
import styles from "./CharacterCard.module.scss";

export interface CharacterCardProps {
  id: number;
  name: string;
  imageUrl: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  priority?: boolean; // For LCP optimization - first few cards should have priority
}

/**
 * CharacterCard Component
 *
 * Displays a character card with hover effects.
 * Features: Image, name, favorite button, expanding red accent line on hover.
 * Uses shared card mixins for consistent styling across ListPage and FavoritesPage.
 *
 * Performance: Memoized to prevent unnecessary re-renders when parent re-renders
 * Prefetches detail page on hover for instant navigation
 */
const CharacterCardComponent: React.FC<CharacterCardProps> = ({
  id,
  name,
  imageUrl,
  isFavorite,
  onToggleFavorite,
  priority = false,
}) => {
  // Prefetch detail page on hover for instant navigation
  const handlePrefetch = useCallback(() => {
    void preloadDetailPage();
  }, []);

  return (
    <article className={styles.card} data-testid="character-card">
      <Link
        to={routes.characterDetail(id)}
        className={styles.card__link}
        data-testid="character-card-link"
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
      >
        <div className={styles.card__image}>
          <img
            src={imageUrl}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
        </div>
        <div className={styles.card__footer}>
          <div className={styles.card__accent} />
          <div className={styles.card__content}>
            <h2 className={styles.card__title} data-testid="character-name">
              {name}
            </h2>
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
              characterName={name}
              size="small"
            />
          </div>
        </div>
      </Link>
    </article>
  );
};

// Memoize to prevent re-renders when props haven't changed
export const CharacterCard = memo(CharacterCardComponent);
