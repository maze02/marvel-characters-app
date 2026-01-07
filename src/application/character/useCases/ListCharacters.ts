import {
  CharacterRepository,
  PaginatedResult,
} from "@domain/character/ports/CharacterRepository";
import { Character } from "@domain/character/entities/Character";
import { PAGINATION } from "@config/constants";

/**
 * List Characters Use Case
 *
 * Retrieves a paginated list of Marvel characters.
 * Default: first 50 characters.
 *
 * Business rules:
 * - Returns maximum 50 characters per request
 * - Results are cached for performance
 * - Includes total count for pagination UI
 *
 * @example
 * ```typescript
 * const useCase = new ListCharacters(repository);
 * const result = await useCase.execute({ limit: 50, offset: 0 });
 * console.log(result.items); // Character[]
 * console.log(result.total); // Total available characters
 * ```
 */
export class ListCharacters {
  constructor(private readonly characterRepository: CharacterRepository) {}

  /**
   * Execute the use case
   *
   * @param params - Pagination parameters (optional)
   * @returns Paginated result containing characters and metadata
   * @throws {ApiError} When the Marvel API request fails
   */
  async execute(params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<Character>> {
    const limit = params?.limit ?? PAGINATION.DEFAULT_LIMIT;
    const offset = params?.offset ?? PAGINATION.DEFAULT_OFFSET;

    // Validate parameters
    if (limit <= 0 || limit > PAGINATION.MAX_LIMIT) {
      throw new Error(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`);
    }

    if (offset < 0) {
      throw new Error("Offset must be non-negative");
    }

    return await this.characterRepository.findMany({ limit, offset });
  }
}
