import React from "react";
import { useNavigate } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import { Navbar } from "../Navbar/Navbar";
import { ApiKeyBanner } from "../ApiKeyBanner/ApiKeyBanner";
import { LoadingBar } from "@ui/designSystem/atoms/LoadingBar/LoadingBar";
import { routes } from "@ui/routes/routes";
import styles from "./Layout.module.scss";

export interface LayoutProps {
  children: React.ReactNode;
  /** Optional callback when logo is clicked */
  onLogoClick?: () => void;
}

/**
 * Layout Component
 *
 * Provides consistent page structure with persistent navbar, loading bar, and API banner.
 * Ensures navbar and loading feedback remain visible during page transitions.
 * Uses React Query's useIsFetching to automatically show loading bar when any query is active.
 */
export const Layout: React.FC<LayoutProps> = ({ children, onLogoClick }) => {
  const navigate = useNavigate();

  // Automatically show loading bar when any React Query request is in progress
  const isFetching = useIsFetching();
  const isLoading = isFetching > 0;

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate(routes.home);
    }
  };

  const handleFavoritesClick = () => {
    navigate(routes.favorites);
  };

  return (
    <div className={styles.layout}>
      <LoadingBar isLoading={isLoading} />
      <ApiKeyBanner />
      <Navbar
        onLogoClick={handleLogoClick}
        onFavoritesClick={handleFavoritesClick}
      />
      <main className={styles.layout__content}>{children}</main>
    </div>
  );
};
