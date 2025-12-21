/**
 * Comic Vine Character DTOs
 * 
 * Data Transfer Objects for Comic Vine API character responses.
 * Maps external API structure to application layer.
 */

/**
 * Comic Vine Character Response
 * Structure returned by /characters/ and /character/ endpoints
 */
export interface ComicVineCharacterResponse {
  id: number;
  name: string;
  deck: string | null; // Short description
  description: string | null; // HTML formatted description
  image: {
    icon_url: string;
    medium_url: string;
    screen_url: string;
    screen_large_url: string;
    small_url: string;
    super_url: string;
    thumb_url: string;
    tiny_url: string;
    original_url: string;
  };
  publisher: {
    id: number;
    name: string;
  } | null;
  date_added: string; // ISO date
  date_last_updated: string; // ISO date
  site_detail_url: string;
  api_detail_url: string;
}

/**
 * Comic Vine API Response Wrapper
 * Standard response format for all Comic Vine endpoints
 */
export interface ComicVineApiResponse<T> {
  error: string; // "OK" on success, error message otherwise
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number; // 1 = success
  results: T[];
}

/**
 * Single Character Detail Response
 * Used for /character/4005-{id}/ endpoint
 */
export interface ComicVineSingleCharacterResponse {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: ComicVineCharacterResponse;
}

/**
 * Character DTO for Application Layer
 * Simplified structure for internal use
 */
export interface CharacterDTO {
  id: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  modifiedDate: string;
}
