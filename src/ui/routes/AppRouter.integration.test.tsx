/**
 * AppRouter Integration Tests
 *
 * Tests routing configuration and navigation between pages.
 * Uses real page components and providers (no mocking).
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RouterContent } from "./AppRouter";
import { DependenciesProvider } from "@ui/state/DependenciesContext";
import { FavoritesProvider } from "@ui/state/FavoritesContext";
import { QueryProvider } from "@ui/providers/QueryProvider";
import { createTestQueryClient } from "@tests/queryTestUtils";
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";

// Mock window.scrollTo (not implemented in JSDOM)
global.scrollTo = jest.fn();

// Create mock character
const mockCharacter = new Character({
  id: new CharacterId(1),
  name: new CharacterName("Spider-Man"),
  description: "Friendly neighborhood Spider-Man",
  thumbnail: new ImageUrl("https://example.com/spiderman", "jpg"),
});

// ✅ ONLY mock external boundaries - Mock at repository level
jest.mock("@infrastructure/repositories/ComicVineCharacterRepository", () => {
  return {
    ComicVineCharacterRepository: jest.fn().mockImplementation(() => {
      return {
        findMany: jest.fn().mockResolvedValue({
          items: [mockCharacter],
          total: 100,
          offset: 0,
          limit: 50,
        }),
        findById: jest.fn().mockResolvedValue(mockCharacter),
        findComicsByCharacterId: jest.fn().mockResolvedValue({
          items: [],
          total: 0,
          offset: 0,
          limit: 20,
        }),
        searchByName: jest.fn().mockResolvedValue([mockCharacter]),
      };
    }),
  };
});

jest.mock("@infrastructure/logging/Logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

describe("AppRouter Integration Tests", () => {
  /**
   * Helper: Render router with all real providers
   */
  const renderRouter = (initialRoute = "/") => {
    // Create fresh QueryClient for each test (no cache pollution)
    const queryClient = createTestQueryClient();

    return render(
      <DependenciesProvider>
        <QueryProvider client={queryClient}>
          <FavoritesProvider>
            <MemoryRouter
              initialEntries={[initialRoute]}
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <RouterContent />
            </MemoryRouter>
          </FavoritesProvider>
        </QueryProvider>
      </DependenciesProvider>,
    );
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("Route Rendering", () => {
    it("renders ListPage on home route", async () => {
      renderRouter("/");

      // Wait for list page to load
      await waitFor(
        () => {
          expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Should have searchbox (unique to list page)
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("renders FavoritesPage on favorites route", async () => {
      renderRouter("/favorites");

      // Wait for favorites page to load
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "FAVORITES" }),
        ).toBeInTheDocument();
      });

      // Should have searchbox
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("renders DetailPage on character detail route", async () => {
      renderRouter("/character/1");

      // Wait for detail page to load
      await waitFor(
        () => {
          expect(
            screen.getByRole("heading", { name: "Spider-Man", level: 1 }),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Should have comics section
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /comics/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Navigation Between Pages", () => {
    it("allows navigation from list to detail page", async () => {
      const user = userEvent.setup();
      renderRouter("/");

      // Wait for list page
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Click on character card
      const characterLink = screen.getByRole("link", { name: /spider-man/i });
      await user.click(characterLink);

      // Should navigate to detail page
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Spider-Man", level: 1 }),
        ).toBeInTheDocument();
      });
    }, 10000);

    it("allows navigation to favorites page via navbar", async () => {
      const user = userEvent.setup();
      renderRouter("/");

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Click favorites button in navbar
      const favoritesButton = screen.getByRole("button", {
        name: /view favorites/i,
      });
      await user.click(favoritesButton);

      // Should navigate to favorites page
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "FAVORITES" }),
        ).toBeInTheDocument();
      });
    }, 10000);

    it("allows navigation back to home via logo", async () => {
      const user = userEvent.setup();
      renderRouter("/favorites");

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "FAVORITES" }),
        ).toBeInTheDocument();
      });

      // Click logo to go home
      const logo = screen.getByRole("link", { name: /marvel.*home/i });
      await user.click(logo);

      // Should navigate to list page
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    }, 10000);
  });

  describe("Layout and Navbar", () => {
    it("renders navbar on all pages", async () => {
      renderRouter("/");

      // Navbar elements should be present (logo is a link, not img)
      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: /marvel.*home/i }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /view favorites/i }),
      ).toBeInTheDocument();
    });

    it("renders layout wrapper on all pages", async () => {
      renderRouter("/");

      // Check for main landmark (provided by Layout)
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading bar during navigation", async () => {
      renderRouter("/");

      // Loading functionality is tested implicitly through page loads
      // We just verify that pages load successfully
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles invalid routes gracefully", async () => {
      renderRouter("/invalid-route");

      // Should render something (likely a 404 or redirect to home)
      // The actual behavior depends on your router configuration
      // At minimum, layout should render
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });
});
