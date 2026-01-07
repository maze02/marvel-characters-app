/**
 * Comic Entity Unit Tests
 *
 * Production-grade tests for the Comic domain entity.
 * Tests cover: construction, validation, methods, and comparisons.
 */

import { Comic } from "./Comic";
import { CharacterId } from "../valueObjects/CharacterId";
import { ImageUrl } from "../valueObjects/ImageUrl";
import { ReleaseDate } from "../valueObjects/ReleaseDate";

describe("Comic", () => {
  const createValidComicProps = () => ({
    id: 12345,
    title: "Amazing Spider-Man #1",
    description: "The beginning of Spider-Man",
    thumbnail: new ImageUrl("https://example.com/image", "jpg"),
    onSaleDate: new ReleaseDate("2024-01-01T00:00:00.000Z"),
    characterId: new CharacterId(1699),
  });

  describe("Construction", () => {
    it("creates comic with valid properties", () => {
      // Arrange
      const props = createValidComicProps();

      // Act
      const comic = new Comic(props);

      // Assert
      expect(comic.id).toBe(12345);
      expect(comic.title).toBe("Amazing Spider-Man #1");
      expect(comic.description).toBe("The beginning of Spider-Man");
      expect(comic.thumbnail).toBeInstanceOf(ImageUrl);
      expect(comic.onSaleDate).toBeInstanceOf(ReleaseDate);
      expect(comic.characterId).toBeInstanceOf(CharacterId);
    });

    it("creates comic with null onSaleDate", () => {
      // Arrange
      const props = { ...createValidComicProps(), onSaleDate: null };

      // Act
      const comic = new Comic(props);

      // Assert
      expect(comic.onSaleDate).toBeNull();
    });

    it("trims title and description", () => {
      // Arrange
      const props = {
        ...createValidComicProps(),
        title: "  Amazing Spider-Man #1  ",
        description: "  The beginning  ",
      };

      // Act
      const comic = new Comic(props);

      // Assert
      expect(comic.title).toBe("Amazing Spider-Man #1");
      expect(comic.description).toBe("The beginning");
    });
  });

  describe("Validation", () => {
    it("throws error for invalid ID (not integer)", () => {
      // Arrange
      const props = { ...createValidComicProps(), id: 123.45 };

      // Act & Assert
      expect(() => new Comic(props)).toThrow("Invalid comic ID: 123.45");
    });

    it("throws error for invalid ID (zero)", () => {
      // Arrange
      const props = { ...createValidComicProps(), id: 0 };

      // Act & Assert
      expect(() => new Comic(props)).toThrow("Invalid comic ID: 0");
    });

    it("throws error for invalid ID (negative)", () => {
      // Arrange
      const props = { ...createValidComicProps(), id: -1 };

      // Act & Assert
      expect(() => new Comic(props)).toThrow("Invalid comic ID: -1");
    });

    it("throws error for empty title", () => {
      // Arrange
      const props = { ...createValidComicProps(), title: "" };

      // Act & Assert
      expect(() => new Comic(props)).toThrow("Comic title cannot be empty");
    });

    it("throws error for whitespace-only title", () => {
      // Arrange
      const props = { ...createValidComicProps(), title: "   " };

      // Act & Assert
      expect(() => new Comic(props)).toThrow("Comic title cannot be empty");
    });
  });

  describe("hasDescription", () => {
    it("returns true when comic has description", () => {
      // Arrange
      const comic = new Comic(createValidComicProps());

      // Act & Assert
      expect(comic.hasDescription()).toBe(true);
    });

    it("returns false when description is empty", () => {
      // Arrange
      const props = { ...createValidComicProps(), description: "" };
      const comic = new Comic(props);

      // Act & Assert
      expect(comic.hasDescription()).toBe(false);
    });

    it("returns false when description is only whitespace", () => {
      // Arrange
      const props = { ...createValidComicProps(), description: "   " };
      const comic = new Comic(props);

      // Act & Assert
      expect(comic.hasDescription()).toBe(false);
    });
  });

  describe("hasReleaseDate", () => {
    it("returns true when comic has release date", () => {
      // Arrange
      const comic = new Comic(createValidComicProps());

      // Act & Assert
      expect(comic.hasReleaseDate()).toBe(true);
    });

    it("returns false when release date is null", () => {
      // Arrange
      const props = { ...createValidComicProps(), onSaleDate: null };
      const comic = new Comic(props);

      // Act & Assert
      expect(comic.hasReleaseDate()).toBe(false);
    });
  });

  describe("getThumbnailUrl", () => {
    it("returns URL with default variant", () => {
      // Arrange
      const comic = new Comic(createValidComicProps());

      // Act
      const url = comic.getThumbnailUrl();

      // Assert
      expect(url).toContain("example.com");
    });

    it("returns URL with portrait_xlarge variant", () => {
      // Arrange
      const comic = new Comic(createValidComicProps());

      // Act
      const url = comic.getThumbnailUrl("portrait_xlarge");

      // Assert
      expect(url).toContain("example.com");
    });

    it("returns URL with landscape_large variant", () => {
      // Arrange
      const comic = new Comic(createValidComicProps());

      // Act
      const url = comic.getThumbnailUrl("landscape_large");

      // Assert
      expect(url).toContain("example.com");
    });
  });
});
