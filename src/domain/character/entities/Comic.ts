import { CharacterId } from "../valueObjects/CharacterId";
import { ImageUrl } from "../valueObjects/ImageUrl";
import { ReleaseDate } from "../valueObjects/ReleaseDate";

/**
 * Comic Entity
 *
 * Represents a comic book featuring a Marvel character.
 * Contains comic metadata and release information.
 *
 * @example
 * ```typescript
 * const comic = new Comic({
 *   id: 12345,
 *   title: 'Amazing Spider-Man #1',
 *   description: 'The beginning of Spider-Man',
 *   thumbnail: new ImageUrl('path', 'jpg'),
 *   onSaleDate: new ReleaseDate('2024-01-01'),
 *   characterId: new CharacterId(1011334),
 * });
 * ```
 */
export class Comic {
  private readonly _id: number;
  private readonly _title: string;
  private readonly _description: string;
  private readonly _thumbnail: ImageUrl;
  private readonly _onSaleDate: ReleaseDate | null;
  private readonly _characterId: CharacterId;

  constructor(props: {
    id: number;
    title: string;
    description: string;
    thumbnail: ImageUrl;
    onSaleDate: ReleaseDate | null;
    characterId: CharacterId;
  }) {
    if (!Number.isInteger(props.id) || props.id <= 0) {
      throw new Error(`Invalid comic ID: ${props.id}`);
    }

    if (!props.title || props.title.trim() === "") {
      throw new Error("Comic title cannot be empty");
    }

    this._id = props.id;
    this._title = props.title.trim();
    this._description = props.description.trim();
    this._thumbnail = props.thumbnail;
    this._onSaleDate = props.onSaleDate;
    this._characterId = props.characterId;
  }

  get id(): number {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get thumbnail(): ImageUrl {
    return this._thumbnail;
  }

  get onSaleDate(): ReleaseDate | null {
    return this._onSaleDate;
  }

  get characterId(): CharacterId {
    return this._characterId;
  }

  /**
   * Check if comic has a description
   */
  hasDescription(): boolean {
    return this._description.length > 0;
  }

  /**
   * Check if comic has a release date
   */
  hasReleaseDate(): boolean {
    return this._onSaleDate !== null;
  }

  /**
   * Get thumbnail URL with specific variant
   */
  getThumbnailUrl(
    variant: "portrait_xlarge" | "landscape_large" = "portrait_xlarge",
  ): string {
    return this._thumbnail.getUrl(variant);
  }
}
