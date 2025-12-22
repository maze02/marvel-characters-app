import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Comic } from '@domain/character/entities/Comic';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';

/**
 * List Character Comics Use Case
 * 
 * Retrieves comics featuring a specific character using efficient two-step approach:
 * 1. Get character with issue_credits (list of issue IDs)
 * 2. Batch fetch comics by IDs with pagination support
 * 
 * This is the recommended approach per Comic Vine API documentation as the
 * `/issues/` endpoint doesn't support filtering by character directly.
 * 
 * Business rules:
 * - Supports pagination (offset/limit) for lazy loading
 * - Sorted by cover_date (newest first from API)
 * - Results are cached for performance
 * - Batches API requests (max 100 IDs per request)
 * 
 * @example
 * ```typescript
 * const useCase = new ListCharacterComics(repository);
 * 
 * // Load first 20 comics
 * const page1 = await useCase.execute(1011334, { offset: 0, limit: 20 });
 * 
 * // Load next 20 comics
 * const page2 = await useCase.execute(1011334, { offset: 20, limit: 20 });
 * 
 * // Get total count without fetching
 * const total = await useCase.getTotalCount(1011334);
 * ```
 */
export class ListCharacterComics {
  constructor(private readonly characterRepository: CharacterRepository) {}

  /**
   * Execute the use case - Get paginated comics for a character
   * 
   * Two-step process:
   * 1. Fetch character to get issue_credits (done by caller via GetCharacterDetail)
   * 2. Batch fetch PAGINATED issues by ID (only fetch what's needed)
   * 
   * @param characterId - Character ID (number)
   * @param options - Pagination options (offset, limit)
   * @returns Array of comics for the requested page, sorted by release date (newest first)
   * @throws {ApiError} When the API request fails
   */
  async execute(
    characterId: number,
    options: { offset?: number; limit?: number } = {}
  ): Promise<Comic[]> {
    const { offset = 0, limit } = options;
    const id = new CharacterId(characterId);

    // Step 1: Get character with issue IDs
    const character = await this.characterRepository.findById(id);
    
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // If character has no comics, return empty array
    if (!character.hasIssues()) {
      return [];
    }

    // Step 2: Slice issue IDs for pagination (BEFORE API call)
    const allIssueIds = Array.from(character.issueIds);
    const paginatedIssueIds = limit 
      ? allIssueIds.slice(offset, offset + limit)
      : allIssueIds.slice(offset);

    if (paginatedIssueIds.length === 0) {
      return [];
    }

    // Step 3: Batch fetch only the paginated comics
    const comics = await this.characterRepository.getComicsByIds(paginatedIssueIds, id);

    // Comics are already sorted by repository (cover_date:desc)
    return comics;
  }

  /**
   * Get total count of comics for a character (without fetching comics)
   * 
   * @param characterId - Character ID (number)
   * @returns Total number of comics for this character
   */
  async getTotalCount(characterId: number): Promise<number> {
    const id = new CharacterId(characterId);
    const character = await this.characterRepository.findById(id);
    
    if (!character) {
      return 0;
    }

    return character.getIssueCount();
  }
}
