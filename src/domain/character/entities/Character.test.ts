/**
 * Character Entity Unit Tests
 *
 * Production-grade tests for the Character domain entity.
 * Tests cover: construction, validation, methods, and comparisons.
 */

import { Character } from "./Character";
import { CharacterId } from "../valueObjects/CharacterId";
import { CharacterName } from "../valueObjects/CharacterName";
import { ImageUrl } from "../valueObjects/ImageUrl";

describe("Character", () => {
  const createValidCharacterProps = () => ({
    id: new CharacterId(1699),
    name: new CharacterName("Spider-Man"),
    description: "A hero bitten by a radioactive spider",
    thumbnail: new ImageUrl("https://example.com/image", "jpg"),
    modifiedDate: new Date("2024-01-15T10:30:00.000Z"),
    issueIds: [1, 2, 3],
  });

  describe("Construction", () => {
    it("creates character with valid properties", () => {
      // Arrange
      const props = createValidCharacterProps();

      // Act
      const character = new Character(props);

      // Assert
      expect(character.id).toBeInstanceOf(CharacterId);
      expect(character.id.value).toBe(1699);
      expect(character.name).toBeInstanceOf(CharacterName);
      expect(character.name.value).toBe("Spider-Man");
      expect(character.description).toBe(
        "A hero bitten by a radioactive spider",
      );
      expect(character.thumbnail).toBeInstanceOf(ImageUrl);
      expect(character.modifiedDate).toBeInstanceOf(Date);
    });

    it("creates character with empty issueIds", () => {
      // Arrange
      const props = { ...createValidCharacterProps(), issueIds: [] };

      // Act
      const character = new Character(props);

      // Assert
      expect(character).toBeDefined();
    });

    it("creates character with empty description", () => {
      // Arrange
      const props = { ...createValidCharacterProps(), description: "" };

      // Act
      const character = new Character(props);

      // Assert
      expect(character.description).toBe("");
    });
  });

  describe("hasDescription", () => {
    it("returns true when character has description", () => {
      // Arrange
      const character = new Character(createValidCharacterProps());

      // Act & Assert
      expect(character.hasDescription()).toBe(true);
    });

    it("returns false when description is empty", () => {
      // Arrange
      const props = { ...createValidCharacterProps(), description: "" };
      const character = new Character(props);

      // Act & Assert
      expect(character.hasDescription()).toBe(false);
    });

    it("returns false when description is only whitespace", () => {
      // Arrange
      const props = { ...createValidCharacterProps(), description: "   " };
      const character = new Character(props);

      // Act & Assert
      expect(character.hasDescription()).toBe(false);
    });
  });

  describe("getThumbnailUrl", () => {
    it("returns URL with default variant", () => {
      // Arrange
      const character = new Character(createValidCharacterProps());

      // Act
      const url = character.getThumbnailUrl();

      // Assert
      expect(url).toContain("example.com");
    });

    it("returns URL with portrait_xlarge variant", () => {
      // Arrange
      const character = new Character(createValidCharacterProps());

      // Act
      const url = character.getThumbnailUrl("portrait_xlarge");

      // Assert
      expect(url).toContain("example.com");
    });

    it("returns URL with landscape_large variant", () => {
      // Arrange
      const character = new Character(createValidCharacterProps());

      // Act
      const url = character.getThumbnailUrl("landscape_large");

      // Assert
      expect(url).toContain("example.com");
    });
  });

  describe("compareByName", () => {
    it("returns 0 for same name", () => {
      // Arrange
      const char1 = new Character(createValidCharacterProps());
      const char2 = new Character({
        ...createValidCharacterProps(),
        id: new CharacterId(9999),
      });

      // Act
      const result = char1.compareByName(char2);

      // Assert
      expect(result).toBe(0);
    });

    it("returns negative for earlier alphabetical name", () => {
      // Arrange
      const char1 = new Character({
        ...createValidCharacterProps(),
        name: new CharacterName("Amazing Spider-Man"),
      });
      const char2 = new Character({
        ...createValidCharacterProps(),
        id: new CharacterId(9999),
        name: new CharacterName("Spectacular Spider-Man"),
      });

      // Act
      const result = char1.compareByName(char2);

      // Assert
      expect(result).toBeLessThan(0);
    });

    it("returns positive for later alphabetical name", () => {
      // Arrange
      const char1 = new Character({
        ...createValidCharacterProps(),
        name: new CharacterName("Spectacular Spider-Man"),
      });
      const char2 = new Character({
        ...createValidCharacterProps(),
        id: new CharacterId(9999),
        name: new CharacterName("Amazing Spider-Man"),
      });

      // Act
      const result = char1.compareByName(char2);

      // Assert
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("compareByDate", () => {
    it("returns 0 for same date", () => {
      // Arrange
      const date = new Date("2024-01-15T10:30:00.000Z");
      const char1 = new Character({
        ...createValidCharacterProps(),
        modifiedDate: date,
      });
      const char2 = new Character({
        ...createValidCharacterProps(),
        id: new CharacterId(9999),
        modifiedDate: date,
      });

      // Act
      const result = char1.compareByDate(char2);

      // Assert
      expect(result).toBe(0);
    });

    it("returns negative for earlier date", () => {
      // Arrange
      const char1 = new Character({
        ...createValidCharacterProps(),
        modifiedDate: new Date("2024-01-01T00:00:00.000Z"),
      });
      const char2 = new Character({
        ...createValidCharacterProps(),
        id: new CharacterId(9999),
        modifiedDate: new Date("2024-02-01T00:00:00.000Z"),
      });

      // Act
      const result = char1.compareByDate(char2);

      // Assert
      expect(result).toBeLessThan(0);
    });

    it("returns positive for later date", () => {
      // Arrange
      const char1 = new Character({
        ...createValidCharacterProps(),
        modifiedDate: new Date("2024-02-01T00:00:00.000Z"),
      });
      const char2 = new Character({
        ...createValidCharacterProps(),
        id: new CharacterId(9999),
        modifiedDate: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Act
      const result = char1.compareByDate(char2);

      // Assert
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("equals", () => {
    it("returns true for characters with same ID", () => {
      // Arrange
      const char1 = new Character(createValidCharacterProps());
      const char2 = new Character({
        ...createValidCharacterProps(),
        name: new CharacterName("Different Name"),
      });

      // Act & Assert
      expect(char1.equals(char2)).toBe(true);
    });

    it("returns false for characters with different IDs", () => {
      // Arrange
      const char1 = new Character(createValidCharacterProps());
      const char2 = new Character({
        ...createValidCharacterProps(),
        id: new CharacterId(9999),
      });

      // Act & Assert
      expect(char1.equals(char2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns string representation", () => {
      // Arrange
      const character = new Character(createValidCharacterProps());

      // Act
      const result = character.toString();

      // Assert
      expect(result).toBe("Character(1699, Spider-Man)");
    });
  });
});
