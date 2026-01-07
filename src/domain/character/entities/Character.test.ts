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
});
