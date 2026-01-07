/**
 * CharacterName Value Object
 *
 * Represents a character's name with validation rules.
 * Ensures the name is not empty and within reasonable length limits.
 *
 * @example
 * ```typescript
 * const name = new CharacterName('Spider-Man');
 * console.log(name.value); // 'Spider-Man'
 * ```
 */
export class CharacterName {
  private readonly _value: string;
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    const trimmed = value.trim();

    if (trimmed.length < CharacterName.MIN_LENGTH) {
      throw new Error("Character name cannot be empty");
    }

    if (trimmed.length > CharacterName.MAX_LENGTH) {
      throw new Error(
        `Character name cannot exceed ${CharacterName.MAX_LENGTH} characters`,
      );
    }

    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: CharacterName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  /**
   * Check if this name contains the given search term (case-insensitive)
   */
  contains(searchTerm: string): boolean {
    return this._value.toLowerCase().includes(searchTerm.toLowerCase());
  }

  /**
   * Check if this name starts with the given prefix (case-insensitive)
   */
  startsWith(prefix: string): boolean {
    return this._value.toLowerCase().startsWith(prefix.toLowerCase());
  }
}
