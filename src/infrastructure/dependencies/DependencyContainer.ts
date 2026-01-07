import { CharacterRepository } from "@domain/character/ports/CharacterRepository";
import { FavoritesRepository } from "@domain/character/ports/FavoritesRepository";
import { ComicVineCharacterRepository } from "@infrastructure/repositories/ComicVineCharacterRepository";
import { LocalStorageFavoritesRepository } from "@infrastructure/repositories/LocalStorageFavoritesRepository";
import { ListCharacters } from "@application/character/useCases/ListCharacters";
import { SearchCharacters } from "@application/character/useCases/SearchCharacters";
import { GetCharacterDetail } from "@application/character/useCases/GetCharacterDetail";
import { ListCharacterComics } from "@application/character/useCases/ListCharacterComics";
import { ToggleFavorite } from "@application/character/useCases/ToggleFavorite";
import { ListFavorites } from "@application/character/useCases/ListFavorites";
import { FilterCharacters } from "@application/character/useCases/FilterCharacters";
import { SEOService } from "@application/seo/ports/SEOService";
import { BrowserSEOService } from "@infrastructure/seo/BrowserSEOService";

/**
 * Dependency Container
 *
 *  The dependency container imports the repositories i.e. that contain connections to database or apis or
 *  local storage so that access to the repositories in
 *  the infrastructure is decoupled from the ui part of the app, i.e. the state management in the context
 *  in the ui part of the app.
 *
 * Benefits:
 * - Single source of truth for dependency configuration
 * - Allows for swappable  implementations (e.g. switching from Marvel API to ComicVine API)
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

  private readonly _services: {
    seo: SEOService;
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
    favoritesRepository: FavoritesRepository,
    seoService: SEOService,
  ) {
    // Store repositories
    this._repositories = {
      character: characterRepository,
      favorites: favoritesRepository,
    };

    // Store services
    this._services = {
      seo: seoService,
    };

    // Create use cases with injected repositories
    this._useCases = {
      listCharacters: new ListCharacters(characterRepository),
      searchCharacters: new SearchCharacters(characterRepository), //Calls api to search for characters
      getCharacterDetail: new GetCharacterDetail(characterRepository),
      listCharacterComics: new ListCharacterComics(characterRepository),
      toggleFavorite: new ToggleFavorite(favoritesRepository),
      listFavorites: new ListFavorites(
        characterRepository,
        favoritesRepository,
      ),
      filterCharacters: new FilterCharacters(), //Filters characters on the page
    };
  }

  /**
   * Factory method to create a container with production dependencies
   */
  static create(): DependencyContainer {
    const characterRepository = new ComicVineCharacterRepository();
    const favoritesRepository = new LocalStorageFavoritesRepository();
    const seoService = new BrowserSEOService();

    return new DependencyContainer(
      characterRepository,
      favoritesRepository,
      seoService,
    );
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
    favoritesRepository: FavoritesRepository,
    seoService?: SEOService,
  ): DependencyContainer {
    return new DependencyContainer(
      characterRepository,
      favoritesRepository,
      seoService || new BrowserSEOService(),
    );
  }

  /**
   * Get services (infrastructure services like SEO)
   */
  get services() {
    return this._services;
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
