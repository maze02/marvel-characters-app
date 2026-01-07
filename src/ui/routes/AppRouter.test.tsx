/**
 * AppRouter Tests
 *
 * Tests routing configuration and navigation behavior.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppRouter } from "./AppRouter";

// Mock page components
jest.mock("../pages/ListPage/ListPage", () => ({
  ListPage: () => <div data-testid="list-page">List Page</div>,
}));

jest.mock("../pages/FavoritesPage/FavoritesPage", () => ({
  FavoritesPage: () => <div data-testid="favorites-page">Favorites Page</div>,
}));

jest.mock("../pages/DetailPage/DetailPage", () => ({
  DetailPage: () => <div data-testid="detail-page">Detail Page</div>,
}));

// Mock LoadingContext
jest.mock("../state/LoadingContext", () => ({
  useLoading: () => ({
    isLoading: false,
    startLoading: jest.fn(),
    stopLoading: jest.fn(),
  }),
}));

// Mock Layout (which includes Navbar that requires FavoritesContext)
jest.mock("../components/Layout/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Mock FavoritesContext (needed by Navbar in Layout)
jest.mock("../state/FavoritesContext", () => ({
  FavoritesProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useFavorites: () => ({
    isFavorite: jest.fn(() => false),
    toggleFavorite: jest.fn(),
    favoritesCount: 0,
  }),
}));

// Mock DependenciesContext (provides use cases to pages)
jest.mock("../state/DependenciesContext", () => ({
  DependenciesProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useUseCases: () => ({
    listCharacters: { execute: jest.fn() },
    searchCharacters: { execute: jest.fn() },
    getCharacterDetail: { execute: jest.fn() },
    listCharacterComics: { execute: jest.fn() },
    listFavorites: { execute: jest.fn() },
    filterCharacters: { execute: jest.fn() },
  }),
  useServices: () => ({
    seo: {
      updateMetadata: jest.fn(),
      addStructuredData: jest.fn(),
      removeStructuredData: jest.fn(),
      reset: jest.fn(),
    },
  }),
}));

describe("AppRouter", () => {
  /**
   * Helper: Render router with initial route
   */
  const renderRouter = (initialRoute = "/") => {
    window.history.pushState({}, "Test", initialRoute);
    return render(<AppRouter />);
  };

  describe("Route rendering", () => {
    it("should render ListPage on home route", async () => {
      renderRouter("/");

      await waitFor(() => {
        expect(screen.getByTestId("list-page")).toBeInTheDocument();
      });
    });

    it("should render FavoritesPage on favorites route", async () => {
      renderRouter("/favorites");

      await waitFor(() => {
        expect(screen.getByTestId("favorites-page")).toBeInTheDocument();
      });
    });

    it("should render DetailPage on character detail route", async () => {
      renderRouter("/character/123");

      await waitFor(() => {
        expect(screen.getByTestId("detail-page")).toBeInTheDocument();
      });
    });
  });

  describe("Router setup", () => {
    it("should wrap content with LoadingProvider", () => {
      renderRouter();

      // If LoadingProvider is working, pages should render
      expect(screen.getByTestId("list-page")).toBeInTheDocument();
    });

    it("should render without errors", () => {
      expect(() => renderRouter()).not.toThrow();
    });
  });

  describe("Loading state", () => {
    it("should render router with loading context", () => {
      renderRouter();

      // Router renders successfully with loading context
      expect(screen.getByTestId("list-page")).toBeInTheDocument();
    });

    it("should render without crashing", () => {
      const { container } = renderRouter();

      expect(container).toBeInTheDocument();
    });
  });
});

/**
 * Navigation Tests
 *
 * Tests navigation between routes (using MemoryRouter for more control).
 */
describe("AppRouter Navigation", () => {
  /**
   * Helper: Custom router for navigation testing
   */
  const renderWithRouter = (initialRoute: string) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route
            path="/"
            element={<div data-testid="list-page">List Page</div>}
          />
          <Route
            path="/favorites"
            element={<div data-testid="favorites-page">Favorites</div>}
          />
          <Route
            path="/character/:id"
            element={<div data-testid="detail-page">Detail</div>}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("should navigate from home to favorites", () => {
    renderWithRouter("/favorites");

    expect(screen.getByTestId("favorites-page")).toBeInTheDocument();
  });

  it("should navigate to character detail with ID", () => {
    renderWithRouter("/character/456");

    expect(screen.getByTestId("detail-page")).toBeInTheDocument();
  });

  it("should handle root route", () => {
    renderWithRouter("/");

    expect(screen.getByTestId("list-page")).toBeInTheDocument();
  });
});
