import React from 'react';
import { config } from '@infrastructure/config/env';
import styles from './ConfigWarning.module.scss';

/**
 * Configuration Warning Component
 * 
 * Shows a helpful message when Marvel API keys are not configured.
 */
export const ConfigWarning: React.FC = () => {
  if (config.isConfigured) {
    return null;
  }

  return (
    <div className={styles.warning}>
      <div className={styles.content}>
        <h1>⚠️ Marvel API Keys Required</h1>
        <p>
          To use this application, you need to configure your Marvel API keys.
        </p>
        <ol className={styles.steps}>
          <li>
            Go to{' '}
            <a
              href="https://developer.marvel.com/account"
              target="_blank"
              rel="noopener noreferrer"
            >
              Marvel Developer Portal
            </a>{' '}
            and get your API keys
          </li>
          <li>
            Open the <code>.env</code> file in the project root
          </li>
          <li>
            Replace <code>your_public_key_here</code> and{' '}
            <code>your_private_key_here</code> with your actual keys
          </li>
          <li>Save the file and refresh this page</li>
        </ol>
        <div className={styles.example}>
          <p>Your .env file should look like:</p>
          <pre>
            VITE_MARVEL_PUBLIC_KEY=abc123...{'\n'}
            VITE_MARVEL_PRIVATE_KEY=xyz789...{'\n'}
            VITE_API_BASE_URL=https://gateway.marvel.com/v1/public
          </pre>
        </div>
      </div>
    </div>
  );
};
