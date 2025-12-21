import { Character } from '../entities/Character';
import { Comic } from '../entities/Comic';
import { CharacterId } from '../valueObjects/CharacterId';

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
   * Uses API's nameStartsWith parameter for efficiency
   * 
   * @param query - Search query (name prefix)
   * @returns List of matching characters
   * @throws {ApiError} When the API request fails
   */
  searchByName(query: string): Promise<Character[]>;

  /**
   * Get comics for a specific character
   * 
   * @param characterId - Character identifier
   * @param limit - Maximum number of comics to return
   * @returns List of comics featuring the character
   * @throws {ApiError} When the API request fails
   */
  getComics(characterId: CharacterId, limit: number): Promise<Comic[]>;
}
