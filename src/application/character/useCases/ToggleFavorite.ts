import { FavoritesRepository } from '@domain/character/ports/FavoritesRepository';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';

/**
 * Toggle Favorite Use Case
 * 
 * Adds or removes a character from favorites.
 * Persists to localStorage for cross-session persistence.
 * 
 * Business rules:
 * - If character is favorited → remove from favorites
 * - If character is not favorited → add to favorites
 * - Updates are persisted immediately
 * - Operation is idempotent
 * 
 * @example
 * ```typescript
 * const useCase = new ToggleFavorite(favoritesRepository);
 * const newState = await useCase.execute(1011334); // Spider-Man
 * console.log(newState); // true if now favorited, false if removed
 * ```
 */
export class ToggleFavorite {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  /**
   * Execute the use case
   * 
   * @param characterId - Character ID (number)
   * @returns New favorite state (true if favorited, false if not)
   * @throws {StorageError} When localStorage operation fails
   */
  async execute(characterId: number): Promise<boolean> {
    const id = new CharacterId(characterId);
    const isFavorite = await this.favoritesRepository.contains(id);

    if (isFavorite) {
      await this.favoritesRepository.remove(id);
      return false;
    } else {
      await this.favoritesRepository.add(id);
      return true;
    }
  }
}
