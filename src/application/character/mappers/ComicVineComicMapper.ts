import { Comic } from '@domain/character/entities/Comic';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { ImageUrl } from '@domain/character/valueObjects/ImageUrl';
import { ReleaseDate } from '@domain/character/valueObjects/ReleaseDate';
import { ComicVineIssueResponse } from '../dtos/ComicVineComicDTO';

/**
 * Comic Vine Comic/Issue Mapper
 * 
 * Transforms Comic Vine API issue responses to Comic Domain entities.
 * Handles HTML stripping, image URL parsing, and date formatting.
 * 
 * @example
 * ```typescript
 * const comic = ComicVineComicMapper.toDomain(apiResponse, characterId);
 * const comics = ComicVineComicMapper.toDomainList(apiResponses, characterId);
 * ```
 */
export class ComicVineComicMapper {
  /**
   * Transform single Comic Vine issue response to Comic Domain entity
   * 
   * @param response - Raw Comic Vine API issue response
   * @param characterId - Associated character ID
   * @returns Comic domain entity
   */
  static toDomain(response: ComicVineIssueResponse, characterId: CharacterId): Comic {
    const title = this.createTitle(response);
    
    return new Comic({
      id: response.id,
      title,
      description: this.cleanHtmlDescription(response.description),
      thumbnail: this.createImageUrl(response.image),
      onSaleDate: this.parseReleaseDate(response.cover_date),
      characterId,
    });
  }

  /**
   * Transform array of Comic Vine issue responses to Comic Domain entities
   * 
   * @param responses - Array of raw Comic Vine API issue responses
   * @param characterId - Associated character ID
   * @returns Array of Comic domain entities
   */
  static toDomainList(responses: ComicVineIssueResponse[], characterId: CharacterId): Comic[] {
    return responses.map(response => this.toDomain(response, characterId));
  }

  /**
   * Create comic title from issue data
   * Format: "Volume Name #Issue" or just "Issue Title"
   * 
   * @param response - Comic Vine issue response
   * @returns Formatted title
   */
  private static createTitle(response: ComicVineIssueResponse): string {
    if (response.name) {
      return response.name;
    }
    
    // Fallback: use volume name + issue number
    if (response.volume && response.issue_number) {
      return `${response.volume.name} #${response.issue_number}`;
    }
    
    return `Issue #${response.issue_number || 'Unknown'}`;
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
   * Parse Comic Vine cover date to ReleaseDate value object
   * 
   * @param coverDate - Date string in format "2024-01-15"
   * @returns ReleaseDate value object
   */
  private static parseReleaseDate(coverDate: string): ReleaseDate | null {
    if (!coverDate) {
      // Return null if no date
      return null;
    }
    
    // Comic Vine format: "2024-01-15" (YYYY-MM-DD)
    // Convert to ISO format for ReleaseDate
    return new ReleaseDate(`${coverDate}T00:00:00.000Z`);
  }

  /**
   * Create ImageUrl value object from Comic Vine image structure
   * 
   * @param image - Comic Vine image object or null
   * @returns ImageUrl value object
   */
  private static createImageUrl(image: ComicVineIssueResponse['image'] | null): ImageUrl {
    if (!image || !image.medium_url) {
      // Return placeholder for missing images
      return new ImageUrl('https://via.placeholder.com/200x300/2c3e50/ffffff?text=No+Cover', 'png');
    }

    // Use medium_url for comic covers
    const url = image.medium_url;
    
    // Comic Vine returns complete URLs: https://comicvine.gamespot.com/a/uploads/scale_medium/11/11111/123456-file.jpg
    // We need to store the complete URL minus the extension, since ImageUrl adds it back
    const lastDotIndex = url.lastIndexOf('.');
    const extension = url.substring(lastDotIndex + 1) || 'jpg';
    const pathWithoutExtension = url.substring(0, lastDotIndex);

    return new ImageUrl(pathWithoutExtension, extension);
  }
}
