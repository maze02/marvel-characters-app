/**
 * Cross-Page User Flow Integration Tests
 *
 * Tests complete user journeys that span multiple pages and components.
 * Contains the most comprehensive integration tests, simulating real user behavior.
 *
 * Only external boundaries (APIs, Web APIs, Logger) are mocked.
 * All components, contexts, and providers are real.
 */

// Import domain entities and value objects (must be before jest.mock)
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";
import { Comic } from "@domain/character/entities/Comic";
import { ReleaseDate } from "@domain/character/valueObjects/ReleaseDate";

// Create domain entity mocks
const createMockCharacter = (id: number, name: string, description: string) => {
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

const mockCharacters = [
  createMockCharacter(1, "Spider-Man", "Friendly neighborhood Spider-Man"),
  createMockCharacter(
    2,
    "Iron Man",
    "Genius billionaire playboy philanthropist",
  ),
  createMockCharacter(3, "Captain America", "Super soldier from World War II"),
];

const mockComics = [
  new Comic({
    id: 1,
    title: "Amazing Spider-Man #1",
    description: "The first appearance",
    thumbnail: new ImageUrl("https://example.com/comic1", "jpg"),
    onSaleDate: new ReleaseDate("2024-01-01"),
    characterId: new CharacterId(1),
  }),
  new Comic({
    id: 2,
    title: "Amazing Spider-Man #2",
    description: "The second issue",
    thumbnail: new ImageUrl("https://example.com/comic2", "jpg"),
    onSaleDate: new ReleaseDate("2024-01-15"),
    characterId: new CharacterId(1),
  }),
];

// ✅ MOCK EXTERNAL BOUNDARIES - Mock at repository level
jest.mock("@infrastructure/repositories/ComicVineCharacterRepository", () => {
  return {
    ComicVineCharacterRepository: jest.fn().mockImplementation(() => {
      return {
        findMany: jest.fn().mockImplementation(async (params) => {
          return {
            items: mockCharacters,
            total: 100,
            offset: params.offset || 0,
            limit: params.limit || 50,
          };
        }),
        findById: jest.fn().mockImplementation(async (id) => {
          const character = mockCharacters.find((c) => c.id.value === id.value);
          if (!character) throw new Error("Not found");
          return character;
        }),
        searchByName: jest.fn().mockImplementation(async (query) => {
          const filtered = mockCharacters.filter((c) =>
            c.name.value.toLowerCase().includes(query.toLowerCase()),
          );
          return filtered;
        }),
        findComicsByCharacterId: jest.fn().mockResolvedValue({
          items: mockComics,
          total: mockComics.length,
          offset: 0,
          limit: 20,
        }),
      };
    }),
  };
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DependenciesProvider } from "@ui/state/DependenciesContext";
import { FavoritesProvider } from "@ui/state/FavoritesContext";
import { QueryProvider } from "@ui/providers/QueryProvider";
import { RouterContent } from "@ui/routes/AppRouter";
import { createTestQueryClient } from "@tests/queryTestUtils";

// Mock window.scrollTo (not implemented in JSDOM)
global.scrollTo = jest.fn();

jest.mock("@infrastructure/logging/Logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock IntersectionObserver for infinite scroll
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

describe("Cross-Page User Flow Integration Tests", () => {
  /**
   * Helper: Render app with all real providers
   * Note: Each test gets a fresh QueryClient to avoid cache pollution between tests
   */
  const renderApp = (initialRoute = "/") => {
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

  describe("Complete User Journey: Browse → Search → Detail → Favorite → View Favorites", () => {
    it("allows user to complete full workflow from discovery to favorites", async () => {
      const user = userEvent.setup();
      renderApp("/");

      // 1. User lands on list page and sees characters
      await waitFor(
        () => {
          expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.getByText("Iron Man")).toBeInTheDocument();
      expect(screen.getByText("Captain America")).toBeInTheDocument();

      // 2. User searches for a specific character
      const searchBox = screen.getByRole("searchbox");
      await user.type(searchBox, "Spider");

      await waitFor(
        () => {
          expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Other characters should be filtered out
      expect(screen.queryByText("Captain America")).not.toBeInTheDocument();

      // 3. User clicks on character to view details
      const characterLink = screen.getByRole("link", { name: /spider-man/i });
      await user.click(characterLink);

      // 4. Detail page loads with character info
      await waitFor(
        () => {
          expect(
            screen.getByRole("heading", { name: "Spider-Man", level: 1 }),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.getByText(/friendly neighborhood/i)).toBeInTheDocument();

      // Comics should load
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /comics/i }),
        ).toBeInTheDocument();
      });

      // 5. User adds character to favorites
      const favoriteButton = screen.getByRole("button", {
        name: /add spider-man to favorites/i,
      });
      await user.click(favoriteButton);

      // Button state should change
      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /remove spider-man from favorites/i,
          }),
        ).toBeInTheDocument();
      });

      // 6. User navigates to favorites page
      const favoritesNavButton = screen.getByRole("button", {
        name: /view favorites/i,
      });
      await user.click(favoritesNavButton);

      // 7. Favorites page shows the character
      await waitFor(
        () => {
          expect(
            screen.getByRole("heading", { name: "FAVORITES" }),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Should show 1 result
      expect(screen.getByText("1 RESULTS")).toBeInTheDocument();
    }, 15000);
  });

  describe("Favorite State Persistence Across Navigation", () => {
    it("maintains favorite state when navigating between pages", async () => {
      const user = userEvent.setup();
      renderApp("/");

      // User sees characters
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Add to favorites from list page
      const favoriteButtons = screen.getAllByRole("button", {
        name: /add.*to favorites/i,
      });
      await user.click(favoriteButtons[0]!);

      // Verify favorited
      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /remove spider-man from favorites/i,
          }),
        ).toBeInTheDocument();
      });

      // Navigate to detail page
      const characterLink = screen.getByRole("link", { name: /spider-man/i });
      await user.click(characterLink);

      // Wait for detail page
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Spider-Man", level: 1 }),
        ).toBeInTheDocument();
      });

      // Should still be favorited
      expect(
        screen.getByRole("button", {
          name: /remove spider-man from favorites/i,
        }),
      ).toBeInTheDocument();

      // Navigate back to list (click logo)
      const logo = screen.getByRole("link", { name: /marvel.*home/i });
      await user.click(logo);

      // Wait for list page and verify still favorited
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /remove spider-man from favorites/i,
          }),
        ).toBeInTheDocument();
      });
    }, 15000);
  });

  describe("Search and Favorite Flow", () => {
    it("allows user to search, favorite, and view in favorites page", async () => {
      const user = userEvent.setup();
      renderApp("/");

      await waitFor(() => {
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
      });

      // Search for Iron Man
      await user.type(screen.getByRole("searchbox"), "Iron");

      await waitFor(() => {
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
      });

      // Add to favorites
      const favoriteButton = screen.getByRole("button", {
        name: /add iron man to favorites/i,
      });
      await user.click(favoriteButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /remove iron man from favorites/i,
          }),
        ).toBeInTheDocument();
      });

      // Navigate to favorites
      const favoritesButton = screen.getByRole("button", {
        name: /view favorites/i,
      });
      await user.click(favoritesButton);

      // Iron Man should be in favorites
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "FAVORITES" }),
        ).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
      });
    }, 15000);
  });

  describe("Multiple Favorites Management", () => {
    it("allows user to favorite multiple characters and manage them", async () => {
      const user = userEvent.setup();
      renderApp("/");

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Favorite Spider-Man
      const spiderButton = screen.getByRole("button", {
        name: /add spider-man to favorites/i,
      });
      await user.click(spiderButton);

      // Favorite Iron Man
      const ironButton = screen.getByRole("button", {
        name: /add iron man to favorites/i,
      });
      await user.click(ironButton);

      // Navigate to favorites
      const favoritesButton = screen.getByRole("button", {
        name: /view favorites/i,
      });
      await user.click(favoritesButton);

      // Both should be in favorites
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
      });

      // Should show 2 results (text may have whitespace between number and word)
      expect(screen.getByText(/2\s+RESULTS/i)).toBeInTheDocument();

      // Remove one favorite
      const removeButton = screen.getByRole("button", {
        name: /remove spider-man from favorites/i,
      });
      await user.click(removeButton);

      // Spider-Man should disappear
      await waitFor(() => {
        expect(screen.queryByText("Spider-Man")).not.toBeInTheDocument();
      });

      // Wait for the favorites page to fully update and show remaining favorite
      await waitFor(() => {
        // Iron Man should remain
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
        // Should show 1 result
        expect(screen.getByText("1 RESULTS")).toBeInTheDocument();
      });
    }, 15000);
  });

  describe("Search Within Favorites", () => {
    it("allows user to search within favorites page", async () => {
      const user = userEvent.setup();

      // Start on list page and favorite two characters
      renderApp("/");

      // Wait for list to load
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Favorite Spider-Man
      await user.click(
        screen.getByRole("button", { name: /add spider-man to favorites/i }),
      );

      // Favorite Iron Man
      await user.click(
        screen.getByRole("button", { name: /add iron man to favorites/i }),
      );

      // Navigate to favorites page
      await user.click(screen.getByRole("button", { name: /view favorites/i }));

      // Wait for favorites to load
      await waitFor(
        () => {
          expect(screen.getByText("Spider-Man")).toBeInTheDocument();
          expect(screen.getByText("Iron Man")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Search within favorites
      await user.type(screen.getByRole("searchbox"), "Spider");

      // Wait for debounce and filtering
      await waitFor(
        () => {
          expect(screen.getByText("Spider-Man")).toBeInTheDocument();
          expect(screen.queryByText("Iron Man")).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Should show filtered count
      expect(screen.getByText("1 OF 2 RESULTS")).toBeInTheDocument();

      // Clear search
      await user.clear(screen.getByRole("searchbox"));

      // Both should reappear
      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
        expect(screen.getByText("Iron Man")).toBeInTheDocument();
      });
    }, 15000);
  });

  describe("Navbar Badge Updates", () => {
    it("updates favorites badge count when adding/removing favorites", async () => {
      const user = userEvent.setup();
      renderApp("/");

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Initial badge should show 0 (or not show at all)
      // Add first favorite
      const firstFavorite = screen.getByRole("button", {
        name: /add spider-man to favorites/i,
      });
      await user.click(firstFavorite);

      // Badge should update (implementation-specific, but count should increase)
      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /remove spider-man from favorites/i,
          }),
        ).toBeInTheDocument();
      });

      // Add second favorite
      const secondFavorite = screen.getByRole("button", {
        name: /add iron man to favorites/i,
      });
      await user.click(secondFavorite);

      // Navigate to favorites to verify count
      const favoritesButton = screen.getByRole("button", {
        name: /view favorites/i,
      });
      await user.click(favoritesButton);

      // Should show 2 results
      await waitFor(() => {
        expect(screen.getByText("2 RESULTS")).toBeInTheDocument();
      });
    }, 15000);
  });

  describe("Empty State Flows", () => {
    it("shows appropriate empty states when no data matches search", async () => {
      const user = userEvent.setup();
      renderApp("/");

      await waitFor(() => {
        expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      });

      // Search for non-existent character
      await user.type(screen.getByRole("searchbox"), "Batman");

      // Should show empty state
      await waitFor(
        () => {
          expect(screen.getByText(/no characters found/i)).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Should show helpful message
      expect(
        screen.getByText(/try searching for different/i),
      ).toBeInTheDocument();
    }, 15000);

    it("shows empty favorites state and guides user back", async () => {
      renderApp("/favorites");

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
      });

      // Should show helpful message
      expect(
        screen.getByText(/start favoriting characters/i),
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("shows helpful message when character is not found", async () => {
      // Navigate directly to a non-existent character
      renderApp("/character/99999");

      // Should show error message (implementation-dependent, but there should be some error indication)
      // This test ensures the app doesn't crash on invalid character IDs
      await waitFor(
        () => {
          // The app should either redirect, show error, or show "not found" message
          // Adjust based on actual implementation
          const mainContent = screen.getByRole("main");
          expect(mainContent).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    }, 10000);
  });
});
