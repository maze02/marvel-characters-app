import { CharacterRepository } from "@domain/character/ports/CharacterRepository";
import { Character } from "@domain/character/entities/Character";

/**
 * Search result with count
 */
export interface SearchResult {
  characters: Character[];
  count: number;
  query: string;
}

/**
 * Searches for Marvel characters by name
 *
 * How it works:
 * - Takes a search query (like "Spider") and finds matching characters
 * - Empty searches return no results
 * - Can be cancelled if user types something new
 * - Returns both the character list and how many were found
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
   * Runs the character search
   *
   * @param query - What to search for (e.g., "Spider", "Iron Man")
   * @param options - Additional settings (can cancel request, apply filters)
   * @returns Found characters and how many matched
   */
  async execute(
    query: string,
    options?: {
      useContainsFilter?: boolean; // Apply client-side contains filter
      signal?: AbortSignal; // Cancel the request if needed
    },
  ): Promise<SearchResult> {
    const trimmedQuery = query.trim();

    // Return empty results for empty query
    if (trimmedQuery === "") {
      return {
        characters: [],
        count: 0,
        query: trimmedQuery,
      };
    }

    // Get results from API (uses nameStartsWith)
    let characters = await this.characterRepository.searchByName(
      trimmedQuery,
      options?.signal,
    );

    // Optionally apply client-side "contains" filter
    // This allows matching "Spider-Man" with query "Man" (not just "Spi")
    if (options?.useContainsFilter) {
      characters = characters.filter((character) =>
        character.matchesSearch(trimmedQuery),
      );
    }

    return {
      characters,
      count: characters.length,
      query: trimmedQuery,
    };
  }
}
