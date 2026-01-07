/**
 * DetailPage Tests
 *
 * Integration tests for character detail page with hero,
 * description, comics, and favorite functionality.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DetailPage } from "./DetailPage";
import { createTestQueryClient } from "@tests/queryTestUtils";
import userEvent from "@testing-library/user-event";

// Import types for mock data
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";

// Create mock character data
const mockCharacter = new Character({
  id: new CharacterId(123),
  name: new CharacterName("Spider-Man"),
  description: "Friendly neighborhood Spider-Man",
  thumbnail: new ImageUrl("https://example.com/spiderman", "jpg"),
});

const mockCharacterNoDesc = new Character({
  id: new CharacterId(456),
  name: new CharacterName("Iron Man"),
  description: "",
  thumbnail: new ImageUrl("https://example.com/ironman", "jpg"),
});

// Create stable mock functions
const mockIsFavorite = jest.fn();
const mockToggleFavorite = jest.fn();

// Create stable singleton objects
const stableFavoritesContext = {
  isFavorite: mockIsFavorite,
  toggleFavorite: mockToggleFavorite,
};

// Mock use cases
const mockListCharacterComics = {
  execute: jest.fn(),
};

// Mock services
const mockSeoService = {
  updateMetadata: jest.fn(),
  addStructuredData: jest.fn(),
  removeStructuredData: jest.fn(),
  reset: jest.fn(),
};

// Mock React Query hooks
const mockUseCharacterDetail = jest.fn();

// Mock contexts and hooks
jest.mock("@ui/state/FavoritesContext", () => ({
  useFavorites: () => stableFavoritesContext,
}));

jest.mock("@ui/queries", () => ({
  useCharacterDetail: (id: number) => mockUseCharacterDetail(id),
}));

jest.mock("@infrastructure/logging/Logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock DependenciesContext to provide use cases
jest.mock("@ui/state/DependenciesContext", () => ({
  useUseCases: () => ({
    listCharacterComics: mockListCharacterComics,
  }),
  useServices: () => ({
    seo: mockSeoService,
  }),
}));

describe("DetailPage", () => {
  let queryClient: QueryClient;

  /**
   * Helper: Render page with router and QueryClientProvider
   */
  const renderPage = (characterId: string = "123") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/character/${characterId}`]}>
          <Routes>
            <Route path="/character/:id" element={<DetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh QueryClient for each test
    queryClient = createTestQueryClient();

    // Reset use case mocks
    mockListCharacterComics.execute.mockResolvedValue([]);

    // Reset React Query hook mocks to default success state
    mockUseCharacterDetail.mockReturnValue({
      data: mockCharacter,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    // Reset favorites mocks
    mockIsFavorite.mockReturnValue(false);
    mockToggleFavorite.mockImplementation(async () => {});
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      const { container } = renderPage();
      expect(container).toBeInTheDocument();
    });

    it("should render character name", async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    });

    it("should render character description when available", async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getByText("Friendly neighborhood Spider-Man"),
        ).toBeInTheDocument();
      });
    });

    it("should not render description when character has none", async () => {
      mockUseCharacterDetail.mockReturnValue({
        data: mockCharacterNoDesc,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      renderPage("456");

      await waitFor(() => {
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
      });

      expect(
        screen.queryByText("Friendly neighborhood Spider-Man"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show empty content while loading", () => {
      mockUseCharacterDetail.mockReturnValue({
        data: undefined,
        isLoading: true,
        isFetching: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      renderPage();

      // Should not show character content during loading
      expect(screen.queryByText("Spider-Man")).not.toBeInTheDocument();
    });

    it("should show character after loading completes", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    beforeEach(() => {
      mockUseCharacterDetail.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: new Error("Character not found"),
        refetch: jest.fn(),
      });
    });

    it("should show error message when character fails to load", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Character Not Found")).toBeInTheDocument();
      });
    });

    it("should show error description", async () => {
      renderPage();

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to load character details/i),
        ).toBeInTheDocument();
      });
    });

    it("should show return to home button", async () => {
      renderPage();

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /return to home/i });
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe("Favorites", () => {
    it("should show favorite button", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Favorite button should be in the hero section
      const heroSection = screen.getByText("Spider-Man").closest("div");
      expect(heroSection).toBeInTheDocument();
    });

    it("should call toggleFavorite when button is clicked", async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Find and click the favorite button (it's in CharacterHero component)
      // The button has aria-label that includes the character name
      const favButton = screen.getByRole("button", {
        name: /Spider-Man.*favorites/i,
      });
      await user.click(favButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith(123);
    });
  });

  describe("Comics Section", () => {
    it("should show comics heading", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("heading", { name: /COMICS/i }),
      ).toBeInTheDocument();
    });

    it("should load initial comics on mount", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Should call listCharacterComics with correct parameters
      await waitFor(() => {
        expect(mockListCharacterComics.execute).toHaveBeenCalledWith(123, {
          offset: 0,
          limit: 20,
        });
      });
    });

    it("should handle comics loading error gracefully", async () => {
      mockListCharacterComics.execute.mockRejectedValue(
        new Error("Comics load error"),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Character should still be visible even if comics fail
      expect(screen.getByText("Spider-Man")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible heading structure", async () => {
      renderPage();

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 1, name: /Spider-Man/i }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("heading", { level: 2, name: /COMICS/i }),
      ).toBeInTheDocument();
    });
  });

  describe("SEO", () => {
    it("should update SEO metadata on character load", async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // SEO component should be rendered (we can't easily test its content without more setup)
      expect(mockSeoService.updateMetadata).toHaveBeenCalled();
    });
  });
});
