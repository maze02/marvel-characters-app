/**
 * ComicVineCharacterRepository Unit Tests
 *
 * Production-grade tests for the Character Repository.
 * Tests cover: findById, findMany, searchByName, findComicsByCharacterId
 */

import { ComicVineCharacterRepository } from "./ComicVineCharacterRepository";
import { ComicVineApiClient } from "@infrastructure/http/ComicVineApiClient";
import { CharacterId } from "@domain/character/valueObjects/CharacterId";
import { Character } from "@domain/character/entities/Character";
import { Comic } from "@domain/character/entities/Comic";

// Mock the API client
jest.mock("@infrastructure/http/ComicVineApiClient");

describe("ComicVineCharacterRepository", () => {
  let repository: ComicVineCharacterRepository;
  let mockApiClient: jest.Mocked<ComicVineApiClient>;

  const createMockCharacterApiResponse = () => ({
    id: 1699,
    name: "Spider-Man",
    deck: "Friendly neighborhood hero",
    description: "<p>Bitten by a radioactive spider.</p>",
    image: {
      icon_url: "https://example.com/icon.jpg",
      medium_url: "https://example.com/medium.jpg",
      screen_url: "https://example.com/screen.jpg",
      screen_large_url: "https://example.com/large.jpg",
      small_url: "https://example.com/small.jpg",
      super_url: "https://example.com/super.jpg",
      thumb_url: "https://example.com/thumb.jpg",
      tiny_url: "https://example.com/tiny.jpg",
      original_url: "https://example.com/original.jpg",
    },
    publisher: {
      id: 31,
      name: "Marvel Comics",
    },
    date_added: "2024-01-01T00:00:00",
    date_last_updated: "2024-01-15T10:30:00",
    site_detail_url: "https://comicvine.gamespot.com/spider-man/4005-1699/",
    api_detail_url: "https://comicvine.gamespot.com/api/character/4005-1699/",
    issue_credits: [
      { id: 1, api_detail_url: "url1" },
      { id: 2, api_detail_url: "url2" },
    ],
  });

  const createMockComicApiResponse = () => ({
    id: 123456,
    name: "Amazing Spider-Man #1",
    issue_number: "1",
    volume: {
      id: 78701,
      name: "The Amazing Spider-Man (2018)",
    },
    cover_date: "2018-07-01",
    store_date: "2018-07-04",
    description: "<p>First issue!</p>",
    image: {
      icon_url: "https://example.com/comic-icon.jpg",
      medium_url: "https://example.com/comic-medium.jpg",
      screen_url: "https://example.com/comic-screen.jpg",
      screen_large_url: "https://example.com/comic-large.jpg",
      small_url: "https://example.com/comic-small.jpg",
      super_url: "https://example.com/comic-super.jpg",
      thumb_url: "https://example.com/comic-thumb.jpg",
      tiny_url: "https://example.com/comic-tiny.jpg",
      original_url: "https://example.com/comic-original.jpg",
    },
    date_added: "2024-01-01T00:00:00",
    date_last_updated: "2024-01-15T10:30:00",
    site_detail_url: "https://comicvine.gamespot.com/issue/123456/",
    api_detail_url: "https://comicvine.gamespot.com/api/issue/4000-123456/",
  });

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
    } as any;
    repository = new ComicVineCharacterRepository(mockApiClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("returns character when found", async () => {
      // Arrange
      const mockResponse = createMockCharacterApiResponse();
      (mockApiClient.get as jest.Mock).mockResolvedValue({
        error: "OK",
        status_code: 1,
        results: mockResponse,
      });

      const characterId = new CharacterId(1699);

      // Act
      const character = await repository.findById(characterId);

      // Assert
      expect(character).toBeInstanceOf(Character);
      expect(character?.id.value).toBe(1699);
      expect(character?.name.value).toBe("Spider-Man");
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/character/4005-1699/",
        {
          field_list:
            "id,name,deck,description,image,publisher,date_last_updated,issue_credits",
        },
        { useCache: true },
      );
    });

    it("returns null when character not found", async () => {
      // Arrange
      (mockApiClient.get as jest.Mock).mockResolvedValue({
        error: "Object Not Found",
        status_code: 101,
        results: null,
      });

      const characterId = new CharacterId(99999);

      // Act
      const character = await repository.findById(characterId);

      // Assert
      expect(character).toBeNull();
    });

    it("throws error when API returns non-404 error", async () => {
      // Arrange
      (mockApiClient.get as jest.Mock).mockRejectedValue(
        new Error("API Error"),
      );

      const characterId = new CharacterId(1699);

      // Act & Assert
      await expect(repository.findById(characterId)).rejects.toThrow(
        "API Error",
      );
    });

    it("returns null when API returns 404 error", async () => {
      // Arrange
      const error = new Error("Not Found");
      (error as any).statusCode = 404;
      (mockApiClient.get as jest.Mock).mockRejectedValue(error);

      const characterId = new CharacterId(1699);

      // Act
      const character = await repository.findById(characterId);

      // Assert
      expect(character).toBeNull();
    });
  });

  describe("findMany", () => {
    it("returns paginated list of characters", async () => {
      // Arrange
      const mockResponse = createMockCharacterApiResponse();
      (mockApiClient.get as jest.Mock).mockResolvedValue({
        error: "OK",
        status_code: 1,
        results: [
          mockResponse,
          { ...mockResponse, id: 1700, name: "Iron Man" },
        ],
        number_of_page_results: 2,
        number_of_total_results: 100,
        offset: 0,
        limit: 50,
      });

      // Act
      const result = await repository.findMany({ offset: 0, limit: 50 });

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toBeInstanceOf(Character);
      expect(result.total).toBe(100);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(50);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/characters/",
        { filter: "publisher:31", limit: 50, offset: 0 },
        { useCache: true },
      );
    });

    it("returns empty array when no results", async () => {
      // Arrange
      (mockApiClient.get as jest.Mock).mockResolvedValue({
        error: "OK",
        status_code: 1,
        results: [],
        number_of_page_results: 0,
        number_of_total_results: 0,
        offset: 0,
        limit: 50,
      });

      // Act
      const result = await repository.findMany({ offset: 0, limit: 50 });

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("searchByName", () => {
    it("returns characters matching search query", async () => {
      // Arrange
      const mockResponse = createMockCharacterApiResponse();
      (mockApiClient.get as jest.Mock).mockResolvedValue({
        error: "OK",
        status_code: 1,
        results: [mockResponse],
        number_of_page_results: 1,
        number_of_total_results: 1,
      });

      // Act
      const characters = await repository.searchByName("Spider-Man");

      // Assert
      expect(characters).toHaveLength(1);
      expect(characters[0]).toBeInstanceOf(Character);
      expect(characters[0]!.name.value).toBe("Spider-Man");
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/characters/",
        expect.objectContaining({
          filter: "publisher:31,name:Spider-Man",
          limit: expect.any(Number),
        }),
        expect.objectContaining({ useCache: true }),
      );
    });

    it("returns empty array when no matches found", async () => {
      // Arrange
      (mockApiClient.get as jest.Mock).mockResolvedValue({
        error: "OK",
        status_code: 1,
        results: [],
        number_of_page_results: 0,
        number_of_total_results: 0,
      });

      // Act
      const characters = await repository.searchByName("NonExistentCharacter");

      // Assert
      expect(characters).toHaveLength(0);
    });

    it("throws error on API error", async () => {
      // Arrange
      (mockApiClient.get as jest.Mock).mockRejectedValue(
        new Error("API Error"),
      );

      // Act & Assert
      await expect(repository.searchByName("Spider-Man")).rejects.toThrow(
        "API Error",
      );
    });
  });

  describe("getComicsByIds", () => {
    it("returns comics for given IDs", async () => {
      // Arrange
      const mockComicResponse = createMockComicApiResponse();
      (mockApiClient.get as jest.Mock).mockResolvedValue({
        error: "OK",
        status_code: 1,
        results: [mockComicResponse],
        number_of_page_results: 1,
        number_of_total_results: 1,
      });

      const characterId = new CharacterId(1699);
      const issueIds = [123456];

      // Act
      const comics = await repository.getComicsByIds(issueIds, characterId);

      // Assert
      expect(comics).toHaveLength(1);
      expect(comics[0]).toBeInstanceOf(Comic);
      expect(comics[0]!.title).toBe("Amazing Spider-Man #1");
    });

    it("returns empty array when no issue IDs provided", async () => {
      // Arrange
      const characterId = new CharacterId(1699);

      // Act
      const comics = await repository.getComicsByIds([], characterId);

      // Assert
      expect(comics).toHaveLength(0);
    });
  });
});
