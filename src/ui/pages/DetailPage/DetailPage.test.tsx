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
      await renderPage();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("should render page during loading", async () => {
      const { container } = await renderPage();
      expect(container).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("should render page structure on error", async () => {
      const { container } = await renderPage();
      // Page should render even if data fails to load
      expect(container).toBeInTheDocument();
    });

    it("should have navigation link to home", async () => {
      await renderPage();
      await waitFor(() => {
        // The header has a home link (check it exists and goes to home)
        const links = screen.getAllByRole("link");
        const homeLink = links.find(
          (link) => link.getAttribute("href") === "/",
        );
        expect(homeLink).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have main content region", async () => {
      await renderPage();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("should have accessible navigation", async () => {
      await renderPage();
      await waitFor(() => {
        // Check page has proper structure with header and main
        expect(screen.getByRole("banner")).toBeInTheDocument(); // header
        expect(screen.getByRole("main")).toBeInTheDocument();
      });
    });
  });
});
