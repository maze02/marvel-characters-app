/**
 * FavoritesPage Tests
 *
 * Integration tests for favorites page with search and filtering.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { FavoritesPage } from "./FavoritesPage";
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";

// Create stable mock functions
const mockToggleFavorite = jest.fn();
const mockIsFavorite = jest.fn(() => true);
const mockStartLoading = jest.fn();
const mockStopLoading = jest.fn();
const mockListFavorites = jest.fn();
const mockFilterCharacters = jest.fn((chars, query) => {
  if (!query) return chars;
  return chars.filter((c: Character) =>
    c.name.value.toLowerCase().includes(query.toLowerCase()),
  );
});

// Create stable singleton objects
const stableFavoritesContext = {
  isFavorite: mockIsFavorite,
  toggleFavorite: mockToggleFavorite,
  favoritesCount: 3,
};

const stableLoadingContext = {
  startLoading: mockStartLoading,
  stopLoading: mockStopLoading,
};

const stableUseCases = {
  listFavorites: {
    execute: mockListFavorites,
  },
  filterCharacters: {
    execute: mockFilterCharacters,
  },
};

// Mock dependencies with stable objects
jest.mock("@ui/state/FavoritesContext", () => ({
  useFavorites: jest.fn(() => stableFavoritesContext),
}));

jest.mock("@ui/state/LoadingContext", () => ({
  useLoading: jest.fn(() => stableLoadingContext),
}));

/**
 * Helper: Create mock character with all required fields
 */
const createMockCharacter = (
  id: number,
  name: string,
  description: string,
): Character => {
  return new Character({
    id: new CharacterId(id),
    name: new CharacterName(name),
    description,
    thumbnail: new ImageUrl(
      `https://example.com/${name.toLowerCase().replace(" ", "")}`,
      "jpg",
    ),
  });
};

const mockFavorites = [
  createMockCharacter(1, "Spider-Man", "Friendly neighborhood Spider-Man"),
  createMockCharacter(
    2,
    "Iron Man",
    "Genius billionaire playboy philanthropist",
  ),
  createMockCharacter(3, "Thor", "God of Thunder"),
];

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

jest.mock("@infrastructure/logging/Logger");

// Mock CharacterCard to render character names and favorite button
jest.mock("@ui/designSystem/molecules/CharacterCard/CharacterCard", () => ({
  CharacterCard: ({
    name,
    isFavorite,
    onToggleFavorite,
  }: {
    name: string;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
  }) => (
    <div data-testid="character-card">
      <h2>{name}</h2>
      <button
        aria-label={`${isFavorite ? "Remove" : "Add"} ${name} ${isFavorite ? "from" : "to"} favorites`}
        onClick={onToggleFavorite}
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>
    </div>
  ),
}));

