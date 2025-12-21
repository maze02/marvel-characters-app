import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { FavoritesRepository } from '@domain/character/ports/FavoritesRepository';
import { ComicVineCharacterRepository } from '@infrastructure/repositories/ComicVineCharacterRepository';
import { LocalStorageFavoritesRepository } from '@infrastructure/repositories/LocalStorageFavoritesRepository';
import { ListCharacters } from '@application/character/useCases/ListCharacters';
import { SearchCharacters } from '@application/character/useCases/SearchCharacters';
import { GetCharacterDetail } from '@application/character/useCases/GetCharacterDetail';
import { ListCharacterComics } from '@application/character/useCases/ListCharacterComics';
import { ToggleFavorite } from '@application/character/useCases/ToggleFavorite';
import { ListFavorites } from '@application/character/useCases/ListFavorites';
import { FilterCharacters } from '@application/character/useCases/FilterCharacters';

/**
 * Dependency Container
 * 
 * Centralized factory for creating and managing application dependencies.
 * Implements the Dependency Injection pattern to decouple components from concrete implementations.
 * 
 * Benefits:
 * - Single source of truth for dependency configuration
 * - Easy to swap implementations (e.g., for testing or different APIs)
 * - Follows Dependency Inversion Principle
 * - Simplifies testing by allowing mock injection
 * 
 * @example
 * ```typescript
 * const container = DependencyContainer.create();
 * const characters = await container.useCases.listCharacters.execute({ limit: 50 });
 * ```
 */
export class DependencyContainer {
  private readonly _repositories: {
    character: CharacterRepository;
    favorites: FavoritesRepository;
  };

  private readonly _useCases: {
    listCharacters: ListCharacters;
    searchCharacters: SearchCharacters;
    getCharacterDetail: GetCharacterDetail;
    listCharacterComics: ListCharacterComics;
    toggleFavorite: ToggleFavorite;
    listFavorites: ListFavorites;
    filterCharacters: FilterCharacters;
  };

  private constructor(
    characterRepository: CharacterRepository,
    favoritesRepository: FavoritesRepository
  ) {
    // Store repositories
    this._repositories = {
      character: characterRepository,
      favorites: favoritesRepository,
    };

    // Create use cases with injected repositories
    this._useCases = {
      listCharacters: new ListCharacters(characterRepository),
      searchCharacters: new SearchCharacters(characterRepository),
      getCharacterDetail: new GetCharacterDetail(characterRepository),
      listCharacterComics: new ListCharacterComics(characterRepository),
      toggleFavorite: new ToggleFavorite(favoritesRepository),
      listFavorites: new ListFavorites(characterRepository, favoritesRepository),
      filterCharacters: new FilterCharacters(),
    };
  }

  /**
   * Factory method to create a container with production dependencies
   */
  static create(): DependencyContainer {
    const characterRepository = new ComicVineCharacterRepository();
    const favoritesRepository = new LocalStorageFavoritesRepository();
    
    return new DependencyContainer(characterRepository, favoritesRepository);
  }

  /**
   * Factory method for testing - allows custom repository implementations
   * 
   * @example
   * ```typescript
   * const mockCharacterRepo = new MockCharacterRepository();
   * const mockFavoritesRepo = new MockFavoritesRepository();
   * const container = DependencyContainer.createForTesting(mockCharacterRepo, mockFavoritesRepo);
   * ```
   */
  static createForTesting(
    characterRepository: CharacterRepository,
    favoritesRepository: FavoritesRepository
  ): DependencyContainer {
    return new DependencyContainer(characterRepository, favoritesRepository);
  }

  /**
   * Get all use cases
   */
  get useCases() {
    return this._useCases;
  }

  /**
   * Get all repositories (useful for testing or advanced scenarios)
   */
  get repositories() {
    return this._repositories;
  }
}
