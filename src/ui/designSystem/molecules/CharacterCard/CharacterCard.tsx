import React from 'react';
import { Link } from 'react-router-dom';
import { FavoriteButton } from '../FavoriteButton/FavoriteButton';
import { routes } from '@ui/routes/routes';
import styles from './CharacterCard.module.scss';

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
 * Displays a character card matching Figma mockup exactly.
 * Features: Image, name, favorite button, red accent border.
 */
export const CharacterCard: React.FC<CharacterCardProps> = ({
  id,
  name,
  imageUrl,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <article className={styles.card}>
      <Link
        to={routes.characterDetail(id)}
        className={styles.cardLink}
      >
        <div className={styles.imageContainer}>
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className={styles.image}
          />
        </div>
        <div className={styles.footer}>
          <h2 className={styles.name}>{name}</h2>
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            characterName={name}
            size="small"
          />
        </div>
      </Link>
    </article>
  );
};
