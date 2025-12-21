import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Character } from '@domain/character/entities/Character';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';

/**
 * Character not found error
 */
export class CharacterNotFoundError extends Error {
  constructor(characterId: number) {
    super(`Character with ID ${characterId} not found`);
    this.name = 'CharacterNotFoundError';
  }
}

/**
 * Get Character Detail Use Case
 * 
 * Retrieves detailed information for a single character.
 * 
 * Business rules:
 * - Throws error if character doesn't exist
 * - Results are cached for performance
 * - Returns full character entity
 * 
 * @example
 * ```typescript
 * const useCase = new GetCharacterDetail(repository);
 * const character = await useCase.execute(1011334); // Spider-Man
 * console.log(character.name.value); // 'Spider-Man'
 * ```
 */
export class GetCharacterDetail {
  constructor(private readonly characterRepository: CharacterRepository) {}

  /**
   * Execute the use case
   * 
   * @param characterId - Character ID (number)
   * @returns Character entity
   * @throws {CharacterNotFoundError} When character doesn't exist
   * @throws {ApiError} When the Marvel API request fails
   */
  async execute(characterId: number): Promise<Character> {
    const id = new CharacterId(characterId);
    const character = await this.characterRepository.findById(id);

    if (!character) {
      throw new CharacterNotFoundError(characterId);
    }

    return character;
  }
}
