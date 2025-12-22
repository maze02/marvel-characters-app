/**
 * Logo Tests
 * 
 * Tests Marvel logo rendering, navigation, and click handling.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Logo } from './Logo';

describe('Logo', () => {
  /**
   * Helper: Render component with router
   */
  const renderLogo = (props = {}) => {
    return render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Logo {...props} />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render logo as link', () => {
      renderLogo();

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should render SVG logo', () => {
      const { container } = renderLogo();

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct SVG dimensions', () => {
      const { container } = renderLogo();

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '130');
      expect(svg).toHaveAttribute('height', '52');
    });
  });

  describe('Navigation', () => {
    it('should link to home page', () => {
      renderLogo();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/');
    });

    it('should call onClick when clicked', () => {
      const mockClick = jest.fn();
      renderLogo({ onClick: mockClick });

      fireEvent.click(screen.getByRole('link'));

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should render without onClick handler', () => {
      renderLogo();

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive aria-label', () => {
      renderLogo();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Marvel - Go to home');
    });

    it('should be keyboard accessible', () => {
      renderLogo();

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
    });
  });

  describe('Visual structure', () => {
    it('should render Marvel branding colors', () => {
      const { container } = renderLogo();

      const svg = container.querySelector('svg');
      const svgContent = svg?.innerHTML || '';
      
      // Check for Marvel red color (#EC1D24)
      expect(svgContent).toContain('#EC1D24');
      // Check for white color (#FEFEFE)
      expect(svgContent).toContain('#FEFEFE');
    });

    it('should render complete SVG structure', () => {
      const { container } = renderLogo();

      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });
  });
});
