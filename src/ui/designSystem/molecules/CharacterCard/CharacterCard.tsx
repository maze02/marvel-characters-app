import React from "react";
import { Link } from "react-router-dom";
import { FavoriteButton } from "../FavoriteButton/FavoriteButton";
import { routes } from "@ui/routes/routes";
import styles from "./CharacterCard.module.scss";

export interface CharacterCardProps {
  id: number;
  name: string;
  imageUrl: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/**
 * CharacterCard Component
 *
 * Displays a character card with hover effects.
 * Features: Image, name, favorite button, expanding red accent line on hover.
 * Uses shared card mixins for consistent styling across ListPage and FavoritesPage.
 */
export const CharacterCard: React.FC<CharacterCardProps> = ({
  id,
  name,
  imageUrl,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <article className={styles.card} data-testid="character-card">
      <Link to={routes.characterDetail(id)} className={styles.card__link}>
        <div className={styles.card__image}>
          <img src={imageUrl} alt="" loading="lazy" />
        </div>
        <div className={styles.card__footer}>
          <div className={styles.card__accent} />
          <div className={styles.card__content}>
            <h2 className={styles.card__title}>{name}</h2>
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
