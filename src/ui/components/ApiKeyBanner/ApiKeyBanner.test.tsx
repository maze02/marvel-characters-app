/**
 * ApiKeyBanner Tests
 * 
 * Tests API key configuration warning banner with dismiss functionality.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ApiKeyBanner } from './ApiKeyBanner';

// Mock config
jest.mock('@infrastructure/config/env', () => ({
  config: {
    isConfigured: false,
  },
}));

describe('ApiKeyBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render banner when API not configured', () => {
      render(<ApiKeyBanner />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render warning message', () => {
      render(<ApiKeyBanner />);

      expect(screen.getByText(/Comic Vine API key not configured/i)).toBeInTheDocument();
    });

    it('should render warning icon', () => {
      render(<ApiKeyBanner />);

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should render API key link', () => {
      render(<ApiKeyBanner />);

      const link = screen.getByRole('link', { name: /get api key/i });
      expect(link).toHaveAttribute('href', 'https://comicvine.gamespot.com/api/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render dismiss button', () => {
      render(<ApiKeyBanner />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe('Dismiss functionality', () => {
    it('should hide banner when dismiss button clicked', () => {
      render(<ApiKeyBanner />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not render when dismissed', () => {
      const { rerender } = render(<ApiKeyBanner />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
      rerender(<ApiKeyBanner />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Conditional rendering', () => {
    it('should not render when API is configured', () => {
      const { config } = require('@infrastructure/config/env');
      config.isConfigured = true;

      render(<ApiKeyBanner />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should render when API is not configured', () => {
      const { config } = require('@infrastructure/config/env');
      config.isConfigured = false;

      render(<ApiKeyBanner />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have alert role for screen readers', () => {
      render(<ApiKeyBanner />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have descriptive aria-label for dismiss button', () => {
      render(<ApiKeyBanner />);

      const button = screen.getByRole('button', { name: 'Dismiss' });
      expect(button).toBeInTheDocument();
    });
  });
});
