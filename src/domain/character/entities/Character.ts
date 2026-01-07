import { CharacterId } from "../valueObjects/CharacterId";
import { CharacterName } from "../valueObjects/CharacterName";
import { ImageUrl } from "../valueObjects/ImageUrl";

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
 * });
 * ```
 */
export class Character {
  private readonly _id: CharacterId;
  private readonly _name: CharacterName;
  private readonly _description: string;
  private readonly _thumbnail: ImageUrl;
  private readonly _issueIds: readonly number[]; // IDs of issues this character appears in

  constructor(props: {
    id: CharacterId;
    name: CharacterName;
    description: string;
    thumbnail: ImageUrl;
    issueIds?: number[]; // Optional - not all contexts need issue data
  }) {
    this._id = props.id;
    this._name = props.name;
    this._description = props.description.trim();
    this._thumbnail = props.thumbnail;
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
   * Get thumbnail URL with specific variant
   * Note: Variant is ignored for Comic Vine URLs (they already include size)
   */
  getThumbnailUrl(
    variant?:
      | "portrait_xlarge"
      | "landscape_large"
      | "standard_large"
      | "portrait_uncanny",
  ): string {
    return this._thumbnail.getUrl(variant);
  }

  /**
   * Check if character matches search term
   */
  matchesSearch(searchTerm: string): boolean {
    return this._name.contains(searchTerm);
  }
}
