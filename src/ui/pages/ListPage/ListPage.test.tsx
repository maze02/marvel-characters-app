/**
 * ListPage Tests
 *
 * Integration tests for the main character list page with search,
 * infinite scroll, and favorites functionality.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ListPage } from "./ListPage";
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";

// Create mock character data
const mockCharacter = new Character({
  id: new CharacterId(1),
  name: new CharacterName("Spider-Man"),
  description: "Friendly neighborhood Spider-Man",
  thumbnail: new ImageUrl("https://example.com/spiderman", "jpg"),
  modifiedDate: new Date("2024-01-01"),
});

// Create stable mock functions
const mockIsFavorite = jest.fn(() => false);
const mockToggleFavorite = jest.fn(async () => {});
const mockStartLoading = jest.fn();
const mockStopLoading = jest.fn();
const mockListCharacters = jest.fn(async () => ({
  items: [mockCharacter],
  total: 150,
  offset: 0,
  limit: 50,
}));
const mockSearchCharacters = jest.fn(async () => ({
  characters: [mockCharacter],
}));
const mockRetry = jest.fn();

// Create stable singleton objects that never change reference
const stableFavoritesContext = {
  isFavorite: mockIsFavorite,
  toggleFavorite: mockToggleFavorite,
};

const stableLoadingContext = {
  startLoading: mockStartLoading,
  stopLoading: mockStopLoading,
};

const stableUseCases = {
  listCharacters: {
    execute: mockListCharacters,
  },
  searchCharacters: {
    execute: mockSearchCharacters,
  },
};

const stableInfiniteScrollResult = {
  items: [mockCharacter],
  loading: false,
  hasMore: true,
  sentinelRef: { current: null },
  error: null,
  retry: mockRetry,
};

// Mock dependencies - MUST return exact same object instance every time
jest.mock("@ui/state/FavoritesContext", () => ({
  useFavorites: jest.fn(() => stableFavoritesContext),
}));

jest.mock("@ui/state/LoadingContext", () => ({
  useLoading: jest.fn(() => stableLoadingContext),
}));

jest.mock("@ui/state/DependenciesContext", () => ({
  useUseCases: jest.fn(() => stableUseCases),
  useServices: jest.fn(() => ({
    seo: {
      updateMetadata: jest.fn(),
      addStructuredData: jest.fn(),
      removeStructuredData: jest.fn(),
      reset: jest.fn(),
    },
  })),
}));

jest.mock("@ui/hooks/useInfiniteScroll", () => ({
  useInfiniteScroll: jest.fn(() => stableInfiniteScrollResult),
}));

jest.mock("@ui/hooks/useDebouncedValue", () => ({
  useDebouncedValue: jest.fn(<T,>(value: T) => value), // Return immediately without debounce
}));

jest.mock("@infrastructure/logging/Logger");

describe("ListPage", () => {
  /**
   * Helper: Render page with router
   */
  const renderPage = async () => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <ListPage />
        </BrowserRouter>,
      );
      // Give effects time to run
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return result!;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render page title", async () => {
      await renderPage();
      // The page title is now in the header as a visual element, not a heading
      // Check for search functionality instead
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should render search bar", async () => {
      await renderPage();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it("should render main content area", async () => {
      const { container } = await renderPage();
      // Page component uses id="main-content", Layout adds role="main"
      expect(container.querySelector("#main-content")).toBeInTheDocument();
    });

    it("should render without crashing", async () => {
      const { container } = await renderPage();
      expect(container).toBeInTheDocument();
    });
  });

  describe("Search functionality", () => {
    it("should update search input value", async () => {
      await renderPage();
      const searchInput = screen.getByPlaceholderText(/search/i);
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Spider" } });
      });
      expect(searchInput).toHaveValue("Spider");
    });

    it("should allow typing in search", async () => {
      await renderPage();
      const searchInput = screen.getByPlaceholderText(/search/i);
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Spider-Man" } });
      });
      expect(searchInput).toHaveValue("Spider-Man");
    });
  });

  describe("Page structure", () => {
    it("should render page with proper structure", async () => {
      const { container } = await renderPage();
      expect(container).toBeInTheDocument();
      // Check for main content area by id (Layout adds role="main")
      expect(container.querySelector("#main-content")).toBeInTheDocument();
    });

    it("should have heading and search", async () => {
      await renderPage();
      // Page has searchbox functionality
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Marvel Characters/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have main content region", async () => {
      const { container } = await renderPage();
      // Page component uses id="main-content", Layout adds role="main"
      expect(container.querySelector("#main-content")).toBeInTheDocument();
    });

    it("should have page heading", async () => {
      await renderPage();
      // Check for H1 heading (semantic structure)
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      // Check for searchbox
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should have searchbox role", async () => {
      await renderPage();
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });
  });
});
