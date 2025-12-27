import { Character } from "../entities/Character";
import { Comic } from "../entities/Comic";
import { CharacterId } from "../valueObjects/CharacterId";

/**
 * Pagination parameters for character queries
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Character Repository Port
 *
 * Defines the contract for character data access.
 * Infrastructure layer provides concrete implementation.
 *
 * @example
 * ```typescript
 * const repository: CharacterRepository = new ComicVineCharacterRepository();
 * const result = await repository.findMany({ limit: 50, offset: 0 });
 * ```
 */
export interface CharacterRepository {
  /**
   * Find multiple characters with pagination
   *
   * @param params - Pagination parameters
   * @returns Paginated list of characters
   * @throws {ApiError} When the API request fails
   */
  findMany(params: PaginationParams): Promise<PaginatedResult<Character>>;

  /**
   * Find a single character by ID
   *
   * @param id - Character identifier
   * @returns Character if found, null otherwise
   * @throws {ApiError} When the API request fails
   */
  findById(id: CharacterId): Promise<Character | null>;

  /**
   * Search characters by name
   *
   * @param query - What to search for (e.g., "Iron Man")
   * @param signal - Can cancel the search if needed (optional)
   * @returns List of matching characters
   */
  searchByName(query: string, signal?: AbortSignal): Promise<Character[]>;

  /**
   * Get comics by their IDs
   * Efficiently fetches multiple comics by batch querying the API with ID filters
   *
   * Recommended usage:
   * 1. Fetch character with issue_credits field
   * 2. Extract issue IDs from character.issueIds
   * 3. Batch fetch comics using this method
   *
   * @param issueIds - Array of issue/comic IDs to fetch
   * @param characterId - Character these comics belong to (for domain mapping)
   * @returns List of comics sorted by release date (newest first)
   * @throws {ApiError} When the API request fails
   */
  getComicsByIds(
    issueIds: number[],
    characterId: CharacterId,
  ): Promise<Comic[]>;
}
