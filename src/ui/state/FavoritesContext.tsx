import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Character } from "@domain/character/entities/Character";
import { logger } from "@infrastructure/logging/Logger";
import { useDependencyContainer } from "./DependenciesContext";

interface FavoritesContextValue {
  favoritesCount: number;
  isFavorite: (characterId: number) => boolean;
  toggleFavorite: (characterId: number) => Promise<void>;
  refreshCount: () => Promise<void>;
  getFavoriteCharacters: (characters: Character[]) => Character[];
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

/**
 * Favorites Provider
 *
 * Manages favorite characters state and persistence.
 *
 */
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Inject dependencies from shared container (Dependency Injection)
  // This ensures we use the SAME repository instances with SHARED cache
  const container = useDependencyContainer();
  const { repositories, useCases } = container;

  // Access use cases from shared container (no local instantiation)
  const toggleFavoriteUseCase = useCases.toggleFavorite;
  const listFavoritesUseCase = useCases.listFavorites;
  const favoritesRepository = repositories.favorites;

  // Load favorites count on mount
  const refreshCount = useCallback(async () => {
    try {
      const count = await listFavoritesUseCase.getCount();
      setFavoritesCount(count);

      // Load favorite IDs
      const ids = await favoritesRepository.findAll();
      setFavoriteIds(new Set(ids.map((id) => id.value)));
    } catch (error) {
      logger.error("Failed to load favorites count", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  const isFavorite = useCallback(
    (characterId: number) => favoriteIds.has(characterId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (characterId: number) => {
      try {
        const newState = await toggleFavoriteUseCase.execute(characterId);

        // Update local state
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (newState) {
            next.add(characterId);
          } else {
            next.delete(characterId);
          }
          return next;
        });

        setFavoritesCount((prev) => (newState ? prev + 1 : prev - 1));
      } catch (error) {
        logger.error("Failed to toggle favorite", error, { characterId });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * Filter characters array to only favorites
   */
  const getFavoriteCharacters = useCallback(
    (characters: Character[]) => {
      return characters.filter((char) => favoriteIds.has(char.id.value));
    },
    [favoriteIds],
  );

  const value = useMemo(
    () => ({
      favoritesCount,
      isFavorite,
      toggleFavorite,
      refreshCount,
      getFavoriteCharacters,
    }),
    [
      favoritesCount,
      isFavorite,
      toggleFavorite,
      refreshCount,
      getFavoriteCharacters,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

/**
 * Hook to access favorites context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
