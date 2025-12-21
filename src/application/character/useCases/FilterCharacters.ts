import { Character } from '@domain/character/entities/Character';

/**
 * Filter Characters Use Case
 * 
 * Filters a list of characters by name query.
 * Implements case-insensitive substring matching.
 * 
 * Business rules:
 * - Case-insensitive search
 * - Matches any substring in character name
 * - Empty query returns all characters
 * - Trims whitespace from query
 * 
 * @example
 * ```typescript
 * const useCase = new FilterCharacters();
 * const filtered = useCase.execute(characters, 'spider');
 * // Returns all characters with "spider" in their name (case-insensitive)
 * ```
 */
export class FilterCharacters {
  /**
   * Execute the use case
   * 
   * @param characters - List of characters to filter
   * @param query - Search query (name filter)
   * @returns Filtered list of characters
   */
  execute(characters: Character[], query: string): Character[] {
    // Trim and normalize query
    const normalizedQuery = query.trim().toLowerCase();
    
    // Empty query returns all characters
    if (normalizedQuery.length === 0) {
      return characters;
    }

    // Filter characters by name (case-insensitive substring match)
    return characters.filter((character) =>
      character.name.value.toLowerCase().includes(normalizedQuery)
    );
  }
}
