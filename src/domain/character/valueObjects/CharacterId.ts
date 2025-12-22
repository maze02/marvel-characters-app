/**
 * CharacterId Value Object
 * 
 * Represents a unique identifier for a Marvel character.
 * Ensures the ID is always a valid positive integer.
 * 
 * @example
 * ```typescript
 * const id = new CharacterId(1011334); // Spider-Man's ID
 * console.log(id.value); // 1011334
 * ```
 */
export class CharacterId {
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Invalid character ID: ${value}. Must be a positive integer.`);
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: CharacterId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
