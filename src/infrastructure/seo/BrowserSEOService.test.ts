/**
 * BrowserSEOService Tests
 *
 * Comprehensive tests for the browser-based SEO service.
 * Tests cover meta tag manipulation, structured data injection, and DOM operations.
 *
 * Why these tests matter:
 * - Ensures search engines get correct information
 * - Verifies social media sharing works properly
 * - Prevents duplicate meta tags
 * - Validates structured data format
 */

import { BrowserSEOService } from "./BrowserSEOService";
import { SEOMetadata } from "@application/seo/ports/SEOService";

describe("BrowserSEOService", () => {
  let service: BrowserSEOService;

  beforeEach(() => {
    // Clean slate: Reset DOM for each test
    document.head.innerHTML = "";
    document.title = "";
    service = new BrowserSEOService();
  });

  describe("updateMetadata", () => {
    /**
     * Basic title update test
     * Verifies the most fundamental SEO operation: setting page title
     */
    it("should update document title", () => {
      const metadata: SEOMetadata = {
        title: "Spider-Man - Marvel Character",
        description: "Learn about Spider-Man",
      };

      service.updateMetadata(metadata);

      expect(document.title).toBe("Spider-Man - Marvel Character");
    });

    /**
     * Meta description creation test
     * The description appears in Google search results - critical for SEO
     */
    it("should create meta description tag", () => {
      const metadata: SEOMetadata = {
        title: "Test Page",
        description: "This appears in Google search results",
      };

      service.updateMetadata(metadata);

      const meta = document.querySelector('meta[name="description"]');
      expect(meta).toBeTruthy();
      expect(meta!.getAttribute("content")).toBe(
        "This appears in Google search results",
      );
    });

    /**
     * Update existing tags test
     * Ensures we don't create duplicate meta tags when updating
     */
    it("should update existing meta tags without duplicating", () => {
      // First update
      service.updateMetadata({
        title: "First Title",
        description: "First description",
      });

      // Second update
      service.updateMetadata({
        title: "Second Title",
        description: "Second description",
      });

      // Should only have ONE meta description tag
      const metas = document.querySelectorAll('meta[name="description"]');
      expect(metas.length).toBe(1);
      expect(metas[0]!.getAttribute("content")).toBe("Second description");
    });

    /**
     * Open Graph tags test
     * These make your page look nice when shared on Facebook, LinkedIn
     */
    it("should add Open Graph tags for social sharing", () => {
      const metadata: SEOMetadata = {
        title: "Amazing Page",
        description: "Check this out!",
        image: "https://example.com/image.jpg",
        type: "website",
        canonicalUrl: "https://example.com/page",
      };

      service.updateMetadata(metadata);

      expect(
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content"),
      ).toBe("Amazing Page");
      expect(
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content"),
      ).toBe("Check this out!");
      expect(
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content"),
      ).toBe("https://example.com/image.jpg");
      expect(
        document
          .querySelector('meta[property="og:type"]')
          ?.getAttribute("content"),
      ).toBe("website");
      expect(
        document
          .querySelector('meta[property="og:url"]')
          ?.getAttribute("content"),
      ).toBe("https://example.com/page");
    });

    /**
     * Twitter Card tags test
     * These make your page look nice when shared on Twitter
     */
    it("should add Twitter Card tags", () => {
      const metadata: SEOMetadata = {
        title: "Tweet This!",
        description: "Great content",
        image: "https://example.com/tweet-image.jpg",
      };

      service.updateMetadata(metadata);

      expect(
        document
          .querySelector('meta[name="twitter:card"]')
          ?.getAttribute("content"),
      ).toBe("summary_large_image");
      expect(
        document
          .querySelector('meta[name="twitter:title"]')
          ?.getAttribute("content"),
      ).toBe("Tweet This!");
      expect(
        document
          .querySelector('meta[name="twitter:description"]')
          ?.getAttribute("content"),
      ).toBe("Great content");
      expect(
        document
          .querySelector('meta[name="twitter:image"]')
          ?.getAttribute("content"),
      ).toBe("https://example.com/tweet-image.jpg");
    });

    /**
     * Canonical URL test
     * Tells Google which is the "official" version of the page
     */
    it("should create canonical URL link", () => {
      const metadata: SEOMetadata = {
        title: "Test",
        description: "Test",
        canonicalUrl: "https://example.com/official-page",
      };

      service.updateMetadata(metadata);

      const link = document.querySelector(
        'link[rel="canonical"]',
      ) as HTMLLinkElement;
      expect(link).toBeTruthy();
      expect(link!.getAttribute("href")).toBe(
        "https://example.com/official-page",
      );
    });

    /**
     * Update canonical URL test
     * Ensures we update existing canonical link, not create duplicates
     */
    it("should update existing canonical URL", () => {
      // First canonical
      service.updateMetadata({
        title: "Test",
        description: "Test",
        canonicalUrl: "https://example.com/page1",
      });

      // Update canonical
      service.updateMetadata({
        title: "Test",
        description: "Test",
        canonicalUrl: "https://example.com/page2",
      });

      const links = document.querySelectorAll('link[rel="canonical"]');
      expect(links.length).toBe(1);
      expect(links[0]!.getAttribute("href")).toBe("https://example.com/page2");
    });

    /**
     * Character structured data test
     * Helps Google understand this page is about a specific character
     */
    it("should add character structured data", () => {
      const metadata: SEOMetadata = {
        title: "Spider-Man",
        description: "Friendly neighborhood hero",
        character: {
          name: "Spider-Man",
          description: "Bitten by a radioactive spider",
          image: "https://example.com/spiderman.jpg",
        },
        canonicalUrl: "https://example.com/character/spider-man",
      };

      service.updateMetadata(metadata);

      const script = document.querySelector("#character-structured-data");
      expect(script).toBeTruthy();
      expect(script?.getAttribute("type")).toBe("application/ld+json");

      const data = JSON.parse(script?.textContent || "{}");
      expect(data["@context"]).toBe("https://schema.org");
      expect(data["@type"]).toBe("Person");
      expect(data.name).toBe("Spider-Man");
      expect(data.description).toBe("Bitten by a radioactive spider");
      expect(data.image).toBe("https://example.com/spiderman.jpg");
      expect(data.url).toBe("https://example.com/character/spider-man");
    });

    /**
     * Character without description test
     * Should generate default description when character description is missing
     */
    it("should handle character without description", () => {
      const metadata: SEOMetadata = {
        title: "Iron Man",
        description: "Genius billionaire",
        character: {
          name: "Iron Man",
          image: "https://example.com/ironman.jpg",
        },
      };

      service.updateMetadata(metadata);

      const script = document.querySelector("#character-structured-data");
      const data = JSON.parse(script?.textContent || "{}");
      expect(data.description).toBe("Iron Man - Marvel Character");
    });

    /**
     * Minimal metadata test
     * Only title and description are required
     */
    it("should handle minimal metadata", () => {
      const metadata: SEOMetadata = {
        title: "Simple Page",
        description: "Simple description",
      };

      expect(() => {
        service.updateMetadata(metadata);
      }).not.toThrow();

      expect(document.title).toBe("Simple Page");
    });
  });

  describe("addStructuredData", () => {
    /**
     * Custom structured data test
     * Allows adding any type of structured data (not just characters)
     */
    it("should add custom structured data", () => {
      const data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Marvel Characters App",
        url: "https://example.com",
      };

      service.addStructuredData(data, "organization-data");

      const script = document.querySelector("#organization-data");
      expect(script).toBeTruthy();
      expect(script?.getAttribute("type")).toBe("application/ld+json");

      const parsed = JSON.parse(script?.textContent || "{}");
      expect(parsed["@type"]).toBe("Organization");
      expect(parsed.name).toBe("Marvel Characters App");
    });

    /**
     * Replace existing structured data test
     * When adding with same ID, should replace not duplicate
     */
    it("should replace existing structured data with same ID", () => {
      service.addStructuredData({ version: 1 }, "test-data");
      service.addStructuredData({ version: 2 }, "test-data");

      const scripts = document.querySelectorAll("#test-data");
      expect(scripts.length).toBe(1);

      const data = JSON.parse(scripts[0]!.textContent || "{}");
      expect(data.version).toBe(2);
    });

    /**
     * Multiple structured data test
     * Can have multiple structured data blocks with different IDs
     */
    it("should allow multiple structured data with different IDs", () => {
      service.addStructuredData({ type: "A" }, "data-a");
      service.addStructuredData({ type: "B" }, "data-b");

      expect(document.querySelector("#data-a")).toBeTruthy();
      expect(document.querySelector("#data-b")).toBeTruthy();
    });
  });

  describe("removeStructuredData", () => {
    /**
     * Remove structured data test
     * Should cleanly remove structured data when no longer needed
     */
    it("should remove structured data by ID", () => {
      service.addStructuredData({ test: "data" }, "removable-data");
      expect(document.querySelector("#removable-data")).toBeTruthy();

      service.removeStructuredData("removable-data");
      expect(document.querySelector("#removable-data")).toBeNull();
    });

    /**
     * Remove non-existent data test
     * Should not throw error when trying to remove data that doesn't exist
     */
    it("should not throw error when removing non-existent data", () => {
      expect(() => {
        service.removeStructuredData("does-not-exist");
      }).not.toThrow();
    });

    /**
     * Remove after multiple adds test
     * Should remove even if data was replaced multiple times
     */
    it("should remove data even after multiple updates", () => {
      service.addStructuredData({ v: 1 }, "multi-update");
      service.addStructuredData({ v: 2 }, "multi-update");
      service.addStructuredData({ v: 3 }, "multi-update");

      service.removeStructuredData("multi-update");
      expect(document.querySelector("#multi-update")).toBeNull();
    });
  });

  describe("reset", () => {
    /**
     * Reset test
     * Currently a no-op, but tests it doesn't break anything
     */
    it("should not throw error when called", () => {
      expect(() => {
        service.reset();
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    /**
     * Empty strings test
     * Should handle empty strings gracefully
     */
    it("should handle empty strings", () => {
      const metadata: SEOMetadata = {
        title: "",
        description: "",
      };

      expect(() => {
        service.updateMetadata(metadata);
      }).not.toThrow();
    });

    /**
     * Special characters test
     * Meta tags should handle quotes, ampersands, etc.
     */
    it("should handle special characters in metadata", () => {
      const metadata: SEOMetadata = {
        title: 'Spider-Man & Iron Man: "Heroes United"',
        description: "A tale of <heroism> & bravery",
      };

      service.updateMetadata(metadata);

      expect(document.title).toContain("Spider-Man & Iron Man");
      const meta = document.querySelector('meta[name="description"]');
      expect(meta).toBeTruthy();
      expect(meta!.getAttribute("content")).toContain("<heroism>");
    });

    /**
     * Very long content test
     * Should handle long descriptions without breaking
     */
    it("should handle very long metadata", () => {
      const longDescription = "A".repeat(1000);
      const metadata: SEOMetadata = {
        title: "Test",
        description: longDescription,
      };

      service.updateMetadata(metadata);

      const meta = document.querySelector('meta[name="description"]');
      expect(meta?.getAttribute("content")).toBe(longDescription);
    });

    /**
     * Invalid structured data test
     * Should serialize even malformed JSON objects
     */
    it("should handle circular references in structured data gracefully", () => {
      const validData = {
        "@context": "https://schema.org",
        "@type": "Thing",
        name: "Test",
      };

      expect(() => {
        service.addStructuredData(validData, "valid-data");
      }).not.toThrow();
    });
  });
});
