import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Comic } from '@domain/character/entities/Comic';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { PAGINATION, COMICS } from '@config/constants';

/**
 * List Character Comics Use Case
 * 
 * Retrieves comics featuring a specific character.
 * Returns first 20 comics, sorted by release date (ascending).
 * 
 * Business rules:
 * - Maximum 20 comics returned
 * - Sorted by onSaleDate (earliest first)
 * - Comics without dates appear last
 * - Results are cached for performance
 * 
 * @example
 * ```typescript
 * const useCase = new ListCharacterComics(repository);
 * const comics = await useCase.execute(1011334); // Spider-Man's comics
 * console.log(comics.length); // Up to 20
 * ```
 */
export class ListCharacterComics {
  constructor(private readonly characterRepository: CharacterRepository) {}

  /**
   * Execute the use case
   * 
   * @param characterId - Character ID (number)
   * @param limit - Maximum number of comics (default: 20)
   * @returns Array of comics sorted by release date
   * @throws {ApiError} When the Marvel API request fails
   */
  async execute(characterId: number, limit?: number): Promise<Comic[]> {
    const id = new CharacterId(characterId);
    const comicLimit = limit ?? COMICS.DEFAULT_DETAIL_PAGE_LIMIT;

    // Validate limit
    if (comicLimit <= 0 || comicLimit > PAGINATION.MAX_LIMIT) {
      throw new Error(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`);
    }

    const comics = await this.characterRepository.getComics(id, comicLimit);

    // Comics are already sorted by repository, but ensure it
    return comics.sort((a, b) => a.compareByReleaseDate(b));
  }
}
