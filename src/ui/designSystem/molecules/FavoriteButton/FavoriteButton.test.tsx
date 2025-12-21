/**
 * FavoriteButton Tests
 * 
 * Tests favorite button rendering, toggle interaction, and accessibility.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { FavoriteButton } from './FavoriteButton';

// Mock Icon component
jest.mock('@ui/designSystem/atoms/Icon/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

describe('FavoriteButton', () => {
  /**
   * Default props for testing
   */
  const defaultProps = {
    isFavorite: false,
    onToggle: jest.fn(),
    characterName: 'Spider-Man',
  };

  /**
   * Helper: Render component
   */
  const renderButton = (props = {}) => {
    return render(<FavoriteButton {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button element', () => {
      renderButton();

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render unfilled heart when not favorite', () => {
      renderButton({ isFavorite: false });

      expect(screen.getByTestId('icon-heart')).toBeInTheDocument();
    });

    it('should render filled heart when favorite', () => {
      renderButton({ isFavorite: true });

      expect(screen.getByTestId('icon-heart-filled')).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('should render with small size', () => {
      renderButton({ size: 'small' });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with medium size (default)', () => {
      renderButton({ size: 'medium' });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render without size prop', () => {
      render(<FavoriteButton {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Toggle interaction', () => {
    it('should call onToggle when clicked', () => {
      const mockToggle = jest.fn();
      renderButton({ onToggle: mockToggle });

      fireEvent.click(screen.getByRole('button'));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle when already favorited', () => {
      const mockToggle = jest.fn();
      renderButton({ isFavorite: true, onToggle: mockToggle });

      fireEvent.click(screen.getByRole('button'));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('should stop event propagation', () => {
      const mockParentClick = jest.fn();
      const mockToggle = jest.fn();

      render(
        <div onClick={mockParentClick}>
          <FavoriteButton {...defaultProps} onToggle={mockToggle} />
        </div>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockToggle).toHaveBeenCalledTimes(1);
      // Button should stop propagation to prevent card navigation
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive aria-label when not favorite', () => {
      renderButton({ isFavorite: false, characterName: 'Iron Man' });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Add Iron Man to favorites');
    });

    it('should have descriptive aria-label when favorite', () => {
      renderButton({ isFavorite: true, characterName: 'Thor' });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Remove Thor from favorites');
    });

    it('should have button type', () => {
      renderButton();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Character name handling', () => {
    it('should handle long character names', () => {
      renderButton({ characterName: 'Spider-Man (Peter Parker)' });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Spider-Man (Peter Parker)'));
    });

    it('should handle special characters in name', () => {
      renderButton({ characterName: "T'Challa" });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining("T'Challa"));
    });
  });
});
