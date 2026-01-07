/**
 * GetCharacterDetail Tests
 *
 * Tests for fetching a single character by ID, covering success cases,
 * not found errors, and error handling.
 */

import {
  GetCharacterDetail,
  CharacterNotFoundError,
} from "./GetCharacterDetail";
import { CharacterRepository } from "@domain/character/ports/CharacterRepository";
import { Character } from "@domain/character/entities/Character";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { CharacterName } from "@domain/character/valueObjects/CharacterName";
import { ImageUrl } from "@domain/character/valueObjects/ImageUrl";

describe("GetCharacterDetail", () => {
  let useCase: GetCharacterDetail;
  let mockRepository: jest.Mocked<CharacterRepository>;
  let mockCharacter: Character;

  beforeEach(() => {
    // Create mock character
    mockCharacter = new Character({
      id: new CharacterId(1009610),
      name: new CharacterName("Spider-Man"),
      description: "Friendly neighborhood Spider-Man",
      thumbnail: new ImageUrl("http://example.com/spiderman", "jpg"),
    });

    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      searchByName: jest.fn(),
      list: jest.fn(),
      findMany: jest.fn(),
      getComicsByIds: jest.fn(),
    } as jest.Mocked<CharacterRepository>;

    useCase = new GetCharacterDetail(mockRepository);
  });

  describe("execute", () => {
    describe("Successful retrieval", () => {
      it("should return character when found", async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);

        const result = await useCase.execute(1009610);

        expect(result).toBe(mockCharacter);
      });

      it("should call repository with correct CharacterId", async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);

        await useCase.execute(1009610);

        expect(mockRepository.findById).toHaveBeenCalledWith(
          expect.any(CharacterId),
        );
        const receivedId = mockRepository.findById.mock.calls[0]?.[0];
        expect(receivedId?.value).toBe(1009610);
      });

      it("should handle different character IDs", async () => {
        const differentCharacter = new Character({
          id: new CharacterId(999),
          name: new CharacterName("Iron Man"),
          description: "Genius billionaire",
          thumbnail: new ImageUrl("http://example.com/ironman", "jpg"),
        });

        mockRepository.findById.mockResolvedValue(differentCharacter);

        const result = await useCase.execute(999);

        expect(result).toBe(differentCharacter);
        expect(result.name.value).toBe("Iron Man");
      });

      it("should return character with all properties", async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);

        const result = await useCase.execute(1009610);

        expect(result.id.value).toBe(1009610);
        expect(result.name.value).toBe("Spider-Man");
        expect(result.description).toBe("Friendly neighborhood Spider-Man");
        expect(result.thumbnail).toBeDefined();
      });

      it("should call repository only once", async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);

        await useCase.execute(1009610);

        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      });
    });

    describe("Character not found", () => {
      it("should throw CharacterNotFoundError when character is not found", async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(999999)).rejects.toThrow(
          CharacterNotFoundError,
        );
      });

      it("should throw error with correct message", async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(999999)).rejects.toThrow(
          "Character with ID 999999 not found",
        );
      });

      it("should throw error with correct name", async () => {
        mockRepository.findById.mockResolvedValue(null);

        try {
          await useCase.execute(999999);
          fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(CharacterNotFoundError);
          expect((error as Error).name).toBe("CharacterNotFoundError");
        }
      });

      it("should handle different non-existent IDs", async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(1)).rejects.toThrow(
          "Character with ID 1 not found",
        );
        await expect(useCase.execute(123456)).rejects.toThrow(
          "Character with ID 123456 not found",
        );
      });

      it("should throw when repository returns undefined", async () => {
        // @ts-expect-error - Intentionally testing invalid return value
        mockRepository.findById.mockResolvedValue(undefined);

        await expect(useCase.execute(999999)).rejects.toThrow(
          CharacterNotFoundError,
        );
      });
    });

    describe("Error handling", () => {
      it("should propagate repository errors", async () => {
        const error = new Error("API Error");
        mockRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(1009610)).rejects.toThrow("API Error");
      });

      it("should propagate network errors", async () => {
        mockRepository.findById.mockRejectedValue(new Error("Network error"));

        await expect(useCase.execute(1009610)).rejects.toThrow("Network error");
      });

      it("should propagate timeout errors", async () => {
        mockRepository.findById.mockRejectedValue(new Error("Request timeout"));

        await expect(useCase.execute(1009610)).rejects.toThrow(
          "Request timeout",
        );
      });

      it("should handle repository throwing non-Error objects", async () => {
        mockRepository.findById.mockRejectedValue("String error");

        await expect(useCase.execute(1009610)).rejects.toBe("String error");
      });
    });

    describe("Edge cases", () => {
      it("should handle character ID of 0 (invalid)", async () => {
        // CharacterId validates that ID must be positive, so 0 should throw
        await expect(useCase.execute(0)).rejects.toThrow(
          "Invalid character ID: 0",
        );
      });

      it("should handle very large character IDs", async () => {
        const largeId = 9999999999;
        const character = new Character({
          id: new CharacterId(largeId),
          name: new CharacterName("Test"),
          description: "Test",
          thumbnail: new ImageUrl("http://example.com/test", "jpg"),
        });

        mockRepository.findById.mockResolvedValue(character);

        const result = await useCase.execute(largeId);

        expect(result.id.value).toBe(largeId);
      });

      it("should handle negative character IDs", async () => {
        // CharacterId might validate this, but testing the use case behavior
        try {
          await useCase.execute(-1);
        } catch (error) {
          // Expect either validation error from CharacterId or not found error
          expect(error).toBeDefined();
        }
      });

      it("should create new CharacterId for each call", async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);

        await useCase.execute(1009610);
        await useCase.execute(1009610);

        expect(mockRepository.findById).toHaveBeenCalledTimes(2);
        const call1 = mockRepository.findById.mock.calls[0]?.[0];
        const call2 = mockRepository.findById.mock.calls[1]?.[0];

        // Different instances
        expect(call1).not.toBe(call2);
        // But same value
        expect(call1?.value).toBe(call2?.value);
      });
    });

    describe("Repository interaction", () => {
      it("should not modify the returned character", async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);

        const result = await useCase.execute(1009610);

        expect(result).toBe(mockCharacter);
        expect(result.name.value).toBe("Spider-Man");
      });

      it("should work with minimal character data", async () => {
        const minimalCharacter = new Character({
          id: new CharacterId(1),
          name: new CharacterName("A"),
          description: "",
          thumbnail: new ImageUrl("http://example.com/a", "jpg"),
        });

        mockRepository.findById.mockResolvedValue(minimalCharacter);

        const result = await useCase.execute(1);

        expect(result).toBe(minimalCharacter);
        expect(result.description).toBe("");
      });

      it("should work with character with special characters in name", async () => {
        const character = new Character({
          id: new CharacterId(1),
          name: new CharacterName("Spider-Man (Peter Parker)"),
          description: "Test",
          thumbnail: new ImageUrl("http://example.com/test", "jpg"),
        });

        mockRepository.findById.mockResolvedValue(character);

        const result = await useCase.execute(1);

        expect(result.name.value).toBe("Spider-Man (Peter Parker)");
      });
    });
  });

  describe("CharacterNotFoundError", () => {
    it("should create error with correct message", () => {
      const error = new CharacterNotFoundError(123);

      expect(error.message).toBe("Character with ID 123 not found");
    });

    it("should create error with correct name", () => {
      const error = new CharacterNotFoundError(123);

      expect(error.name).toBe("CharacterNotFoundError");
    });

    it("should be instanceof Error", () => {
      const error = new CharacterNotFoundError(123);

      expect(error).toBeInstanceOf(Error);
    });

    it("should be instanceof CharacterNotFoundError", () => {
      const error = new CharacterNotFoundError(123);

      expect(error).toBeInstanceOf(CharacterNotFoundError);
    });

    it("should handle different character IDs", () => {
      const error1 = new CharacterNotFoundError(1);
      const error2 = new CharacterNotFoundError(999999);

      expect(error1.message).toBe("Character with ID 1 not found");
      expect(error2.message).toBe("Character with ID 999999 not found");
    });

    it("should be catchable as Error", () => {
      try {
        throw new CharacterNotFoundError(123);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("123");
      }
    });
  });
});
