/**
 * ListPage Tests
 * 
 * Integration tests for the main character list page with search,
 * infinite scroll, and favorites functionality.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ListPage } from './ListPage';

// Create stable mock functions
const mockIsFavorite = jest.fn(() => false);
const mockToggleFavorite = jest.fn();
const mockStartLoading = jest.fn();
const mockStopLoading = jest.fn();
const mockListCharacters = jest.fn().mockResolvedValue({
  items: [],
  total: 150,
  offset: 0,
  limit: 50,
});
const mockSearchCharacters = jest.fn().mockResolvedValue({
  characters: [],
});
const mockRetry = jest.fn();

// Mock dependencies
jest.mock('@ui/state/FavoritesContext', () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

jest.mock('@ui/state/LoadingContext', () => ({
  useLoading: () => ({
    startLoading: mockStartLoading,
    stopLoading: mockStopLoading,
  }),
}));

jest.mock('@ui/state/DependenciesContext', () => ({
  useUseCases: () => ({
    listCharacters: {
      execute: mockListCharacters,
    },
    searchCharacters: {
      execute: mockSearchCharacters,
    },
  }),
}));

jest.mock('@ui/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({
    items: [],
    loading: false,
    hasMore: true,
    sentinelRef: { current: null },
    error: null,
    retry: mockRetry,
  }),
}));

jest.mock('@ui/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: any) => value, // Return immediately without debounce
}));

jest.mock('@infrastructure/logging/Logger');

describe('ListPage', () => {
  // Add timeout for async operations
  jest.setTimeout(10000);
  /**
   * Helper: Render page with router
   */
  const renderPage = () => {
    return render(
      <BrowserRouter>
        <ListPage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render page title', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /MARVEL CHARACTERS/i })).toBeInTheDocument();
    });

    it('should render search bar', () => {
      renderPage();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should render main content area', () => {
      renderPage();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should update search input value', () => {
      renderPage();
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Spider' } });
      expect(searchInput).toHaveValue('Spider');
    });

    it('should allow typing in search', () => {
      renderPage();
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Spider-Man' } });
      expect(searchInput).toHaveValue('Spider-Man');
    });
  });

  describe('Page structure', () => {
    it('should render page with proper structure', () => {
      const { container } = renderPage();
      expect(container).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have heading and search', () => {
      renderPage();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
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

    it('should have searchbox role', () => {
      renderPage();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
  });
});
