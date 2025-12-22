import { ComicVineCharacterRepository } from './ComicVineCharacterRepository';
import { ComicVineApiClient } from '../http/ComicVineApiClient';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { ComicVineApiResponse, ComicVineCharacterResponse } from '@application/character/dtos/ComicVineCharacterDTO';

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
        {
          field_list: 'id,name,deck,description,image,publisher,date_last_updated,issue_credits',
        },
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
          filter: expect.stringContaining('Spider & Venom'), // Raw string, axios will encode
        }),
        expect.any(Object)
      );
    });
  });

  // Old getComics tests removed - now using getComicsByIds with efficient two-step approach
});
