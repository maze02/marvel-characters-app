import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../Navbar/Navbar";
import { ApiKeyBanner } from "../ApiKeyBanner/ApiKeyBanner";
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
 * Provides consistent page structure with persistent navbar and API banner.
 * Ensures navbar remains visible during page transitions.
 */
export const Layout: React.FC<LayoutProps> = ({ children, onLogoClick }) => {
  const navigate = useNavigate();

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
      <ApiKeyBanner />
      <Navbar
        onLogoClick={handleLogoClick}
        onFavoritesClick={handleFavoritesClick}
      />
      <main className={styles.layout__content}>{children}</main>
    </div>
  );
};
