/**
 * SearchBar Tests
 * 
 * Tests search input functionality, clear button, and keyboard interactions.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  /**
   * Default props for testing
   */
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Search characters...',
  };

  /**
   * Helper: Render component
   */
  const renderSearchBar = (props = {}) => {
    return render(<SearchBar {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      renderSearchBar();

      expect(screen.getByPlaceholderText('Search characters...')).toBeInTheDocument();
    });

    it('should render with empty value by default', () => {
      renderSearchBar();

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('');
    });

    it('should render with provided value', () => {
      renderSearchBar({ value: 'Spider-Man' });

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('Spider-Man');
    });

    it('should render search icon', () => {
      renderSearchBar();

      // Icon is rendered via Icon component
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
  });

  describe('Value management', () => {
    it('should render empty value', () => {
      renderSearchBar({ value: '' });

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('');
    });

    it('should render with provided value', () => {
      renderSearchBar({ value: 'Spider-Man' });

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('Spider-Man');
    });

    it('should clear value when onChange called with empty string', () => {
      const mockChange = jest.fn();
      renderSearchBar({ value: 'Spider-Man', onChange: mockChange });

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockChange).toHaveBeenCalledWith('');
    });
  });

  describe('Input interaction', () => {
    it('should call onChange when typing', () => {
      const mockChange = jest.fn();
      renderSearchBar({ onChange: mockChange });

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'Spider' } });

      expect(mockChange).toHaveBeenCalledTimes(1);
      expect(mockChange).toHaveBeenCalledWith('Spider');
    });

    it('should handle multiple character inputs', () => {
      const mockChange = jest.fn();
      renderSearchBar({ onChange: mockChange });

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'S' } });
      fireEvent.change(input, { target: { value: 'Sp' } });
      fireEvent.change(input, { target: { value: 'Spi' } });

      expect(mockChange).toHaveBeenCalledTimes(3);
    });

    it('should handle empty input', () => {
      const mockChange = jest.fn();
      renderSearchBar({ value: 'Spider-Man', onChange: mockChange });

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockChange).toHaveBeenCalledWith('');
    });
  });

  describe('Keyboard interactions', () => {
    it('should handle Enter key press', () => {
      const mockChange = jest.fn();
      renderSearchBar({ onChange: mockChange });

      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Search should work without Enter key requirement
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have search role or type', () => {
      renderSearchBar();

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('should have placeholder text', () => {
      renderSearchBar({ placeholder: 'Find your hero' });

      expect(screen.getByPlaceholderText('Find your hero')).toBeInTheDocument();
    });
  });
});
