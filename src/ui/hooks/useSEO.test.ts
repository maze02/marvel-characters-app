/**
 * useSEO Hook Unit Tests
 *
 * Tests for the SEO hook.
 * Tests cover: title updates, meta tags, Open Graph, Twitter Cards, canonical URL, structured data.
 */

import { renderHook } from "@testing-library/react";
import { useSEO, SEOConfig } from "./useSEO";

describe("useSEO", () => {
  beforeEach(() => {
    // Reset document head before each test
    document.head.innerHTML =
      '<meta name="description" content="Original description">';
    document.title = "Original Title";
  });

  describe("Title Updates", () => {
    it("updates document title", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Spider-Man | Marvel Characters",
        description: "Spider-Man character page",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(document.title).toBe("Spider-Man | Marvel Characters");
    });
  });

  describe("Meta Description", () => {
    it("updates meta description when it exists", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Spider-Man",
        description: "Bitten by a radioactive spider",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      const descriptionMeta = document.querySelector(
        'meta[name="description"]',
      );
      expect(descriptionMeta?.getAttribute("content")).toBe(
        "Bitten by a radioactive spider",
      );
    });
  });

  describe("Open Graph Tags", () => {
    it("creates OG tags when they do not exist", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Spider-Man",
        description: "Friendly neighborhood hero",
        image: "https://example.com/spiderman.jpg",
        type: "profile",
        canonicalUrl: "https://example.com/characters/spider-man",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content"),
      ).toBe("Spider-Man");
      expect(
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content"),
      ).toBe("Friendly neighborhood hero");
      expect(
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content"),
      ).toBe("https://example.com/spiderman.jpg");
      expect(
        document
          .querySelector('meta[property="og:type"]')
          ?.getAttribute("content"),
      ).toBe("profile");
      expect(
        document
          .querySelector('meta[property="og:url"]')
          ?.getAttribute("content"),
      ).toBe("https://example.com/characters/spider-man");
    });

    it("updates existing OG tags", () => {
      // Arrange
      const ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      ogTitle.setAttribute("content", "Old Title");
      document.head.appendChild(ogTitle);

      const config: SEOConfig = {
        title: "New Title",
        description: "New Description",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content"),
      ).toBe("New Title");
    });

    it("handles missing optional OG fields", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Spider-Man",
        description: "Hero",
        // No image, type, or canonicalUrl
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content"),
      ).toBe("Spider-Man");
      expect(document.querySelector('meta[property="og:image"]')).toBeNull();
      expect(document.querySelector('meta[property="og:type"]')).toBeNull();
      expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    });
  });

  describe("Twitter Card Tags", () => {
    it("creates Twitter Card tags", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Iron Man",
        description: "Genius billionaire playboy philanthropist",
        image: "https://example.com/ironman.jpg",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(
        document
          .querySelector('meta[name="twitter:card"]')
          ?.getAttribute("content"),
      ).toBe("summary_large_image");
      expect(
        document
          .querySelector('meta[name="twitter:title"]')
          ?.getAttribute("content"),
      ).toBe("Iron Man");
      expect(
        document
          .querySelector('meta[name="twitter:description"]')
          ?.getAttribute("content"),
      ).toBe("Genius billionaire playboy philanthropist");
      expect(
        document
          .querySelector('meta[name="twitter:image"]')
          ?.getAttribute("content"),
      ).toBe("https://example.com/ironman.jpg");
    });

    it("updates existing Twitter Card tags", () => {
      // Arrange
      const twitterTitle = document.createElement("meta");
      twitterTitle.setAttribute("name", "twitter:title");
      twitterTitle.setAttribute("content", "Old Title");
      document.head.appendChild(twitterTitle);

      const config: SEOConfig = {
        title: "New Title",
        description: "New Description",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(
        document
          .querySelector('meta[name="twitter:title"]')
          ?.getAttribute("content"),
      ).toBe("New Title");
    });

    it("handles missing optional Twitter fields", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Spider-Man",
        description: "Hero",
        // No image
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(
        document
          .querySelector('meta[name="twitter:card"]')
          ?.getAttribute("content"),
      ).toBe("summary_large_image");
      expect(
        document
          .querySelector('meta[name="twitter:title"]')
          ?.getAttribute("content"),
      ).toBe("Spider-Man");
      expect(document.querySelector('meta[name="twitter:image"]')).toBeNull();
    });
  });

  describe("Canonical URL", () => {
    it("creates canonical link when it does not exist", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Captain America",
        description: "Super soldier",
        canonicalUrl: "https://example.com/characters/captain-america",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute("href")).toBe(
        "https://example.com/characters/captain-america",
      );
    });

    it("updates existing canonical link", () => {
      // Arrange
      const existingCanonical = document.createElement("link");
      existingCanonical.setAttribute("rel", "canonical");
      existingCanonical.setAttribute("href", "https://old-url.com");
      document.head.appendChild(existingCanonical);

      const config: SEOConfig = {
        title: "Thor",
        description: "God of Thunder",
        canonicalUrl: "https://new-url.com/characters/thor",
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute("href")).toBe(
        "https://new-url.com/characters/thor",
      );
    });

    it("does not create canonical link when URL not provided", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Black Widow",
        description: "Spy",
        // No canonicalUrl
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    });
  });

  describe("Structured Data for Characters", () => {
    it("creates structured data script for character", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Hulk",
        description: "Strongest Avenger",
        character: {
          name: "Hulk",
          description: "Bruce Banner transformed",
          image: "https://example.com/hulk.jpg",
        },
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      const script = document.querySelector("#character-structured-data");
      expect(script).not.toBeNull();
      expect(script?.getAttribute("type")).toBe("application/ld+json");

      const structuredData = JSON.parse(script?.textContent || "{}");
      expect(structuredData["@context"]).toBe("https://schema.org");
      expect(structuredData["@type"]).toBe("Person");
      expect(structuredData.name).toBe("Hulk");
      expect(structuredData.description).toBe("Bruce Banner transformed");
      expect(structuredData.image).toBe("https://example.com/hulk.jpg");
    });

    it("includes URL in structured data when canonical URL provided", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Thor",
        description: "God of Thunder",
        canonicalUrl: "https://example.com/characters/thor",
        character: {
          name: "Thor",
        },
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      const script = document.querySelector("#character-structured-data");
      const structuredData = JSON.parse(script?.textContent || "{}");
      expect(structuredData.url).toBe("https://example.com/characters/thor");
    });

    it("uses default description when character description not provided", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Hawkeye",
        description: "Master archer",
        character: {
          name: "Hawkeye",
        },
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      const script = document.querySelector("#character-structured-data");
      const structuredData = JSON.parse(script?.textContent || "{}");
      expect(structuredData.description).toBe("Hawkeye - Marvel Character");
    });

    it("removes existing structured data before adding new one", () => {
      // Arrange
      const oldScript = document.createElement("script");
      oldScript.id = "character-structured-data";
      oldScript.type = "application/ld+json";
      oldScript.textContent = JSON.stringify({ name: "Old Character" });
      document.head.appendChild(oldScript);

      const config: SEOConfig = {
        title: "Black Panther",
        description: "King of Wakanda",
        character: {
          name: "Black Panther",
        },
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      const scripts = document.querySelectorAll("#character-structured-data");
      expect(scripts.length).toBe(1); // Only one script should exist

      const structuredData = JSON.parse(scripts[0]!.textContent || "{}");
      expect(structuredData.name).toBe("Black Panther");
    });

    it("does not create structured data when character not provided", () => {
      // Arrange
      const config: SEOConfig = {
        title: "Marvel Characters",
        description: "Browse all Marvel characters",
        // No character
      };

      // Act
      renderHook(() => useSEO(config));

      // Assert
      expect(document.querySelector("#character-structured-data")).toBeNull();
    });
  });

  describe("Config Updates", () => {
    it("updates SEO when config changes", () => {
      // Arrange
      const initialConfig: SEOConfig = {
        title: "Initial Title",
        description: "Initial Description",
      };

      const { rerender } = renderHook(({ config }) => useSEO(config), {
        initialProps: { config: initialConfig },
      });

      expect(document.title).toBe("Initial Title");

      // Act
      const newConfig: SEOConfig = {
        title: "Updated Title",
        description: "Updated Description",
      };

      rerender({ config: newConfig });

      // Assert
      expect(document.title).toBe("Updated Title");
      const descriptionMeta = document.querySelector(
        'meta[name="description"]',
      );
      expect(descriptionMeta?.getAttribute("content")).toBe(
        "Updated Description",
      );
    });
  });
});
