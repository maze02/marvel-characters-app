import React, { memo, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@ui/designSystem/atoms/Logo/Logo";
import { Icon } from "@ui/designSystem/atoms/Icon/Icon";
import { useFavorites } from "@ui/state/FavoritesContext";
import { routes } from "@ui/routes/routes";
import { preloadFavoritesPage } from "@ui/routes/AppRouter";
import styles from "./Navbar.module.scss";

export interface NavbarProps {
  /** Optional callback when logo is clicked */
  onLogoClick?: () => void;
  /** Optional callback when favorites button is clicked */
  onFavoritesClick?: () => void;
}

/**
 * Navbar Component
 *
 * Reusable navigation bar with Marvel logo and favorites button.
 * Displays favorites count badge when user has favorites.
 * Consistent across all pages.
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
const NavbarComponent: React.FC<NavbarProps> = ({
  onLogoClick,
  onFavoritesClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { favoritesCount } = useFavorites();

  const isFavoritesActive = useMemo(
    () => location.pathname === routes.favorites,
    [location.pathname],
  );

  const handleFavoritesClick = useCallback(() => {
    if (onFavoritesClick) {
      onFavoritesClick();
    } else {
      // Default behavior: navigate to favorites
      navigate(routes.favorites);
    }
  }, [onFavoritesClick, navigate]);

  // Prefetch favorites page on hover for instant navigation
  const handleFavoritesHover = useCallback(() => {
    void preloadFavoritesPage();
  }, []);

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__content}>
        {onLogoClick ? <Logo onClick={onLogoClick} /> : <Logo />}
        <button
          type="button"
          onClick={handleFavoritesClick}
          onMouseEnter={handleFavoritesHover}
          onFocus={handleFavoritesHover}
          className={styles.navbar__favoritesButton}
          aria-label={
            isFavoritesActive ? "Viewing favorites" : "View favorites"
          }
          data-testid="favorites-nav-button"
        >
          <Icon name="heart-filled" size={24} />
          {favoritesCount > 0 && (
            <span
              className={styles.navbar__favoritesCount}
              data-testid="favorites-count"
            >
              {favoritesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

// Memoize to prevent re-renders when parent re-renders
export const Navbar = memo(NavbarComponent);
