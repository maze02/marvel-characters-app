import { FavoritesRepository } from "@domain/character/ports/FavoritesRepository";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { StorageAdapter } from "../storage/StorageAdapter";
import {
  FavoritesData,
  createDefaultFavoritesData,
  validateFavoritesData,
  migrateFavoritesData,
} from "../storage/StorageSchema";
import { logger } from "@infrastructure/logging/Logger";

/**
 * LocalStorage Favorites Repository
 *
 * Implements FavoritesRepository using browser localStorage.
 * Provides safe storage with validation and migration support.
 *
 * @example
 * ```typescript
 * const repository = new LocalStorageFavoritesRepository();
 * await repository.add(new CharacterId(1011334));
 * ```
 */
export class LocalStorageFavoritesRepository implements FavoritesRepository {
  private readonly STORAGE_KEY = "marvel_favorites";
  private readonly storage: StorageAdapter;

  constructor(storage?: StorageAdapter) {
    this.storage = storage || new StorageAdapter();
  }

  async add(id: CharacterId): Promise<void> {
    const data = this.load();

    // Avoid duplicates
    if (!data.favorites.includes(id.value)) {
      data.favorites.push(id.value);
      data.lastModified = new Date().toISOString();
      this.save(data);
    }
  }

  async remove(id: CharacterId): Promise<void> {
    const data = this.load();
    data.favorites = data.favorites.filter((favId) => favId !== id.value);
    data.lastModified = new Date().toISOString();
    this.save(data);
  }

  async findAll(): Promise<CharacterId[]> {
    const data = this.load();
    return data.favorites.map((id) => new CharacterId(id));
  }

  async contains(id: CharacterId): Promise<boolean> {
    const data = this.load();
    return data.favorites.includes(id.value);
  }

  async count(): Promise<number> {
    const data = this.load();
    return data.favorites.length;
  }

  async clear(): Promise<void> {
    const data = createDefaultFavoritesData();
    this.save(data);
  }

  /**
   * Load favorites data from storage with validation
   */
  private load(): FavoritesData {
    try {
      const stored = this.storage.get<unknown>(this.STORAGE_KEY);

      if (stored === null) {
        return createDefaultFavoritesData();
      }

      // Validate structure
      if (!validateFavoritesData(stored)) {
        logger.warn("Invalid favorites data structure, resetting to default");
        return createDefaultFavoritesData();
      }

      // Migrate if needed
      return migrateFavoritesData(stored);
    } catch (error) {
      logger.error("Failed to load favorites", error);
      return createDefaultFavoritesData();
    }
  }

  /**
   * Save favorites data to storage
   */
  private save(data: FavoritesData): void {
    this.storage.set(this.STORAGE_KEY, data);
  }
}
