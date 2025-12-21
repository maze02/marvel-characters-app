/**
 * ReleaseDate Value Object
 * 
 * Represents a comic release date with parsing and comparison capabilities.
 * Handles various date formats from the Marvel API.
 * 
 * @example
 * ```typescript
 * const date = new ReleaseDate('2024-01-15T00:00:00-0500');
 * console.log(date.toISOString()); // '2024-01-15T05:00:00.000Z'
 * ```
 */
export class ReleaseDate {
  private readonly _date: Date;

  constructor(dateString: string | Date) {
    const parsed = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid release date: ${dateString}`);
    }
    
    this._date = parsed;
  }

  get value(): Date {
    return new Date(this._date); // Return copy to maintain immutability
  }

  toISOString(): string {
    return this._date.toISOString();
  }

  /**
   * Format date for display
   */
  toDisplayString(): string {
    return this._date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Compare with another release date
   * @returns negative if this is before other, positive if after, 0 if equal
   */
  compareTo(other: ReleaseDate): number {
    return this._date.getTime() - other._date.getTime();
  }

  /**
   * Check if this date is before another
   */
  isBefore(other: ReleaseDate): boolean {
    return this.compareTo(other) < 0;
  }

  /**
   * Check if this date is after another
   */
  isAfter(other: ReleaseDate): boolean {
    return this.compareTo(other) > 0;
  }

  equals(other: ReleaseDate): boolean {
    return this._date.getTime() === other._date.getTime();
  }

  toString(): string {
    return this.toISOString();
  }
}
