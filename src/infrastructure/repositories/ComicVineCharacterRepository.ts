import {
  CharacterRepository,
  PaginationParams,
  PaginatedResult,
} from '@domain/character/ports/CharacterRepository';
import { Character } from '@domain/character/entities/Character';
import { Comic } from '@domain/character/entities/Comic';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { ComicVineApiClient } from '../http/ComicVineApiClient';
import {
  ComicVineApiResponse,
  ComicVineCharacterResponse,
  ComicVineSingleCharacterResponse,
} from '@application/character/dtos/ComicVineCharacterDTO';
import { ComicVineIssuesApiResponse } from '@application/character/dtos/ComicVineComicDTO';
import { ComicVineCharacterMapper } from '@application/character/mappers/ComicVineCharacterMapper';
import { ComicVineComicMapper } from '@application/character/mappers/ComicVineComicMapper';
import { API } from '@config/constants';
import { logger } from '@infrastructure/logging/Logger';

/**
 * Comic Vine Character Repository
 * 
 * Implements CharacterRepository port using Comic Vine API.
 * Handles API communication, response mapping, and error handling for Comic Vine.
 * 
 * Features:
 * - Fetches only Marvel characters (publisher ID = 31)
 * - Pagination support
 * - Name-based search filtering
 * - Character-specific comics retrieval
 * - Response caching via API client
 * 
 * @example
 * ```typescript
 * const repository = new ComicVineCharacterRepository();
 * const characters = await repository.findMany({ limit: 50, offset: 0 });
 * ```
 */
export class ComicVineCharacterRepository implements CharacterRepository {
  private readonly apiClient: ComicVineApiClient;
  private readonly MARVEL_PUBLISHER_ID = 31;

  constructor(apiClient?: ComicVineApiClient) {
    this.apiClient = apiClient || new ComicVineApiClient();
  }

  /**
   * Find multiple characters with pagination
   * Filters to Marvel characters only (publisher:31)
   * 
   * @param params - Pagination parameters (limit, offset)
   * @returns Paginated list of Marvel characters
   * @throws {ApiError} When the API request fails
   */
  async findMany(params: PaginationParams): Promise<PaginatedResult<Character>> {
    try {
      const response = await this.apiClient.get<ComicVineApiResponse<ComicVineCharacterResponse>>(
        '/characters/',
        {
          filter: `publisher:${this.MARVEL_PUBLISHER_ID}`,
          limit: params.limit,
          offset: params.offset,
        },
        {
          useCache: true,
        }
      );

      const characters = ComicVineCharacterMapper.toDomainList(response.results);

      return {
        items: characters,
        total: response.number_of_total_results,
        offset: params.offset,
        limit: params.limit,
      };
    } catch (error) {
      logger.error('Failed to fetch characters', error, { limit: params.limit, offset: params.offset });
      throw error;
    }
  }

  /**
   * Find a single character by ID
   * 
   * Comic Vine uses format: /character/4005-{id}/
   * 
   * @param id - Character identifier
   * @returns Character if found, null if not found
   * @throws {ApiError} When the API request fails
   */
  async findById(id: CharacterId): Promise<Character | null> {
    try {
      const response = await this.apiClient.get<ComicVineSingleCharacterResponse>(
        `/character/4005-${id.value}/`,
        {},
        {
          useCache: true,
        }
      );

      // Comic Vine returns single character in results property
      if (!response.results) {
        return null;
      }

      return ComicVineCharacterMapper.toDomain(response.results);
    } catch (error: any) {
      // Return null for 404 errors (character not found)
      if (error.statusCode === 404) {
        return null;
      }
      
      // Don't log cancellation errors as they're expected during navigation/cleanup
      if (error?.message?.includes('cancelled')) {
        logger.debug('Request cancelled (expected during navigation)', { characterId: id.value });
        throw error; // Still throw so the caller can handle it
      }
      
      logger.error('Failed to fetch character by ID', error, { characterId: id.value });
      throw error;
    }
  }

  /**
   * Search characters by name
   * Uses Comic Vine's filter syntax: "publisher:31,name:query"
   * 
   * @param query - Search query (name filter)
   * @returns List of matching Marvel characters
   * @throws {ApiError} When the API request fails
   */
  async searchByName(query: string): Promise<Character[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      // Comic Vine filter syntax supports name filtering
      const response = await this.apiClient.get<ComicVineApiResponse<ComicVineCharacterResponse>>(
        '/characters/',
        {
          filter: `publisher:${this.MARVEL_PUBLISHER_ID},name:${encodeURIComponent(query)}`,
          limit: API.SEARCH_RESULT_LIMIT,
        },
        {
          useCache: true,
        }
      );

      return ComicVineCharacterMapper.toDomainList(response.results);
    } catch (error) {
      logger.error('Failed to search characters', error, { query });
      throw error;
    }
  }

  /**
   * Get comics for a specific character
   * Fetches issues that feature the character, sorted by release date (newest first)
   * 
   * @param characterId - Character identifier
   * @param limit - Maximum number of comics to return (default 20)
   * @returns List of comics featuring the character
   * @throws {ApiError} When the API request fails
   */
  async getComics(characterId: CharacterId, limit: number = 20): Promise<Comic[]> {
    try {
      const response = await this.apiClient.get<ComicVineIssuesApiResponse>(
        '/issues/',
        {
          filter: `character:${characterId.value}`,
          limit: Math.min(limit, 20), // Comic Vine API limit
          sort: 'cover_date:desc', // Newest first
        },
        {
          useCache: true,
        }
      );

      return ComicVineComicMapper.toDomainList(response.results, characterId);
    } catch (error) {
      logger.error('Failed to fetch character comics', error, { characterId: characterId.value, limit });
      // Return empty array on error rather than throwing
      // This allows character detail page to still show even if comics fail
      return [];
    }
  }
}
