import React from "react";
import styles from "./LoadingBar.module.scss";

export interface LoadingBarProps {
  /** Whether the loading bar is visible and animating */
  isLoading: boolean;
}

/**
 * LoadingBar Component
 *
 * A thin red progress bar that appears at the top of the viewport during navigation/loading.
 * Animates from left to right with a smooth indeterminate progress animation.
 *
 * Features:
 * - Marvel red (#EC1D24) color
 * - Smooth CSS animation
 * - Automatically hides when loading completes
 * - Accessible with aria-live announcements
 */
export const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <>
      <div
        className={styles.loadingBar}
        role="progressbar"
        aria-label="Loading content"
        aria-busy="true"
      >
        <div className={styles.loadingBar__progress} />
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.loadingBar__srOnly}
      >
        Loading content
      </div>
    </>
  );
};
