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
 */

import React from "react";
import { useSEO, SEOConfig } from "@ui/hooks/useSEO";

/**
 * SEO Component Props
 */
export interface SEOProps extends SEOConfig {
  /** Optional: Additional structured data to inject */
  structuredData?: Record<string, unknown>;
}

/**
 * SEO Component
 *
 * Automatically updates page metadata for search engines and social media.
 * This component doesn't render anything visible - it only updates hidden tags
 * that search engines read.
 *
 * @example
 * ```tsx
 * <SEO
 *   title="Spider-Man - Marvel Character Profile"
 *   description="Learn about Spider-Man, his comics, and story"
 *   image="/spider-man-image.jpg"
 * />
 * ```
 */
export const SEO: React.FC<SEOProps> = (props) => {
  // Use the SEO hook to update all meta tags
  useSEO(props);

  // Also inject additional structured data if provided
  React.useEffect(() => {
    if (props.structuredData) {
      const existingScript = document.querySelector(
        "#additional-structured-data",
      );
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.id = "additional-structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(props.structuredData);
      document.head.appendChild(script);
    }
  }, [props.structuredData]);

  // This component doesn't render anything visible
  return null;
};
