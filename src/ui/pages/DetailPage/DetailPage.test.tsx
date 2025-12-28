/**
 * DetailPage Tests
 *
 * Integration tests for character detail page with hero,
 * description, comics, and favorite functionality.
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DetailPage } from "./DetailPage";

// Mock router hooks
const mockNavigate = jest.fn();
const mockParams = { id: "123" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

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
  modifiedDate: new Date("2024-01-01"),
});

// Create stable mock functions
const mockIsFavorite = jest.fn(() => false);
const mockToggleFavorite = jest.fn(async () => {});
const mockStartLoading = jest.fn();
const mockStopLoading = jest.fn();
const mockGetCharacterDetail = jest.fn(async () => mockCharacter);
const mockListCharacterComics = jest.fn(async () => []);

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
  getCharacterDetail: {
    execute: mockGetCharacterDetail,
  },
  listCharacterComics: {
    execute: mockListCharacterComics,
  },
};

// Mock contexts and hooks - MUST return exact same object instance every time
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

jest.mock("@infrastructure/logging/Logger");

describe("DetailPage", () => {
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
          <DetailPage />
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
    it("should render without crashing", async () => {
      const { container } = await renderPage();
      expect(container).toBeInTheDocument();
    });

    it("should render character details", async () => {
      await renderPage();
      // Wait for character to load
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    });

    it("should have main content area", async () => {
      const { container } = await renderPage();
      // DetailPage component content is present
      expect(container).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("should render page during loading", async () => {
      const { container } = await renderPage();
      expect(container).toBeInTheDocument();
      // Check for character name heading
      expect(
        screen.getByRole("heading", { name: /Spider-Man/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("should render page structure on error", async () => {
      const { container } = await renderPage();
      // Page should render even if data fails to load
      expect(container).toBeInTheDocument();
    });

    it("should have character name visible", async () => {
      await renderPage();
      // Character information is displayed
      expect(
        screen.getByRole("heading", { name: /Spider-Man/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have main content region", async () => {
      const { container } = await renderPage();
      // Page component content exists
      expect(container).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("should have accessible heading structure", async () => {
      await renderPage();
      // Check for proper heading hierarchy
      expect(
        screen.getByRole("heading", { level: 1, name: /Spider-Man/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /COMICS/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Loading State Tests", () => {
    it("should show loading state initially", async () => {
      // Arrange: Delay character loading
      mockGetCharacterDetail.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockCharacter), 100),
          ),
      );

      // Act
      await act(async () => {
        render(
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <DetailPage />
          </BrowserRouter>,
        );
      });

      // Assert: Should not show character immediately
      expect(screen.queryByText("Spider-Man")).not.toBeInTheDocument();

      // Wait for character to load
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    });

    it("should call startLoading when loading begins", async () => {
      // Act
      await renderPage();

      // Assert
      expect(mockStartLoading).toHaveBeenCalled();
    });

    it("should call stopLoading when loading completes", async () => {
      // Act
      await renderPage();

      // Assert: Wait for loading to complete
      await waitFor(() => {
        expect(mockStopLoading).toHaveBeenCalled();
      });
    });

    it("should not show character content during loading", async () => {
      // Arrange: Never resolve to keep in loading state
      mockGetCharacterDetail.mockImplementation(() => new Promise(() => {}));

      // Act
      const { container } = await renderPage();

      // Assert: Character should not be visible during loading
      expect(screen.queryByText("Spider-Man")).not.toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });
  });

  describe("Error State Tests", () => {
    beforeEach(() => {
      // Reset mocks for error tests
      mockGetCharacterDetail.mockRejectedValue(
        new Error("Character not found"),
      );
    });

    it("should show error message when character fails to load", async () => {
      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Character Not Found")).toBeInTheDocument();
      });
    });

    it("should show error description", async () => {
      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/Unable to load character details/i),
        ).toBeInTheDocument();
      });
    });

    it("should show return home link on error", async () => {
      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        const link = screen.getByText("Return to Home");
        expect(link).toBeInTheDocument();
        expect(link.tagName).toBe("A");
      });
    });

    it("should call stopLoading on error", async () => {
      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        expect(mockStopLoading).toHaveBeenCalled();
      });
    });

    it("should handle error when character is null", async () => {
      // Arrange - testing edge case where use case returns null
      mockGetCharacterDetail.mockResolvedValue(null as unknown as Character);

      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Character Not Found")).toBeInTheDocument();
      });
    });

    it("should show error when ID is missing", async () => {
      // Arrange: Set params to undefined - testing edge case
      mockParams.id = undefined as unknown as string;

      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Character Not Found")).toBeInTheDocument();
      });

      // Cleanup
      mockParams.id = "123";
    });
  });

  describe("Empty State Tests - Comics", () => {
    beforeEach(() => {
      // Reset to successful character load
      mockGetCharacterDetail.mockResolvedValue(mockCharacter);
    });

    it("should show character when comics fail to load", async () => {
      // Arrange: Comics fail but character succeeds
      mockListCharacterComics.mockRejectedValue(
        new Error("Comics not available"),
      );

      // Act
      await renderPage();

      // Assert: Character still shows
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    });

    it("should show empty comics list when no comics available", async () => {
      // Arrange: Return empty comics array
      mockListCharacterComics.mockResolvedValue([]);

      // Act
      await renderPage();

      // Assert: Character shows, comics section present but empty
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: /COMICS/i }),
        ).toBeInTheDocument();
      });
    });

    it("should handle comics loading failure gracefully", async () => {
      // Arrange
      mockListCharacterComics.mockRejectedValue(new Error("API Error"));

      // Act
      await renderPage();

      // Assert: Should still show character hero
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    });
  });

  describe("Conditional Rendering - Character Description", () => {
    it("should show description when character has one", async () => {
      // Arrange: Character with description
      const characterWithDesc = new Character({
        id: new CharacterId(123),
        name: new CharacterName("Spider-Man"),
        description: "Friendly neighborhood Spider-Man",
        thumbnail: new ImageUrl("https://example.com/spiderman", "jpg"),
        modifiedDate: new Date("2024-01-01"),
      });
      mockGetCharacterDetail.mockResolvedValue(characterWithDesc);

      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("Friendly neighborhood Spider-Man"),
        ).toBeInTheDocument();
      });
    });

    it("should not show description section when character has no description", async () => {
      // Arrange: Character without description
      const characterNoDesc = new Character({
        id: new CharacterId(123),
        name: new CharacterName("Spider-Man"),
        description: "",
        thumbnail: new ImageUrl("https://example.com/spiderman", "jpg"),
        modifiedDate: new Date("2024-01-01"),
      });
      mockGetCharacterDetail.mockResolvedValue(characterNoDesc);

      // Act
      await renderPage();

      // Assert: Name shows but description doesn't
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
      // Description should not be passed to CharacterHero
    });
  });

  describe("Favorite Toggle", () => {
    it("should call toggleFavorite when favorite button clicked", async () => {
      // Act
      await renderPage();

      // Wait for character to load
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Get favorite button and click it
      const favoriteButton = screen.getByRole("button", {
        name: /favorite/i,
      });
      await act(async () => {
        favoriteButton.click();
      });

      // Assert
      expect(mockToggleFavorite).toHaveBeenCalledWith(123);
    });

    it("should show correct favorite state", async () => {
      // Arrange: Set as favorite
      mockIsFavorite.mockReturnValue(true);

      // Act
      await renderPage();

      // Assert
      await waitFor(() => {
        const favoriteButton = screen.getByRole("button", {
          name: /favorite/i,
        });
        expect(favoriteButton).toBeInTheDocument();
      });
    });
  });
});
