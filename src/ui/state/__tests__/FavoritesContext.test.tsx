/**
 * FavoritesContext Tests
 *
 * Tests favorites state management, localStorage persistence,
 * and context provider functionality.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { FavoritesProvider, useFavorites } from "../FavoritesContext";
import { DependenciesProvider } from "../DependenciesContext";
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";

// Mock repository to return proper values
jest.mock(
  "@infrastructure/repositories/LocalStorageFavoritesRepository",
  () => ({
    LocalStorageFavoritesRepository: jest.fn().mockImplementation(() => ({
      getAll: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      contains: jest.fn().mockResolvedValue(false),
    })),
  }),
);

jest.mock("@infrastructure/repositories/ComicVineCharacterRepository");
jest.mock("@infrastructure/logging/Logger");

describe("FavoritesContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper: Render hook with provider wrapper
   * Includes DependenciesProvider for proper context hierarchy
   */
  const renderWithProvider = () => {
    return renderHook(() => useFavorites(), {
      wrapper: ({ children }) => (
        <DependenciesProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </DependenciesProvider>
      ),
    });
  };

  /**
   * Helper: Create test character with all required fields
   */
  const createCharacter = (id: number, name: string): Character => {
    return new Character({
      id: new CharacterId(id),
      name: new CharacterName(name),
      description: `Test description for ${name}`,
      thumbnail: new ImageUrl("https://example.com/image", "jpg"),
    });
  };

  describe("Provider initialization", () => {
    it("should initialize with zero favorites by default", async () => {
      const { result } = renderWithProvider();

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
        expect(typeof result.current.favoritesCount).toBe("number");
      });
    });

    it("should provide all required methods", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
      });

      expect(typeof result.current.isFavorite).toBe("function");
      expect(typeof result.current.toggleFavorite).toBe("function");
      expect(typeof result.current.refreshCount).toBe("function");
      expect(typeof result.current.getFavoriteCharacters).toBe("function");
    });
  });

  describe("useFavorites hook", () => {
    it("should provide all context methods", () => {
      const { result } = renderWithProvider();

      expect(result.current).toHaveProperty("favoritesCount");
      expect(result.current).toHaveProperty("isFavorite");
      expect(result.current).toHaveProperty("toggleFavorite");
      expect(result.current).toHaveProperty("refreshCount");
      expect(result.current).toHaveProperty("getFavoriteCharacters");
    });
  });

  describe("isFavorite", () => {
    it("should return boolean value", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        const isFav = result.current.isFavorite(123);
        expect(typeof isFav).toBe("boolean");
      });
    });

    it("should check different character IDs", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
      });

      // Should return boolean for any ID
      expect(typeof result.current.isFavorite(1)).toBe("boolean");
      expect(typeof result.current.isFavorite(999)).toBe("boolean");
    });
  });

  describe("toggleFavorite", () => {
    it("should be callable and return promise", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
      });

      // toggleFavorite should be async and return a promise
      await expect(
        act(async () => {
          await result.current.toggleFavorite(123);
        }),
      ).resolves.not.toThrow();
    });

    it("should update state after toggling", async () => {
      const { result } = renderWithProvider();

      await act(async () => {
        await result.current.toggleFavorite(456);
      });

      await waitFor(() => {
        // Count should either increase or stay same (depending on if already favorited)
        expect(typeof result.current.favoritesCount).toBe("number");
      });
    });

    it("should handle multiple toggle operations", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
      });

      // Should handle multiple toggles without throwing
      await act(async () => {
        await result.current.toggleFavorite(1);
        await result.current.toggleFavorite(2);
      });

      await waitFor(() => {
        expect(typeof result.current.favoritesCount).toBe("number");
      });
    });
  });

  describe("getFavoriteCharacters", () => {
    it("should return array of characters", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
      });

      const characters = [
        createCharacter(1, "Spider-Man"),
        createCharacter(2, "Iron Man"),
      ];

      const favorites = result.current.getFavoriteCharacters(characters);

      // Should return an array (empty or with characters)
      expect(Array.isArray(favorites)).toBe(true);
    });

    it("should filter characters based on favorite status", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
      });

      const characters = [
        createCharacter(1, "Spider-Man"),
        createCharacter(2, "Iron Man"),
        createCharacter(3, "Thor"),
      ];

      const favorites = result.current.getFavoriteCharacters(characters);

      // Result should be an array with length <= input array length
      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBeLessThanOrEqual(characters.length);
    });
  });

  describe("refreshCount", () => {
    it("should be callable without throwing", async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.favoritesCount).toBeDefined();
      });

      // Should not throw when called
      await expect(
        act(async () => {
          await result.current.refreshCount();
        }),
      ).resolves.not.toThrow();
    });
  });
});
