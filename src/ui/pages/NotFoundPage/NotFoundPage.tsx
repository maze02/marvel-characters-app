import React from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@ui/components/SEO";
import { Button } from "@ui/designSystem/atoms/Button/Button";
import { Link } from "@ui/designSystem/atoms/Link/Link";
import { config } from "@infrastructure/config/env";
import { routes } from "@ui/routes/routes";
import styles from "./NotFoundPage.module.scss";

/**
 * Not Found Page (404)
 *
 * Displays a user-friendly 404 error page when users navigate to non-existent routes.
 *
 * Features:
 * - Navigation options back to main pages
 * - Proper SEO metadata (noindex to prevent indexing 404 pages)
 * - Accessible with keyboard navigation
 *
 * Technical Implementation:
 * - Static page (no API calls or use cases needed)
 * - SEO configured to prevent search engine indexing
 */

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(routes.home);
  };

  const handleGoBack = () => {
    //Go back in history, or home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(routes.home);
    }
  };

  return (
    <>
      <SEO
        title="Page Not Found (404) - Marvel Characters"
        description="The page you're looking for doesn't exist. Browse Marvel characters, heroes, and superheroes instead."
        image={`${config.appUrl}/marvel-logo.png`}
        type="website"
        canonicalUrl={`${config.appUrl}/404`}
      />
      <main className={styles.notFoundPage} id="main-content">
        <div className={styles.notFoundPage__content}>
          {/* Error Code */}
          <h1 className={styles.notFoundPage__code} aria-label="Error 404">
            404
          </h1>

          {/* Main Message*/}
          <h2 className={styles.notFoundPage__title}>Page Not Found</h2>

          {/* Description */}
          <p className={styles.notFoundPage__description}>
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className={styles.notFoundPage__actions}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGoHome}
              aria-label="Go to home page"
            >
              Go to Home
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleGoBack}
              aria-label="Go back to previous page"
            >
              Go Back
            </Button>
          </div>

          {/* Helpful Links */}
          <div className={styles.notFoundPage__links}>
            <p className={styles.notFoundPage__linksTitle}>
              You might be looking for:
            </p>
            <nav
              aria-label="Helpful navigation links"
              className={styles.notFoundPage__nav}
            >
              <Link to={routes.home} variant="primary">
                Browse All Characters
              </Link>
              <Link to={routes.favorites} variant="primary">
                View Your Favorites
              </Link>
            </nav>
          </div>
        </div>
      </main>
    </>
  );
};
