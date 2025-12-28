/**
 * ComicVineCharacterMapper Unit Tests
 *
 * Production-grade tests for Comic Vine API to domain entity mapping.
 * Tests cover: happy paths, edge cases, error handling, and HTML cleaning.
 */

import { ComicVineCharacterMapper } from "./ComicVineCharacterMapper";
import { Character } from "@domain/character/entities/Character";
import { ComicVineCharacterResponse } from "../dtos/ComicVineCharacterDTO";

describe("ComicVineCharacterMapper", () => {
  const createValidApiResponse = (
    overrides?: Partial<ComicVineCharacterResponse>,
  ): ComicVineCharacterResponse => ({
    id: 1699,
    name: "Spider-Man",
    deck: "Friendly neighborhood hero",
    description: "<p>Bitten by a radioactive spider.</p>",
    image: {
      icon_url:
        "https://comicvine.gamespot.com/a/uploads/square_avatar/11/11111/123456-spider-man.jpg",
      medium_url:
        "https://comicvine.gamespot.com/a/uploads/scale_medium/11/11111/123456-spider-man.jpg",
      screen_url:
        "https://comicvine.gamespot.com/a/uploads/screen_medium/11/11111/123456-spider-man.jpg",
      screen_large_url:
        "https://comicvine.gamespot.com/a/uploads/screen_kubrick/11/11111/123456-spider-man.jpg",
      small_url:
        "https://comicvine.gamespot.com/a/uploads/scale_small/11/11111/123456-spider-man.jpg",
      super_url:
        "https://comicvine.gamespot.com/a/uploads/original/11/11111/123456-spider-man.jpg",
      thumb_url:
        "https://comicvine.gamespot.com/a/uploads/scale_avatar/11/11111/123456-spider-man.jpg",
      tiny_url:
        "https://comicvine.gamespot.com/a/uploads/square_mini/11/11111/123456-spider-man.jpg",
      original_url:
        "https://comicvine.gamespot.com/a/uploads/original/11/11111/123456-spider-man.jpg",
    },
    publisher: {
      id: 31,
      name: "Marvel Comics",
    },
    date_added: "2024-01-01T00:00:00",
    date_last_updated: "2024-01-15T10:30:00",
    site_detail_url: "https://comicvine.gamespot.com/spider-man/4005-1699/",
    api_detail_url: "https://comicvine.gamespot.com/api/character/4005-1699/",
    ...overrides,
  });

  describe("toDomain", () => {
    describe("Happy Path", () => {
      it("maps complete API response to Character entity", () => {
        // Arrange
        const apiResponse = createValidApiResponse();

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character).toBeInstanceOf(Character);
        expect(character.id.value).toBe(1699);
        expect(character.name.value).toBe("Spider-Man");
        expect(character.description).toBe("Bitten by a radioactive spider.");
        expect(character.modifiedDate).toBeInstanceOf(Date);
      });

      it("strips HTML tags from description", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          description:
            "<h2>Title</h2><p>Description with <strong>bold</strong> text.</p>",
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.description).toBe("Title Description with bold text.");
        expect(character.description).not.toContain("<");
        expect(character.description).not.toContain(">");
      });

      it("decodes HTML entities", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          description:
            "Spider-Man&apos;s real name is Peter&nbsp;Parker. He&amp;#39;s a hero.",
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.description).toContain("Spider-Man's");
        expect(character.description).toContain("Peter Parker");
        expect(character.description).not.toContain("&nbsp;");
        expect(character.description).not.toContain("&amp;");
      });

      it("includes issue IDs when provided", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          issue_credits: [
            { id: 1, api_detail_url: "url1" },
            { id: 2, api_detail_url: "url2" },
          ],
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character).toBeDefined();
        // Note: issueIds is internal, we just verify mapping doesn't throw
      });
    });

    describe("Description Handling", () => {
      it("uses deck when description is null", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          description: null,
          deck: "Short deck description",
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.description).toBe("Short deck description");
      });

      it("prefers description over deck", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          description: "Full description",
          deck: "Short deck",
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.description).toBe("Full description");
      });

      it("returns empty string when both description and deck are null", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          description: null,
          deck: null,
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.description).toBe("");
      });

      it("normalizes extra whitespace", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          description: "<p>Text   with    extra     spaces</p>",
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.description).toBe("Text with extra spaces");
      });
    });

    describe("Image URL Handling", () => {
      it("creates ImageUrl from medium_url", () => {
        // Arrange
        const apiResponse = createValidApiResponse();

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.thumbnail.url).toContain("comicvine.gamespot.com");
        expect(character.thumbnail.url).toContain(".jpg");
      });

      it("falls back to screen_url when medium_url is missing", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          image: {
            ...createValidApiResponse().image,
            medium_url: "",
            screen_url: "https://example.com/screen.jpg",
          },
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.thumbnail.url).toContain("example.com");
      });

      it("falls back to original_url when other URLs missing", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          image: {
            ...createValidApiResponse().image,
            medium_url: "",
            screen_url: "",
            original_url: "https://example.com/original.png",
          },
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.thumbnail.url).toContain("example.com");
      });

      it("uses placeholder when no image URLs available", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          image: {
            icon_url: "",
            medium_url: "",
            screen_url: "",
            screen_large_url: "",
            small_url: "",
            super_url: "",
            thumb_url: "",
            tiny_url: "",
            original_url: "",
          },
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.thumbnail.url).toContain("placeholder");
      });
    });

    describe("Edge Cases", () => {
      it("handles special characters in name", () => {
        // Arrange
        const apiResponse = createValidApiResponse({
          name: "Spider-Man™ (Peter B. Parker) / The Amazing Spider-Man's Clone",
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.name.value).toBe(
          "Spider-Man™ (Peter B. Parker) / The Amazing Spider-Man's Clone",
        );
      });

      it("handles very long descriptions", () => {
        // Arrange
        const longDescription = "<p>" + "A".repeat(10000) + "</p>";
        const apiResponse = createValidApiResponse({
          description: longDescription,
        });

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character.description.length).toBeGreaterThan(5000);
      });

      it("handles missing issue_credits", () => {
        // Arrange
        const apiResponse = createValidApiResponse();
        delete apiResponse.issue_credits;

        // Act
        const character = ComicVineCharacterMapper.toDomain(apiResponse);

        // Assert
        expect(character).toBeDefined();
      });
    });
  });

  describe("toDomainList", () => {
    it("maps array of responses to Character entities", () => {
      // Arrange
      const responses = [
        createValidApiResponse({ id: 1, name: "Spider-Man" }),
        createValidApiResponse({ id: 2, name: "Iron Man" }),
        createValidApiResponse({ id: 3, name: "Captain America" }),
      ];

      // Act
      const characters = ComicVineCharacterMapper.toDomainList(responses);

      // Assert
      expect(characters).toHaveLength(3);
      expect(characters[0]!.name.value).toBe("Spider-Man");
      expect(characters[1]!.name.value).toBe("Iron Man");
      expect(characters[2]!.name.value).toBe("Captain America");
      characters.forEach((char) => expect(char).toBeInstanceOf(Character));
    });

    it("handles empty array", () => {
      // Arrange
      const responses: ComicVineCharacterResponse[] = [];

      // Act
      const characters = ComicVineCharacterMapper.toDomainList(responses);

      // Assert
      expect(characters).toHaveLength(0);
      expect(characters).toEqual([]);
    });

    it("processes all valid entries", () => {
      // Arrange
      const responses = [createValidApiResponse()];

      // Act
      const characters = ComicVineCharacterMapper.toDomainList(responses);

      // Assert
      expect(characters).toHaveLength(1);
      expect(characters[0]).toBeInstanceOf(Character);
    });
  });
});
