/**
 * CharacterDescription Tests
 * 
 * Tests description rendering, text truncation, and expand/collapse functionality.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterDescription } from './CharacterDescription';

describe('CharacterDescription', () => {
  /**
   * Default props for testing
   */
  const defaultProps = {
    description: 'Spider-Man is a superhero created by Stan Lee.',
    characterName: 'Spider-Man',
  };

  /**
   * Helper: Render component
   */
  const renderDescription = (props = {}) => {
    return render(<CharacterDescription {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render description text', () => {
      renderDescription();

      expect(screen.getByText('Spider-Man is a superhero created by Stan Lee.')).toBeInTheDocument();
    });

    it('should render as paragraph element', () => {
      const { container } = renderDescription();

      expect(container.querySelector('p')).toBeInTheDocument();
    });
  });

  describe('Text truncation', () => {
    it('should show Read more button for long descriptions', () => {
      // Mock scrollHeight > clientHeight
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        value: 300,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 100,
      });

      renderDescription({ description: 'Very long description that will be truncated...' });

      expect(screen.getByRole('button', { name: /Read more/i })).toBeInTheDocument();
    });

    it('should not show Read more button for short descriptions', () => {
      // Mock scrollHeight == clientHeight
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        value: 100,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 100,
      });

      renderDescription({ description: 'Short description' });

      expect(screen.queryByRole('button', { name: /Read more/i })).not.toBeInTheDocument();
    });
  });

  describe('Expand/collapse functionality', () => {
    beforeEach(() => {
      // Mock truncated text
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        value: 300,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 100,
      });
    });

    it('should expand description when Read more clicked', () => {
      renderDescription();

      const button = screen.getByRole('button', { name: /Read more/i });
      fireEvent.click(button);

      expect(screen.getByRole('button', { name: /Show less/i })).toBeInTheDocument();
    });

    it('should collapse description when Show less clicked', () => {
      renderDescription();

      const readMoreButton = screen.getByRole('button', { name: /Read more/i });
      fireEvent.click(readMoreButton);

      const showLessButton = screen.getByRole('button', { name: /Show less/i });
      fireEvent.click(showLessButton);

      expect(screen.getByRole('button', { name: /Read more/i })).toBeInTheDocument();
    });

    it('should toggle between expanded and collapsed states', () => {
      renderDescription();

      const button = screen.getByRole('button');
      
      // First click - expand
      fireEvent.click(button);
      expect(screen.getByText(/Show less/i)).toBeInTheDocument();
      
      // Second click - collapse
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText(/Read more/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        value: 300,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 100,
      });
    });

    it('should have descriptive aria-label when collapsed', () => {
      renderDescription({ characterName: 'Iron Man' });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Read more about Iron Man');
    });

    it('should have descriptive aria-label when expanded', () => {
      renderDescription({ characterName: 'Thor' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-label', 'Show less about Thor');
    });

    it('should have aria-expanded attribute', () => {
      renderDescription();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have button type', () => {
      renderDescription();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
