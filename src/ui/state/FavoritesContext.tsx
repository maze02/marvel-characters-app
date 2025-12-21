import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { LocalStorageFavoritesRepository } from '@infrastructure/repositories/LocalStorageFavoritesRepository';
import { ToggleFavorite } from '@application/character/useCases/ToggleFavorite';
import { ListFavorites } from '@application/character/useCases/ListFavorites';
import { ComicVineCharacterRepository } from '@infrastructure/repositories/ComicVineCharacterRepository';
import { Character } from '@domain/character/entities/Character';
import { logger } from '@infrastructure/logging/Logger';

interface FavoritesContextValue {
  favoritesCount: number;
  isFavorite: (characterId: number) => boolean;
  toggleFavorite: (characterId: number) => Promise<void>;
  refreshCount: () => Promise<void>;
  getFavoriteCharacters: (characters: Character[]) => Character[];
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

/**
 * Favorites Provider
 * 
 * Manages favorite characters state and persistence.
 * Uses Comic Vine API for character data.
 */
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Initialize repositories and use cases
  const favoritesRepository = useMemo(() => new LocalStorageFavoritesRepository(), []);
  const characterRepository = useMemo(() => new ComicVineCharacterRepository(), []);
  const toggleFavoriteUseCase = useMemo(
    () => new ToggleFavorite(favoritesRepository),
    [favoritesRepository]
  );
  const listFavoritesUseCase = useMemo(
    () => new ListFavorites(characterRepository, favoritesRepository),
    [characterRepository, favoritesRepository]
  );

  // Load favorites count on mount
  const refreshCount = useCallback(async () => {
    try {
      const count = await listFavoritesUseCase.getCount();
      setFavoritesCount(count);
      
      // Load favorite IDs
      const ids = await favoritesRepository.findAll();
      setFavoriteIds(new Set(ids.map((id) => id.value)));
    } catch (error) {
      logger.error('Failed to load favorites count', error);
    }
  }, [listFavoritesUseCase, favoritesRepository]);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  const isFavorite = useCallback(
    (characterId: number) => favoriteIds.has(characterId),
    [favoriteIds]
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
        logger.error('Failed to toggle favorite', error, { characterId });
      }
    },
    [toggleFavoriteUseCase]
  );

  /**
   * Filter characters array to only favorites
   */
  const getFavoriteCharacters = useCallback(
    (characters: Character[]) => {
      return characters.filter(char => favoriteIds.has(char.id.value));
    },
    [favoriteIds]
  );

  const value = useMemo(
    () => ({
      favoritesCount,
      isFavorite,
      toggleFavorite,
      refreshCount,
      getFavoriteCharacters,
    }),
    [favoritesCount, isFavorite, toggleFavorite, refreshCount, getFavoriteCharacters]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

/**
 * Hook to access favorites context
 */
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
