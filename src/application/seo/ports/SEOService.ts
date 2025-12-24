/**
 * SEO Service Port
 *
 * This is like a contract that defines what SEO operations are available.
 * Think of it as a "promise" that any SEO system must fulfill.
 *
 * Why this exists:
 * - Separates "what we need" from "how we do it"
 * - Makes testing easy (we can create fake SEO services for tests)
 * - Follows clean architecture principles
 *
 * Domain-Driven Design (DDD) Pattern: Port
 * Hexagonal Architecture: Application Port
 */

/**
 * SEO Metadata Configuration
 *
 * Contains all the information needed to optimize a page for search engines.
 * This is a Value Object - it just holds data, no behavior.
 */
export interface SEOMetadata {
  /** The page title shown in browser tabs and search results */
  title: string;

  /** Short description shown in search results (keep under 160 characters) */
  description: string;

  /** Image shown when page is shared on social media */
  image?: string;

  /** Type of content (website, article, profile, etc.) */
  type?: string;

  /** The official URL of the page (prevents duplicate content issues) */
  canonicalUrl?: string;

  /** Character information for character detail pages */
  character?: {
    name: string;
    description?: string;
    image?: string;
  };
}

/**
 * SEO Service Port (Interface)
 *
 * Defines what any SEO service must be able to do.
 * The actual implementation is in the infrastructure layer.
 *
 * This follows the Dependency Inversion Principle:
 * - High-level code (application layer) depends on this abstraction
 * - Low-level code (infrastructure layer) implements this abstraction
 *
 * Benefits:
 * - Easy to test - can create mock implementations
 * - Easy to swap - can change how SEO works without changing app code
 * - Clear contract - everyone knows what SEO operations are available
 *
 * @example
 * ```typescript
 * // In a React component:
 * const { seo } = useServices();
 *
 * useEffect(() => {
 *   seo.updateMetadata({
 *     title: "Spider-Man - Marvel Character",
 *     description: "Learn about Spider-Man...",
 *     canonicalUrl: "https://example.com/character/spider-man"
 *   });
 * }, []);
 * ```
 */
export interface SEOService {
  /**
   * Updates the page's SEO metadata
   *
   * This changes:
   * - Page title (browser tab)
   * - Meta description (search results)
   * - Open Graph tags (Facebook/LinkedIn sharing)
   * - Twitter Card tags (Twitter sharing)
   * - Canonical URL (prevents duplicate content)
   * - Structured data (helps search engines understand content)
   *
   * @param metadata - The SEO information to apply to the page
   */
  updateMetadata(metadata: SEOMetadata): void;

  /**
   * Adds custom structured data to the page
   *
   * Structured data helps search engines understand your content better.
   * For example, it can tell Google "this page is about a person"
   * or "this page has a search feature".
   *
   * @param data - JSON-LD structured data object
   * @param id - Unique identifier for this structured data block
   */
  addStructuredData(data: Record<string, unknown>, id: string): void;

  /**
   * Removes structured data from the page
   *
   * Useful when navigating away from a page or cleaning up old data.
   *
   * @param id - Unique identifier of the structured data to remove
   */
  removeStructuredData(id: string): void;

  /**
   * Resets all SEO metadata to defaults
   *
   * Useful for cleanup or when navigating to a page without specific SEO needs.
   */
  reset(): void;
}
