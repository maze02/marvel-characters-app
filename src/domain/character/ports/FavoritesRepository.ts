import { CharacterId } from '../valueObjects/CharacterId';

/**
 * Favorites Repository Port
 * 
 * Defines the contract for managing favorite characters.
 * Infrastructure layer provides concrete implementation (e.g., LocalStorage).
 * 
 * @example
 * ```typescript
 * const repository: FavoritesRepository = new LocalStorageFavoritesRepository();
 * await repository.add(new CharacterId(1011334)); // Add Spider-Man
 * const isFavorite = await repository.contains(new CharacterId(1011334));
 * ```
 */
export interface FavoritesRepository {
  /**
   * Add a character to favorites
   * 
   * @param id - Character identifier
   * @throws {StorageError} When storage operation fails
   */
  add(id: CharacterId): Promise<void>;

  /**
   * Remove a character from favorites
   * 
   * @param id - Character identifier
   * @throws {StorageError} When storage operation fails
   */
  remove(id: CharacterId): Promise<void>;

  /**
   * Get all favorite character IDs
   * 
   * @returns List of favorite character IDs
   * @throws {StorageError} When storage operation fails
   */
  findAll(): Promise<CharacterId[]>;

  /**
   * Check if a character is in favorites
   * 
   * @param id - Character identifier
   * @returns true if character is favorited, false otherwise
   * @throws {StorageError} When storage operation fails
   */
  contains(id: CharacterId): Promise<boolean>;

  /**
   * Get the count of favorited characters
   * 
   * @returns Number of favorites
   */
  count(): Promise<number>;

  /**
   * Clear all favorites
   * 
   * @throws {StorageError} When storage operation fails
   */
  clear(): Promise<void>;
}
