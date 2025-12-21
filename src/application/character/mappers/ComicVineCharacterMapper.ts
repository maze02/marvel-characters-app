import { Character } from '@domain/character/entities/Character';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { CharacterName } from '@domain/character/valueObjects/CharacterName';
import { ImageUrl } from '@domain/character/valueObjects/ImageUrl';
import { ComicVineCharacterResponse } from '../dtos/ComicVineCharacterDTO';

/**
 * Comic Vine Character Mapper
 * 
 * Transforms Comic Vine API responses to Domain entities.
 * Handles HTML stripping, image URL parsing, and data validation.
 * 
 * @example
 * ```typescript
 * const character = ComicVineCharacterMapper.toDomain(apiResponse);
 * const characters = ComicVineCharacterMapper.toDomainList(apiResponses);
 * ```
 */
export class ComicVineCharacterMapper {
  /**
   * Transform single Comic Vine character response to Domain entity
   * 
   * @param response - Raw Comic Vine API response
   * @returns Character domain entity
   */
  static toDomain(response: ComicVineCharacterResponse): Character {
    return new Character({
      id: new CharacterId(response.id),
      name: new CharacterName(response.name),
      description: this.cleanHtmlDescription(response.description || response.deck),
      thumbnail: this.createImageUrl(response.image),
      modifiedDate: new Date(response.date_last_updated),
    });
  }

  /**
   * Transform array of Comic Vine responses to Domain entities
   * 
   * @param responses - Array of raw Comic Vine API responses
   * @returns Array of Character domain entities
   */
  static toDomainList(responses: ComicVineCharacterResponse[]): Character[] {
    return responses.map(response => this.toDomain(response));
  }

  /**
   * Clean HTML description from Comic Vine
   * Strips HTML tags, entities, and extra whitespace
   * 
   * @param html - HTML formatted description
   * @returns Clean text description
   */
  private static cleanHtmlDescription(html: string | null): string {
    if (!html) return '';

    return html
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Create ImageUrl value object from Comic Vine image structure
   * 
   * Comic Vine provides complete URLs, so we store them as-is without splitting.
   * 
   * @param image - Comic Vine image object
   * @returns ImageUrl value object
   */
  private static createImageUrl(image: ComicVineCharacterResponse['image']): ImageUrl {
    // Use medium_url as default, fallback to original_url
    const url = image.medium_url || image.screen_url || image.original_url;
    
    if (!url) {
      // Return placeholder if no image
      return new ImageUrl('https://via.placeholder.com/300x450/2c3e50/ffffff?text=No+Image', 'png');
    }

    // Comic Vine returns complete URLs: https://comicvine.gamespot.com/a/uploads/scale_medium/11/11111/123456-file.jpg
    // We need to store the complete URL minus the extension, since ImageUrl adds it back
    const lastDotIndex = url.lastIndexOf('.');
    const extension = url.substring(lastDotIndex + 1) || 'jpg';
    const pathWithoutExtension = url.substring(0, lastDotIndex);

    return new ImageUrl(pathWithoutExtension, extension);
  }
}
