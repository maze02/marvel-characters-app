import { ComicVineCharacterRepository } from './ComicVineCharacterRepository';
import { ComicVineApiClient } from '../http/ComicVineApiClient';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { ComicVineApiResponse, ComicVineCharacterResponse } from '@application/character/dtos/ComicVineCharacterDTO';
import { ComicVineIssuesApiResponse, ComicVineIssueResponse } from '@application/character/dtos/ComicVineComicDTO';

// Mock the API client
jest.mock('../http/ComicVineApiClient');

describe('ComicVineCharacterRepository', () => {
  let repository: ComicVineCharacterRepository;
  let mockApiClient: jest.Mocked<ComicVineApiClient>;

  const mockCharacterResponse: ComicVineCharacterResponse = {
    id: 1699,
    name: 'Spider-Man',
    deck: 'Your friendly neighborhood Spider-Man',
    description: '<p>Peter Parker is Spider-Man</p>',
    image: {
      icon_url: '',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/111/1-spider.jpg',
      screen_url: '',
      screen_large_url: '',
      small_url: '',
      super_url: '',
      thumb_url: '',
      tiny_url: '',
      original_url: '',
    },
    publisher: { id: 31, name: 'Marvel Comics' },
    date_added: '2008-06-06 11:27:00',
    date_last_updated: '2024-12-01 15:30:00',
    site_detail_url: '',
    api_detail_url: '',
  };

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      cancelRequest: jest.fn(),
      cancelAllRequests: jest.fn(),
      clearCache: jest.fn(),
      getRemainingRequests: jest.fn(),
    } as any;

    repository = new ComicVineCharacterRepository(mockApiClient);
  });

  describe('findMany', () => {
    it('should fetch characters with Marvel publisher filter', async () => {
      const mockResponse: ComicVineApiResponse<ComicVineCharacterResponse> = {
        error: 'OK',
        limit: 50,
        offset: 0,
        number_of_page_results: 50,
        number_of_total_results: 500,
        status_code: 1,
        results: Array(50).fill(mockCharacterResponse),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await repository.findMany({ limit: 50, offset: 0 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/characters/',
        expect.objectContaining({
          filter: 'publisher:31',
          limit: 50,
          offset: 0,
        }),
        expect.objectContaining({ useCache: true })
      );

      expect(result.items).toHaveLength(50);
      expect(result.total).toBe(500);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(50);
    });

    it('should handle pagination with offset', async () => {
      const mockResponse: ComicVineApiResponse<ComicVineCharacterResponse> = {
        error: 'OK',
        limit: 50,
        offset: 100,
        number_of_page_results: 50,
        number_of_total_results: 500,
        status_code: 1,
        results: Array(50).fill(mockCharacterResponse),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await repository.findMany({ limit: 50, offset: 100 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/characters/',
        expect.objectContaining({
          offset: 100,
        }),
        expect.any(Object)
      );

      expect(result.offset).toBe(100);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(repository.findMany({ limit: 50, offset: 0 })).rejects.toThrow('API Error');
    });
  });

  describe('findById', () => {
    it('should fetch single character by ID', async () => {
      const mockResponse = {
        error: 'OK',
        status_code: 1,
        results: mockCharacterResponse,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const characterId = new CharacterId(1699);
      const character = await repository.findById(characterId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/character/4005-1699/',
        {},
        expect.objectContaining({ useCache: true })
      );

      expect(character).not.toBeNull();
      expect(character?.id.value).toBe(1699);
    });

    it('should return null when character not found (404)', async () => {
      const error: any = new Error('Not found');
      error.statusCode = 404;
      mockApiClient.get.mockRejectedValue(error);

      const characterId = new CharacterId(99999);
      const character = await repository.findById(characterId);

      expect(character).toBeNull();
    });

    it('should throw on other errors', async () => {
      const error: any = new Error('Server error');
      error.statusCode = 500;
      mockApiClient.get.mockRejectedValue(error);

      const characterId = new CharacterId(1699);

      await expect(repository.findById(characterId)).rejects.toThrow('Server error');
    });
  });

  describe('searchByName', () => {
    it('should search characters by name with Marvel filter', async () => {
      const mockResponse: ComicVineApiResponse<ComicVineCharacterResponse> = {
        error: 'OK',
        limit: 50,
        offset: 0,
        number_of_page_results: 5,
        number_of_total_results: 5,
        status_code: 1,
        results: [mockCharacterResponse],
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const results = await repository.searchByName('Spider');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/characters/',
        expect.objectContaining({
          filter: expect.stringMatching(/publisher:31.*name:Spider/),
        }),
        expect.any(Object)
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.name.value).toBe('Spider-Man');
    });

    it('should return empty array for empty query', async () => {
      const results = await repository.searchByName('');

      expect(results).toHaveLength(0);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should encode special characters in query', async () => {
      const mockResponse: ComicVineApiResponse<ComicVineCharacterResponse> = {
        error: 'OK',
        limit: 50,
        offset: 0,
        number_of_page_results: 0,
        number_of_total_results: 0,
        status_code: 1,
        results: [],
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await repository.searchByName('Spider & Venom');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/characters/',
        expect.objectContaining({
          filter: expect.stringContaining('Spider%20%26%20Venom'),
        }),
        expect.any(Object)
      );
    });
  });

  describe('getComics', () => {
    const mockIssueResponse: ComicVineIssueResponse = {
      id: 12345,
      name: 'Amazing Spider-Man #1',
      issue_number: '1',
      volume: { id: 2127, name: 'Amazing Spider-Man' },
      cover_date: '2024-01-15',
      store_date: null,
      description: null,
      image: {
        icon_url: '',
        medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/111/12345.jpg',
        screen_url: '',
        screen_large_url: '',
        small_url: '',
        super_url: '',
        thumb_url: '',
        tiny_url: '',
        original_url: '',
      },
      date_added: '2024-01-01 10:00:00',
      date_last_updated: '2024-01-05 14:30:00',
      site_detail_url: '',
      api_detail_url: '',
    };

    it('should fetch comics for character with limit of 20', async () => {
      const mockResponse: ComicVineIssuesApiResponse = {
        error: 'OK',
        limit: 20,
        offset: 0,
        number_of_page_results: 20,
        number_of_total_results: 100,
        status_code: 1,
        results: Array(20).fill(mockIssueResponse),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const characterId = new CharacterId(1699);
      const comics = await repository.getComics(characterId, 20);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/issues/',
        expect.objectContaining({
          filter: 'character:1699',
          limit: 20,
          sort: 'cover_date:desc',
        }),
        expect.any(Object)
      );

      expect(comics).toHaveLength(20);
    });

    it('should sort comics by cover date descending', async () => {
      const mockResponse: ComicVineIssuesApiResponse = {
        error: 'OK',
        limit: 20,
        offset: 0,
        number_of_page_results: 20,
        number_of_total_results: 100,
        status_code: 1,
        results: Array(20).fill(mockIssueResponse),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const characterId = new CharacterId(1699);
      await repository.getComics(characterId, 20);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sort: 'cover_date:desc', // Newest first
        }),
        expect.any(Object)
      );
    });

    it('should cap limit at 20 even if higher requested', async () => {
      const mockResponse: ComicVineIssuesApiResponse = {
        error: 'OK',
        limit: 20,
        offset: 0,
        number_of_page_results: 20,
        number_of_total_results: 100,
        status_code: 1,
        results: Array(20).fill(mockIssueResponse),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const characterId = new CharacterId(1699);
      await repository.getComics(characterId, 100);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          limit: 20, // Should be capped
        }),
        expect.any(Object)
      );
    });

    it('should return empty array on error instead of throwing', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const characterId = new CharacterId(1699);
      const comics = await repository.getComics(characterId, 20);

      expect(comics).toHaveLength(0);
    });
  });
});
