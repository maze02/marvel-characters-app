/**
 * Browser SEO Service Implementation
 *
 * Updates the browser's SEO tags.
 * Manipulates the DOM (Document Object Model) to change meta tags, titles, etc.
 *
 * Why this is in the infrastructure layer:
 * - It depends on browser APIs (window, document)
 * - It's a technical detail, not business logic
 * - Different environments (SSR, testing) might need different implementations
 *
 * Domain-Driven Design (DDD) Pattern: Adapter
 * Hexagonal Architecture: Output Adapter
 */

import { SEOService, SEOMetadata } from "@application/seo/ports/SEOService";

/**
 * Browser SEO Service
 *
 * Implements SEO operations by directly manipulating browser DOM.
 *
 *
 * @example
 * ```typescript
 * const seoService = new BrowserSEOService();
 * seoService.updateMetadata({
 *   title: "My Page",
 *   description: "Page description"
 * });
 * ```
 */
export class BrowserSEOService implements SEOService {
  /**
   * Updates all SEO metadata for the current page
   *
   * This method:
   * 1. Updates the page title
   * 2. Updates meta description
   * 3. Updates Open Graph tags (social sharing)
   * 4. Updates Twitter Card tags
   * 5. Updates canonical URL
   * 6. Adds structured data for characters (if provided)
   *
   * @param metadata - SEO configuration for the page
   */
  updateMetadata(metadata: SEOMetadata): void {
    // 1. Update page title (what shows in browser tab)
    if (metadata.title) {
      document.title = metadata.title;
    }

    // 2. Update meta description (what shows in Google search results)
    this.updateMetaTag("name", "description", metadata.description);

    // 3. Update Open Graph tags (for Facebook, LinkedIn, etc.)
    if (metadata.title) {
      this.updateMetaTag("property", "og:title", metadata.title);
    }
    if (metadata.description) {
      this.updateMetaTag("property", "og:description", metadata.description);
    }
    if (metadata.image) {
      this.updateMetaTag("property", "og:image", metadata.image);
    }
    if (metadata.type) {
      this.updateMetaTag("property", "og:type", metadata.type);
    }
    if (metadata.canonicalUrl) {
      this.updateMetaTag("property", "og:url", metadata.canonicalUrl);
    }

    // 4. Update Twitter Card tags (for Twitter sharing)
    this.updateMetaTag("name", "twitter:card", "summary_large_image");
    if (metadata.title) {
      this.updateMetaTag("name", "twitter:title", metadata.title);
    }
    if (metadata.description) {
      this.updateMetaTag("name", "twitter:description", metadata.description);
    }
    if (metadata.image) {
      this.updateMetaTag("name", "twitter:image", metadata.image);
    }

    // 5. Update canonical URL (tells Google which is the "official" URL)
    if (metadata.canonicalUrl) {
      this.updateCanonicalUrl(metadata.canonicalUrl);
    }

    // 6. Add character structured data (helps Google understand character pages)
    if (metadata.character) {
      this.addStructuredData(
        {
          "@context": "https://schema.org",
          "@type": "Person",
          name: metadata.character.name,
          description:
            metadata.character.description ||
            `${metadata.character.name} - Marvel Character`,
          image: metadata.character.image,
          ...(metadata.canonicalUrl && { url: metadata.canonicalUrl }),
        },
        "character-structured-data",
      );
    }
  }

  /**
   * Adds custom structured data (JSON-LD) to the page
   *
   * Structured data helps search engines understand your content.
   * It's added as a <script type="application/ld+json"> tag in the <head>.
   *
   * @param data - The structured data object (will be converted to JSON)
   * @param id - Unique ID for this structured data (for later removal/updates)
   */
  addStructuredData(data: Record<string, unknown>, id: string): void {
    // Remove existing structured data with this ID (if any)
    this.removeStructuredData(id);

    // Create new script tag
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);

    // Add to page head
    document.head.appendChild(script);
  }

  /**
   * Removes structured data from the page
   *
   * @param id - ID of the structured data to remove
   */
  removeStructuredData(id: string): void {
    const existingScript = document.querySelector(`#${id}`);
    if (existingScript) {
      existingScript.remove();
    }
  }

  /**
   * Resets SEO metadata to default values
   *
   * Useful when navigating between pages or cleaning up.
   * Currently, this is a no-op as each page should set its own metadata.
   */
  reset(): void {
    // In a more complex app, you might reset to default values here
    // For now, we rely on each page to set its own metadata
  }

  /**
   * Updates or creates a meta tag
   *
   * Helper method to avoid repetitive DOM manipulation code.
   *
   * @param attribute - The attribute to match ('name' or 'property')
   * @param value - The value of that attribute (e.g., 'description', 'og:title')
   * @param content - The content to set
   *
   * @private
   */
  private updateMetaTag(
    attribute: "name" | "property",
    value: string,
    content: string,
  ): void {
    let tag = document.querySelector(
      `meta[${attribute}="${value}"]`,
    ) as HTMLMetaElement;

    // If tag doesn't exist, create it
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attribute, value);
      document.head.appendChild(tag);
    }

    // Update content
    tag.setAttribute("content", content);
  }

  /**
   * Updates or creates the canonical URL link tag
   *
   * The canonical URL tells search engines which is the "official" version
   * of the page, preventing duplicate content issues.
   *
   * @param url - The canonical URL to set
   *
   * @private
   */
  private updateCanonicalUrl(url: string): void {
    let link = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;

    // If link doesn't exist, create it
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }

    // Update href
    link.setAttribute("href", url);
  }
}
