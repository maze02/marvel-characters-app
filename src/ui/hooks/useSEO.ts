/**
 * SEO Hook
 *
 * This hook helps search engines understand what each page is about.
 * It updates the page title, description, and social media preview tags
 * so that the site looks good in Google search results and when shared on social media.
 */

import { useEffect } from "react";

/**
 * SEO configuration for a page
 *
 * These settings control how the page appears in search results and social media.
 */
export interface SEOConfig {
  /** The title that appears in browser tabs and search results */
  title: string;
  /** A short description that shows up in search results (keep it under 160 characters) */
  description: string;
  /** The main image shown when someone shares your page on social media */
  image?: string;
  /** The type of page (website, article, profile, etc.) */
  type?: string;
  /** The full URL of the page (helps prevent duplicate content issues) */
  canonicalUrl?: string;
  /** Character data for character detail pages (helps Google understand the character) */
  character?: {
    name: string;
    description?: string;
    image?: string;
  };
}

/**
 * Updates the page's SEO tags dynamically
 *
 * This function changes the page title, description, and social media tags
 * so each page can have its own unique information for search engines.
 */
export function useSEO(config: SEOConfig) {
  useEffect(() => {
    // Updates the page title (what you see in the browser tab)
    if (config.title) {
      document.title = config.title;
    }

    // Updates the meta description (the text that appears under the page in Google search)
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta && config.description) {
      descriptionMeta.setAttribute("content", config.description);
    }

    // Updates Open Graph tags (makes the page look nice when shared on Facebook, LinkedIn, etc.)
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(
        `meta[property="${property}"]`,
      ) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    if (config.title) updateOGTag("og:title", config.title);
    if (config.description) updateOGTag("og:description", config.description);
    if (config.image) updateOGTag("og:image", config.image);
    if (config.type) updateOGTag("og:type", config.type);
    if (config.canonicalUrl) updateOGTag("og:url", config.canonicalUrl);

    // Update Twitter Card tags (makes your page look nice when shared on Twitter)
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(
        `meta[name="${name}"]`,
      ) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateTwitterTag("twitter:card", "summary_large_image");
    if (config.title) updateTwitterTag("twitter:title", config.title);
    if (config.description)
      updateTwitterTag("twitter:description", config.description);
    if (config.image) updateTwitterTag("twitter:image", config.image);

    // Update canonical URL (tells Google which is the "official" version of the page)
    const canonicalLink = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (config.canonicalUrl) {
      if (canonicalLink) {
        canonicalLink.setAttribute("href", config.canonicalUrl);
      } else {
        const link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        link.setAttribute("href", config.canonicalUrl);
        document.head.appendChild(link);
      }
    }

    // Add structured data for character pages (helps Google understand character information)
    if (config.character) {
      const existingScript = document.querySelector(
        "#character-structured-data",
      );
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.id = "character-structured-data";
      script.type = "application/ld+json";
      const structuredData: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: config.character.name,
        description:
          config.character.description ||
          `${config.character.name} - Marvel Character`,
        image: config.character.image,
      };

      // Add URL if canonical URL is provided
      if (config.canonicalUrl) {
        structuredData.url = config.canonicalUrl;
      }

      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [config]);
}
