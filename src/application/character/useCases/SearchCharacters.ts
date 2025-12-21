import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Character } from '@domain/character/entities/Character';

/**
 * Search result with count
 */
export interface SearchResult {
  characters: Character[];
  count: number;
  query: string;
}

/**
 * Search Characters Use Case
 * 
 * Searches Marvel characters by name.
 * Uses Marvel API's nameStartsWith parameter for efficient server-side filtering.
 * Optionally applies client-side "contains" filtering.
 * 
 * Business rules:
 * - Empty query returns empty results
 * - Query is trimmed and case-insensitive
 * - Returns result count for UI display
 * - Previous searches can be cancelled
 * 
 * @example
 * ```typescript
 * const useCase = new SearchCharacters(repository);
 * const result = await useCase.execute('Spider');
 * console.log(result.characters); // [Spider-Man, Spider-Woman, ...]
 * console.log(result.count); // 5
 * ```
 */
export class SearchCharacters {
  constructor(private readonly characterRepository: CharacterRepository) {}

  /**
   * Execute the search use case
   * 
   * @param query - Search query (character name)
   * @param options - Search options
   * @returns Search result with characters and count
   * @throws {ApiError} When the Marvel API request fails
   */
  async execute(
    query: string,
    options?: {
      useContainsFilter?: boolean; // Apply client-side contains filter
    }
  ): Promise<SearchResult> {
    const trimmedQuery = query.trim();

    // Return empty results for empty query
    if (trimmedQuery === '') {
      return {
        characters: [],
        count: 0,
        query: trimmedQuery,
      };
    }

    // Get results from API (uses nameStartsWith)
    let characters = await this.characterRepository.searchByName(trimmedQuery);

    // Optionally apply client-side "contains" filter
    // This allows matching "Spider-Man" with query "Man" (not just "Spi")
    if (options?.useContainsFilter) {
      characters = characters.filter((character) =>
        character.matchesSearch(trimmedQuery)
      );
    }

    return {
      characters,
      count: characters.length,
      query: trimmedQuery,
    };
  }
}
