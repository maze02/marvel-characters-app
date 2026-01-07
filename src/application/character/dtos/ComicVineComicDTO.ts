/**
 * Comic Vine Comic/Issue DTOs
 *
 * Data Transfer Object Interfaces for Comic Vine API issue responses.
 * Defines Interfaces for Mapping external API structure to application layer.
 */

/**
 * Comic Vine Issue Response
 * Structure returned by /issues/ endpoint
 */
export interface ComicVineIssueResponse {
  id: number;
  name: string | null; // Issue title
  issue_number: string;
  volume: {
    id: number;
    name: string;
  };
  cover_date: string; // "2024-01-15" format
  store_date: string | null;
  description: string | null; // HTML formatted
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
  } | null;
  date_added: string;
  date_last_updated: string;
  site_detail_url: string;
  api_detail_url: string;
}

/**
 * Comic Vine Issues API Response
 */
export interface ComicVineIssuesApiResponse {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: ComicVineIssueResponse[];
}
