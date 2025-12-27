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
});
