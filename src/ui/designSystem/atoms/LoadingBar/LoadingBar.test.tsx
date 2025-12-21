/**
 * LoadingBar Tests
 * 
 * Tests loading bar visibility and accessibility.
 */

import { render, screen } from '@testing-library/react';
import { LoadingBar } from './LoadingBar';

describe('LoadingBar', () => {
  describe('Rendering', () => {
    it('should render when isLoading is true', () => {
      render(<LoadingBar isLoading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not render when isLoading is false', () => {
      render(<LoadingBar isLoading={false} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should render loading status message', () => {
      render(<LoadingBar isLoading={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render progress bar with correct ARIA attributes', () => {
      render(<LoadingBar isLoading={true} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Loading content');
      expect(progressBar).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Conditional visibility', () => {
    it('should show loading bar during loading', () => {
      render(<LoadingBar isLoading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should hide loading bar when not loading', () => {
      render(<LoadingBar isLoading={false} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should toggle visibility based on isLoading prop', () => {
      const { rerender } = render(<LoadingBar isLoading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(<LoadingBar isLoading={false} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have progressbar role', () => {
      render(<LoadingBar isLoading={true} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<LoadingBar isLoading={true} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should have aria-busy attribute', () => {
      render(<LoadingBar isLoading={true} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-busy', 'true');
    });

    it('should have live region for screen readers', () => {
      render(<LoadingBar isLoading={true} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce loading status', () => {
      render(<LoadingBar isLoading={true} />);

      expect(screen.getByText('Loading content')).toBeInTheDocument();
    });
  });

  describe('Visual structure', () => {
    it('should render with correct structure when loading', () => {
      render(<LoadingBar isLoading={true} />);

      // Check that progressbar and status elements exist
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have nested structure with progress element', () => {
      render(<LoadingBar isLoading={true} />);

      const progressBar = screen.getByRole('progressbar');
      // Progress bar should have a child div for animation
      expect(progressBar.children.length).toBeGreaterThan(0);
    });
  });
});
