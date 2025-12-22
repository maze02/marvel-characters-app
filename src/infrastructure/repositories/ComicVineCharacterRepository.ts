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
        {
          // Request issue_credits to get list of issues this character appears in
          field_list: 'id,name,deck,description,image,publisher,date_last_updated,issue_credits',
        },
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
      if (error?.message?.includes('cancelled') || error?.message?.includes('canceled') || error?.name === 'CanceledError') {
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

      // Don't manually encode - axios will handle URL encoding automatically
      const searchQuery = query.trim();
      logger.info('Searching characters', { query: searchQuery, limit: API.SEARCH_RESULT_LIMIT });

      // Comic Vine filter syntax supports name filtering
      const response = await this.apiClient.get<ComicVineApiResponse<ComicVineCharacterResponse>>(
        '/characters/',
        {
          filter: `publisher:${this.MARVEL_PUBLISHER_ID},name:${searchQuery}`,
          limit: API.SEARCH_RESULT_LIMIT,
        },
        {
          useCache: true,
        }
      );

      logger.info('Search results received', { 
        query: searchQuery, 
        totalResults: response.number_of_total_results,
        returnedResults: response.results.length 
      });

      return ComicVineCharacterMapper.toDomainList(response.results);
    } catch (error: any) {
      // Don't log cancelled requests as errors (expected behavior from debouncing)
      if (error?.message?.includes('cancel') || error?.code === 'ERR_CANCELED') {
        logger.debug('Search request cancelled (debouncing)', { query });
      } else {
        logger.error('Failed to search characters', error, { query });
      }
      throw error;
    }
  }

  /**
   * Get comics by their IDs (batch fetching)
   * Efficiently fetches multiple comics in batches of up to 100 per request
   * 
   * This is the recommended approach per Comic Vine API documentation:
   * 1. Get character with issue_credits field
   * 2. Batch fetch issues by ID using filter=id:123|456|789
   * 
   * @param issueIds - Array of issue IDs to fetch
   * @param characterId - Character these issues belong to (for mapping)
   * @returns List of comics, sorted by release date (newest first)
   * @throws {ApiError} When the API request fails
   */
  async getComicsByIds(issueIds: number[], characterId: CharacterId): Promise<Comic[]> {
    if (issueIds.length === 0) {
      return [];
    }

    try {
      logger.debug('🔍 Fetching comics by IDs', {
        characterId: characterId.value,
        totalIssues: issueIds.length,
        issueIdsPreview: issueIds.slice(0, 5), // Show first 5 for debugging
      });

      // Chunk IDs into groups of 100 (Comic Vine API maximum)
      const BATCH_SIZE = 100;
      const chunks = this.chunkArray(issueIds, BATCH_SIZE);
      const allComics: Comic[] = [];

      // Fetch each chunk sequentially (avoid overwhelming the API)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk || chunk.length === 0) continue; // Skip empty chunks
        
        const filter = `id:${chunk.join('|')}`;

        logger.debug(`📦 Fetching batch ${i + 1}/${chunks.length}`, {
          batchSize: chunk.length,
          filter: filter.substring(0, 50) + '...', // Truncate for readability
        });

        const response = await this.apiClient.get<ComicVineIssuesApiResponse>(
          '/issues/',
          {
            filter,
            field_list: 'id,name,issue_number,cover_date,image,volume,description',
            limit: BATCH_SIZE,
            sort: 'cover_date:desc', // Newest first
          },
          {
            useCache: true,
          }
        );

        if (response.status_code !== 1) {
          logger.warn('Comic Vine API returned non-success status for batch', {
            batchIndex: i,
            statusCode: response.status_code,
            error: response.error,
          });
          continue; // Skip this batch but continue with others
        }

        const batchComics = ComicVineComicMapper.toDomainList(response.results, characterId);
        allComics.push(...batchComics);
      }

      logger.debug('✅ Comics fetched successfully', {
        characterId: characterId.value,
        totalFetched: allComics.length,
        totalRequested: issueIds.length,
        batchesProcessed: chunks.length,
      });

      return allComics;
    } catch (error) {
      logger.error('Failed to fetch comics by IDs', error, {
        characterId: characterId.value,
        issueCount: issueIds.length,
      });
      // Return empty array on error rather than throwing
      return [];
    }
  }

  /**
   * Utility: Chunk array into smaller arrays
   * @private
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

}
