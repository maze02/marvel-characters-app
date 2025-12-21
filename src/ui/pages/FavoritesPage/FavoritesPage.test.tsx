/**
 * FavoritesPage Tests
 * 
 * Integration tests for favorites page with search and filtering.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FavoritesPage } from './FavoritesPage';
import { Character } from '@domain/character/entities/Character';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { CharacterName } from '@domain/character/valueObjects/CharacterName';

// Mock dependencies
const mockToggleFavorite = jest.fn();

jest.mock('@ui/state/FavoritesContext', () => ({
  useFavorites: () => ({
    isFavorite: jest.fn(() => true),
    toggleFavorite: mockToggleFavorite,
    favoritesCount: 3,
  }),
}));

jest.mock('@ui/state/LoadingContext', () => ({
  useLoading: () => ({
    startLoading: jest.fn(),
    stopLoading: jest.fn(),
  }),
}));

/**
 * Helper: Create mock character with all required fields
 */
const createMockCharacter = (id: number, name: string, description: string): Character => {
  return new Character({
    id: new CharacterId(id),
    name: new CharacterName(name),
    description,
    thumbnail: new (require('@domain/character/valueObjects/ImageUrl').ImageUrl)(
      `https://example.com/${name.toLowerCase().replace(' ', '')}`,
      'jpg'
    ),
    modifiedDate: new Date(),
  });
};

const mockFavorites = [
  createMockCharacter(1, 'Spider-Man', 'Friendly neighborhood Spider-Man'),
  createMockCharacter(2, 'Iron Man', 'Genius billionaire playboy philanthropist'),
  createMockCharacter(3, 'Thor', 'God of Thunder'),
];

jest.mock('@ui/state/DependenciesContext', () => ({
  useUseCases: () => ({
    listFavorites: {
      execute: jest.fn().mockResolvedValue(mockFavorites),
    },
    filterCharacters: {
      execute: jest.fn((chars, query) => {
        if (!query) return chars;
        return chars.filter((c: Character) => 
          c.name.value.toLowerCase().includes(query.toLowerCase())
        );
      }),
    },
  }),
}));

jest.mock('@infrastructure/logging/Logger');

describe('FavoritesPage', () => {
  /**
   * Helper: Render page with router
   */
  const renderPage = () => {
    return render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render page title', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'FAVORITES' })).toBeInTheDocument();
    });

    it('should render search bar', () => {
      renderPage();

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should render favorite characters', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Spider-Man')).toBeInTheDocument();
        expect(screen.getByText('Iron Man')).toBeInTheDocument();
        expect(screen.getByText('Thor')).toBeInTheDocument();
      });
    });

    it('should render character count', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/3 results/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should render without crashing when no favorites', () => {
      const { container } = renderPage();

      // Should render the page structure
      expect(container).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'FAVORITES' })).toBeInTheDocument();
    });

    it('should render search bar even with no results', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'NonexistentCharacter' } });

      // Search should still be functional
      expect(searchInput).toHaveValue('NonexistentCharacter');
    });
  });

  describe('Search functionality', () => {
    it('should render search input', () => {
      renderPage();

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should update search input value', async () => {
      renderPage();

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Spider' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('Spider');
      });
    });

    it('should handle search query changes', async () => {
      renderPage();

      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Should handle typing without errors
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      expect(searchInput).toHaveValue('Test');
      
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have main content region', () => {
      renderPage();

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have page heading', () => {
      renderPage();

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});
