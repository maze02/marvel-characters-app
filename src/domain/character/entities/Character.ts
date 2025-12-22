import { CharacterId } from '../valueObjects/CharacterId';
import { CharacterName } from '../valueObjects/CharacterName';
import { ImageUrl } from '../valueObjects/ImageUrl';

/**
 * Character Entity
 * 
 * Core domain entity representing a Marvel character.
 * Contains business logic and validation rules.
 * Immutable - all updates return new instances.
 * 
 * @example
 * ```typescript
 * const character = new Character({
 *   id: new CharacterId(1011334),
 *   name: new CharacterName('Spider-Man'),
 *   description: 'Friendly neighborhood Spider-Man',
 *   thumbnail: new ImageUrl('path/to/image', 'jpg'),
 *   modifiedDate: new Date(),
 * });
 * ```
 */
export class Character {
  private readonly _id: CharacterId;
  private readonly _name: CharacterName;
  private readonly _description: string;
  private readonly _thumbnail: ImageUrl;
  private readonly _modifiedDate: Date;
  private readonly _issueIds: readonly number[]; // IDs of issues this character appears in

  constructor(props: {
    id: CharacterId;
    name: CharacterName;
    description: string;
    thumbnail: ImageUrl;
    modifiedDate: Date;
    issueIds?: number[]; // Optional - not all contexts need issue data
  }) {
    this._id = props.id;
    this._name = props.name;
    this._description = props.description.trim();
    this._thumbnail = props.thumbnail;
    this._modifiedDate = props.modifiedDate;
    this._issueIds = Object.freeze(props.issueIds || []); // Immutable array
  }

  get id(): CharacterId {
    return this._id;
  }

  get name(): CharacterName {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get thumbnail(): ImageUrl {
    return this._thumbnail;
  }

  get modifiedDate(): Date {
    return new Date(this._modifiedDate);
  }

  /**
   * Get list of issue IDs this character appears in
   * Returns a readonly array to maintain immutability
   */
  get issueIds(): readonly number[] {
    return this._issueIds;
  }

  /**
   * Check if character has associated issues
   */
  hasIssues(): boolean {
    return this._issueIds.length > 0;
  }

  /**
   * Get count of issues this character appears in
   */
  getIssueCount(): number {
    return this._issueIds.length;
  }

  /**
   * Check if character has a description
   */
  hasDescription(): boolean {
    return this._description.length > 0;
  }

  /**
   * Check if character has a valid thumbnail (not placeholder)
   */
  hasValidThumbnail(): boolean {
    return !this._thumbnail.isPlaceholder();
  }

  /**
   * Get thumbnail URL with specific variant
   * Note: Variant is ignored for Comic Vine URLs (they already include size)
   */
  getThumbnailUrl(variant?: 'portrait_xlarge' | 'landscape_large' | 'standard_large' | 'portrait_uncanny'): string {
    return this._thumbnail.getUrl(variant);
  }

  /**
   * Check if character matches search term
   */
  matchesSearch(searchTerm: string): boolean {
    return this._name.contains(searchTerm);
  }

  /**
   * Compare characters by name (for sorting)
   */
  compareByName(other: Character): number {
    return this._name.value.localeCompare(other._name.value);
  }

  /**
   * Compare characters by modification date (for sorting)
   */
  compareByDate(other: Character): number {
    return this._modifiedDate.getTime() - other._modifiedDate.getTime();
  }

  equals(other: Character): boolean {
    return this._id.equals(other._id);
  }

  toString(): string {
    return `Character(${this._id.value}, ${this._name.value})`;
  }
}
