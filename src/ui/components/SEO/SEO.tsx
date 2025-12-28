/**
 * SEO Component
 *
 * This component helps search engines understand what your page is about.
 * It adds special tags that tell Google and other search engines:
 * - What the page title is
 * - What the page is about (description)
 * - How it should look when shared on social media (Facebook, Twitter, etc.)
 * - Information about characters (for character detail pages)
 *
 * This makes your site appear better in search results and look nicer when shared.
 *
 * Implementation Details:
 * - Uses Dependency Injection to get the SEO service
 * - Follows Clean Architecture / Hexagonal Architecture principles
 * - No direct DOM manipulation - delegates to SEOService
 */

import React, { useEffect } from "react";
import { useServices } from "@ui/state/DependenciesContext";
import { SEOMetadata } from "@application/seo/ports/SEOService";

/**
 * SEO Component Props
 *
 * Extends SEOMetadata with optional additional structured data.
 */
export interface SEOProps extends SEOMetadata {
  /**
   * Optional: Additional structured data to inject
   * This is separate from the main metadata and can be used for custom JSON-LD.
   */
  structuredData?: Record<string, unknown>;
}

/**
 * SEO Component
 *
 * Automatically updates page metadata for search engines and social media.
 * This component doesn't render anything visible - it only updates hidden tags
 * that search engines read.
 *
 * Architecture:
 * - UI Layer component (presentation/infrastructure concern)
 * - Uses SEOService via Dependency Injection
 * - Follows Dependency Inversion Principle
 *
 * Clean Code Principles:
 * - Single Responsibility: Only manages SEO metadata lifecycle
 * - Dependency Injection: Gets SEO service from DI container
 * - No direct DOM manipulation: Delegates to SEOService
 *
 * @example
 * ```tsx
 * <SEO
 *   title="Spider-Man - Marvel Character Profile"
 *   description="Learn about Spider-Man, his comics, and story"
 *   image="/spider-man-image.jpg"
 *   canonicalUrl="https://example.com/character/spider-man"
 * />
 * ```
 */
export const SEO: React.FC<SEOProps> = ({ structuredData, ...metadata }) => {
  // Get SEO service from DI container (Hexagonal Architecture pattern)
  const { seo } = useServices();

  // Update metadata when props change
  // Note: We list individual properties instead of the whole `metadata` object
  // to avoid infinite re-renders (objects are compared by reference, not value).
  // This is intentional and correct behavior.
  useEffect(() => {
    seo.updateMetadata(metadata);
    // metadata object is intentionally excluded to avoid infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    seo,
    metadata.title,
    metadata.description,
    metadata.image,
    metadata.type,
    metadata.canonicalUrl,
    metadata.character,
  ]);

  // Inject additional structured data if provided
  useEffect(() => {
    if (structuredData) {
      seo.addStructuredData(structuredData, "additional-structured-data");
    }

    // Cleanup on unmount
    return () => {
      if (structuredData) {
        seo.removeStructuredData("additional-structured-data");
      }
    };
  }, [seo, structuredData]);

  // This component doesn't render anything visible
  return null;
};
