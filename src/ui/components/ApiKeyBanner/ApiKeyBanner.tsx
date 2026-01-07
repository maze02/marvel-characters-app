import React, { useState } from "react";
import { config } from "@infrastructure/config/env";
import styles from "./ApiKeyBanner.module.scss";

/**
 * API Key Banner Component
 *
 * Shows a dismissible banner when API keys are not configured.
 */
export const ApiKeyBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (config.isConfigured || dismissed) {
    return null;
  }

  return (
    <div className={styles.banner} role="alert">
      <div className={styles.content}>
        <span className={styles.icon}>⚠️</span>
        <p className={styles.message}>
          Comic Vine API key not configured. Using demo mode with empty states.{" "}
          <a
            href="https://comicvine.gamespot.com/api/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API key
          </a>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className={styles.closeButton}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};
