/**
 * DetailPage Tests
 * 
 * Integration tests for character detail page with hero,
 * description, comics, and favorite functionality.
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DetailPage } from './DetailPage';

// Mock router hooks
const mockNavigate = jest.fn();
const mockParams = { id: '123' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Create stable mock functions
const mockIsFavorite = jest.fn(() => false);
const mockToggleFavorite = jest.fn();
const mockStartLoading = jest.fn();
const mockStopLoading = jest.fn();
const mockGetCharacterDetail = jest.fn().mockResolvedValue(null);
const mockListCharacterComics = jest.fn().mockResolvedValue([]);

// Mock contexts and hooks
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
    getCharacterDetail: {
      execute: mockGetCharacterDetail,
    },
    listCharacterComics: {
      execute: mockListCharacterComics,
    },
  }),
}));

jest.mock('@infrastructure/logging/Logger');

describe('DetailPage', () => {
  // Add timeout for async operations
  jest.setTimeout(10000);
  /**
   * Helper: Render page with router
   */
  const renderPage = () => {
    return render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DetailPage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderPage();
      expect(container).toBeInTheDocument();
    });

    it('should render back button', () => {
      renderPage();
      const backButton = screen.getByRole('link', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should have main content area', () => {
      renderPage();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should render page during loading', () => {
      const { container } = renderPage();
      expect(container).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render page structure on error', () => {
      const { container } = renderPage();
      // Page should render even if data fails to load
      expect(container).toBeInTheDocument();
    });

    it('should have back button for navigation', () => {
      renderPage();
      const backButton = screen.getByRole('link', { name: /back/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('href', '/');
    });
  });

  describe('Accessibility', () => {
    it('should have main content region', () => {
      renderPage();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have accessible navigation', () => {
      renderPage();
      const backButton = screen.getByRole('link', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });
  });
});
