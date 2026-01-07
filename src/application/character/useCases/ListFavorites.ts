import { CharacterRepository } from "@domain/character/ports/CharacterRepository";
import { FavoritesRepository } from "@domain/character/ports/FavoritesRepository";
import { Character } from "@domain/character/entities/Character";
/**
 * List Favorites Use Case
 *
 * Retrieves full character data for all favorited characters.
 * Combines favorites IDs from localStorage with character data from API.
 *
 * Business rules:
 * - Returns only characters that are currently favorited
 * - Fetches full character details from API
 * - Handles characters that may no longer exist in API
 * - Results can be empty if no favorites
 *
 * @example
 * ```typescript
 * const useCase = new ListFavorites(characterRepository, favoritesRepository);
 * const favorites = await useCase.execute();
 * console.log(favorites); // [Spider-Man, Iron Man, ...]
 * ```
 */
export class ListFavorites {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly favoritesRepository: FavoritesRepository,
  ) {}

  /**
   * Execute the use case
   *
   * @returns Array of favorited characters
   * @throws {ApiError} When the Marvel API request fails
   */
  async execute(): Promise<Character[]> {
    const favoriteIds = await this.favoritesRepository.findAll();

    if (favoriteIds.length === 0) {
      return [];
    }

    // Fetch character details for each favorite
    const characterPromises = favoriteIds.map((id) =>
      this.characterRepository.findById(id).catch(() => null),
    );

    const characters = await Promise.all(characterPromises);

    // Filter out nulls (characters that no longer exist or failed to fetch)
    return characters.filter((char): char is Character => char !== null);
  }

  /**
   * Get count of favorites without fetching full data
   *
   * @returns Number of favorited characters
   */
  async getCount(): Promise<number> {
    return await this.favoritesRepository.count();
  }
}