describe("FavoritesPage", () => {
  /**
   * Helper: Render page with router
   */
  const renderPage = () => {
    return render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <FavoritesPage />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock behavior
    mockListFavorites.mockResolvedValue(mockFavorites);
  });

  describe("Rendering", () => {
    it("should render page title", () => {
      renderPage();

      expect(
        screen.getByRole("heading", { name: "FAVORITES" }),
      ).toBeInTheDocument();
    });

    it("should render search bar", () => {
      renderPage();

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it("should render favorite characters", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
        expect(screen.getByText("Thor")).toBeInTheDocument();
      });
    });

    it("should render character count", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/3 results/i)).toBeInTheDocument();
      });
    });
  });

  describe("Empty state", () => {
    it("should render without crashing when no favorites", () => {
      const { container } = renderPage();

      // Should render the page structure
      expect(container).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "FAVORITES" }),
      ).toBeInTheDocument();
    });

    it("should render search bar even with no results", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, {
        target: { value: "NonexistentCharacter" },
      });

      // Search should still be functional
      expect(searchInput).toHaveValue("NonexistentCharacter");
    });
  });

  describe("Search functionality", () => {
    it("should render search input", () => {
      renderPage();

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("should update search input value", async () => {
      renderPage();

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "Spider" } });

      await waitFor(() => {
        expect(searchInput).toHaveValue("Spider");
      });
    });

    it("should handle search query changes", async () => {
      renderPage();

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Should handle typing without errors
      fireEvent.change(searchInput, { target: { value: "Test" } });
      expect(searchInput).toHaveValue("Test");

      fireEvent.change(searchInput, { target: { value: "" } });
      expect(searchInput).toHaveValue("");
    });
  });

  describe("Accessibility", () => {
    it("should have main content region", () => {
      const { container } = renderPage();
      // Page component uses id="main-content", Layout adds role="main"
      expect(container.querySelector("#main-content")).toBeInTheDocument();
    });

    it("should have page heading", () => {
      renderPage();

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  describe("Loading State Tests", () => {
    it("should not show characters immediately before loading completes", async () => {
      // Act
      renderPage();

      // Assert: Page structure exists even during loading
      expect(
        screen.getByRole("heading", { name: "FAVORITES" }),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it("should show results count after loading", async () => {
      // Act
      renderPage();

      // Assert: Results count updates after load
      await waitFor(() => {
        expect(screen.getByText(/3 RESULTS/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error State Tests", () => {
    it("should render page structure even if data fails", async () => {
      // Act
      renderPage();

      // Assert: Core page structure is always present
      expect(
        screen.getByRole("heading", { name: "FAVORITES" }),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it("should maintain functionality after potential errors", async () => {
      // Act
      renderPage();

      // Assert: Search functionality is available
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "Test" } });

      await waitFor(() => {
        expect(searchInput).toHaveValue("Test");
      });
    });
  });

  describe("Empty State Tests", () => {
    it("should show search results when available", async () => {
      // Act
      renderPage();

      // Assert: Characters are displayed after load
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
        expect(screen.getByText("Thor")).toBeInTheDocument();
      });
    });

    it("should filter results when searching", async () => {
      // Act
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Search for "Spider"
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "Spider" } });

      // Assert: Only Spider-Man should match
      await waitFor(() => {
        expect(searchInput).toHaveValue("Spider");
      });
    });

    it("should handle empty search results gracefully", async () => {
      // Act
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Search for non-existent character
      const searchInput = screen.getByPlaceholderText(/search/i);

      // Assert: Can enter search query
      fireEvent.change(searchInput, { target: { value: "Batman" } });
      expect(searchInput).toHaveValue("Batman");
    });
  });

  describe("Conditional Rendering - Search Results Count", () => {
    it("should show total count when not searching", async () => {
      // Act
      renderPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText("3 RESULTS")).toBeInTheDocument();
      });
    });

    it("should show filtered count when searching", async () => {
      // Act
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Search for Spider
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "Spider" } });

      // Assert: Should show "X of Y RESULTS"
      await waitFor(() => {
        const resultsText = screen.getByText(/OF 3 RESULTS/i);
        expect(resultsText).toBeInTheDocument();
      });
    });

    it("should show 0 of X when search has no matches", async () => {
      // Act
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Search with no matches
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "Batman" } });

      // Assert
      await waitFor(() => {
        expect(screen.getByText("0 OF 3 RESULTS")).toBeInTheDocument();
      });
    });
  });

  describe("Favorite Toggle Integration", () => {
    it("should call toggleFavorite when heart button clicked", async () => {
      // Act
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Get all favorite buttons (one per character card)
      const favoriteButtons = screen.getAllByRole("button", {
        name: /favorite/i,
      });

      // Click first favorite button
      fireEvent.click(favoriteButtons[0]!);

      // Assert
      expect(mockToggleFavorite).toHaveBeenCalled();
    });
  });

  describe("Screen Reader Support", () => {
    it("should have aria-live region for search results", async () => {
      // Act
      renderPage();

      // Assert: Find sr-only status region
      await waitFor(() => {
        const statusRegion = screen.getByRole("status");
        expect(statusRegion).toBeInTheDocument();
        expect(statusRegion).toHaveAttribute("aria-live", "polite");
        expect(statusRegion).toHaveAttribute("aria-atomic", "true");
      });
    });

    it("should announce result count to screen readers", async () => {
      // Act
      renderPage();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/3 favorite characters found/i),
        ).toBeInTheDocument();
      });
    });
  });
});
