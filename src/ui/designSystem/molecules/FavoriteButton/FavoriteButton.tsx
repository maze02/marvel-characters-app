import React from 'react';
import { Icon } from '../../atoms/Icon/Icon';
import styles from './FavoriteButton.module.scss';

export interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent) => void;
  characterName?: string;
  size?: 'small' | 'medium';
}

/**
 * FavoriteButton Component
 * 
 * Heart button for favoriting characters matching Figma mockup.
 * 
 * @example
 * ```tsx
 * <FavoriteButton
 *   isFavorite={isFavorite}
 *   onToggle={handleToggle}
 *   characterName="Spider-Man"
 * />
 * ```
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onToggle,
  characterName,
  size = 'medium',
}) => {
  const ariaLabel = isFavorite
    ? `Remove ${characterName || 'character'} from favorites`
    : `Add ${characterName || 'character'} to favorites`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${styles.favoriteButton} ${styles[`favoriteButton--${size}`]} ${isFavorite ? styles['favoriteButton--active'] : ''}`}
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
    >
      <Icon 
        name={isFavorite ? 'heart-filled' : 'heart'} 
        size={size === 'small' ? 16 : 20}
      />
    </button>
  );
};
