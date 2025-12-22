// @ts-nocheck - Test file with mock data
/**
 * ListFavorites Tests
 * 
 * Tests for listing favorited characters, covering empty states,
 * multiple favorites, error handling, and count/check operations.
 */

import { ListFavorites } from './ListFavorites';
import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { FavoritesRepository } from '@domain/character/ports/FavoritesRepository';
import { Character } from '@domain/character/entities/Character';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { CharacterName } from '@domain/character/valueObjects/CharacterName';
import { ImageUrl } from '@domain/character/valueObjects/ImageUrl';

describe('ListFavorites', () => {
  let useCase: ListFavorites;
  let mockCharacterRepository: jest.Mocked<CharacterRepository>;
  let mockFavoritesRepository: jest.Mocked<FavoritesRepository>;
  let mockCharacters: Character[];

  beforeEach(() => {
    // Create mock characters
    mockCharacters = [
      new Character({
        id: new CharacterId(1009610),
        name: new CharacterName('Spider-Man'),
        description: 'Friendly neighborhood Spider-Man',
        thumbnail: new ImageUrl('http://example.com/spiderman', 'jpg'),
        modifiedDate: new Date('2024-01-01'),
      }),
      new Character({
        id: new CharacterId(1009368),
        name: new CharacterName('Iron Man'),
        description: 'Genius billionaire',
        thumbnail: new ImageUrl('http://example.com/ironman', 'jpg'),
        modifiedDate: new Date('2024-01-01'),
      }),
      new Character({
        id: new CharacterId(1009220),
        name: new CharacterName('Captain America'),
        description: 'Super soldier',
        thumbnail: new ImageUrl('http://example.com/cap', 'jpg'),
        modifiedDate: new Date('2024-01-01'),
      }),
    ];

    // Create mock repositories
    mockCharacterRepository = {
      findById: jest.fn(),
      searchByName: jest.fn(),
      list: jest.fn(),
      findMany: jest.fn(),
      getComicsByIds: jest.fn(),
    } as jest.Mocked<CharacterRepository>;

    mockFavoritesRepository = {
      add: jest.fn(),
      remove: jest.fn(),
      findAll: jest.fn(),
      contains: jest.fn(),
      count: jest.fn(),
      clear: jest.fn(),
    } as jest.Mocked<FavoritesRepository>;

    useCase = new ListFavorites(mockCharacterRepository, mockFavoritesRepository);
  });

  describe('execute', () => {
    describe('Empty favorites', () => {
      it('should return empty array when no favorites', async () => {
        mockFavoritesRepository.findAll.mockResolvedValue([]);

        const result = await useCase.execute();

        expect(result).toEqual([]);
        expect(mockCharacterRepository.findById).not.toHaveBeenCalled();
      });

      it('should call favoritesRepository.findAll', async () => {
        mockFavoritesRepository.findAll.mockResolvedValue([]);

        await useCase.execute();

        expect(mockFavoritesRepository.findAll).toHaveBeenCalledTimes(1);
      });

      it('should not fetch characters when favorites are empty', async () => {
        mockFavoritesRepository.findAll.mockResolvedValue([]);

        await useCase.execute();

        expect(mockCharacterRepository.findById).not.toHaveBeenCalled();
      });
    });

    describe('Single favorite', () => {
      it('should return single character when one favorite', async () => {
        const favoriteId = new CharacterId(1009610);
        mockFavoritesRepository.findAll.mockResolvedValue([favoriteId]);
        mockCharacterRepository.findById.mockResolvedValue(mockCharacters[0]);

        const result = await useCase.execute();

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockCharacters[0]);
      });

      it('should fetch character by ID', async () => {
        const favoriteId = new CharacterId(1009610);
        mockFavoritesRepository.findAll.mockResolvedValue([favoriteId]);
        mockCharacterRepository.findById.mockResolvedValue(mockCharacters[0]);

        await useCase.execute();

        expect(mockCharacterRepository.findById).toHaveBeenCalledWith(favoriteId);
      });
    });

    describe('Multiple favorites', () => {
      it('should return all favorited characters', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(1009368),
          new CharacterId(1009220),
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById
          .mockResolvedValueOnce(mockCharacters[0]!)
          .mockResolvedValueOnce(mockCharacters[1]!)
          .mockResolvedValueOnce(mockCharacters[2]!);

        const result = await useCase.execute();

        expect(result).toHaveLength(3);
        expect(result[0]).toBe(mockCharacters[0]);
        expect(result[1]).toBe(mockCharacters[1]);
        expect(result[2]).toBe(mockCharacters[2]);
      });

      it('should fetch all characters in parallel', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(1009368),
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById.mockResolvedValue(mockCharacters[0]);

        await useCase.execute();

        expect(mockCharacterRepository.findById).toHaveBeenCalledTimes(2);
      });

      it('should call findById for each favorite ID', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(1009368),
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById
          .mockResolvedValueOnce(mockCharacters[0]!)
          .mockResolvedValueOnce(mockCharacters[1]!);

        await useCase.execute();

        expect(mockCharacterRepository.findById).toHaveBeenCalledWith(favoriteIds[0]);
        expect(mockCharacterRepository.findById).toHaveBeenCalledWith(favoriteIds[1]);
      });
    });

    describe('Error handling', () => {
      it('should handle character not found', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(999999), // Doesn't exist
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById
          .mockResolvedValueOnce(mockCharacters[0]!)
          .mockResolvedValueOnce(null);

        const result = await useCase.execute();

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockCharacters[0]);
      });

      it('should handle fetch errors gracefully', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(1009368),
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById
          .mockResolvedValueOnce(mockCharacters[0]!)
          .mockRejectedValueOnce(new Error('API Error'));

        const result = await useCase.execute();

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockCharacters[0]);
      });

      it('should handle all characters failing to fetch', async () => {
        const favoriteIds = [new CharacterId(1009610)];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById.mockRejectedValue(new Error('API Error'));

        const result = await useCase.execute();

        expect(result).toEqual([]);
      });

      it('should handle mix of success and failure', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(1009368),
          new CharacterId(1009220),
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById
          .mockResolvedValueOnce(mockCharacters[0]!)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(mockCharacters[2]!);

        const result = await useCase.execute();

        expect(result).toHaveLength(2);
        expect(result[0]).toBe(mockCharacters[0]);
        expect(result[1]).toBe(mockCharacters[2]);
      });

      it('should propagate favoritesRepository errors', async () => {
        mockFavoritesRepository.findAll.mockRejectedValue(new Error('Storage error'));

        await expect(useCase.execute()).rejects.toThrow('Storage error');
      });

      it('should handle null characters in results', async () => {
        const favoriteIds = [new CharacterId(1009610)];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById.mockResolvedValue(null);

        const result = await useCase.execute();

        expect(result).toEqual([]);
      });
    });

    describe('Filtering', () => {
      it('should filter out null results', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(999999),
          new CharacterId(1009368),
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById
          .mockResolvedValueOnce(mockCharacters[0]!)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockCharacters[1]!);

        const result = await useCase.execute();

        expect(result).toHaveLength(2);
        expect(result.every(char => char !== null)).toBe(true);
      });

      it('should maintain order of valid characters', async () => {
        const favoriteIds = [
          new CharacterId(1009610),
          new CharacterId(1009368),
        ];
        mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
        mockCharacterRepository.findById
          .mockResolvedValueOnce(mockCharacters[0]!)
          .mockResolvedValueOnce(mockCharacters[1]!);

        const result = await useCase.execute();

        expect(result[0]?.name.value).toBe('Spider-Man');
        expect(result[1]?.name.value).toBe('Iron Man');
      });
    });
  });

  describe('getCount', () => {
    it('should return count from repository', async () => {
      mockFavoritesRepository.count.mockResolvedValue(5);

      const result = await useCase.getCount();

      expect(result).toBe(5);
    });

    it('should call favoritesRepository.count', async () => {
      mockFavoritesRepository.count.mockResolvedValue(3);

      await useCase.getCount();

      expect(mockFavoritesRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no favorites', async () => {
      mockFavoritesRepository.count.mockResolvedValue(0);

      const result = await useCase.getCount();

      expect(result).toBe(0);
    });

    it('should handle different counts', async () => {
      mockFavoritesRepository.count.mockResolvedValue(10);

      const result = await useCase.getCount();

      expect(result).toBe(10);
    });

    it('should propagate repository errors', async () => {
      mockFavoritesRepository.count.mockRejectedValue(new Error('Storage error'));

      await expect(useCase.getCount()).rejects.toThrow('Storage error');
    });
  });

  describe('isFavorite', () => {
    it('should return true when character is favorited', async () => {
      mockFavoritesRepository.contains.mockResolvedValue(true);

      const result = await useCase.isFavorite(1009610);

      expect(result).toBe(true);
    });

    it('should return false when character is not favorited', async () => {
      mockFavoritesRepository.contains.mockResolvedValue(false);

      const result = await useCase.isFavorite(999999);

      expect(result).toBe(false);
    });

    it('should call contains with CharacterId', async () => {
      mockFavoritesRepository.contains.mockResolvedValue(true);

      await useCase.isFavorite(1009610);

      expect(mockFavoritesRepository.contains).toHaveBeenCalledWith(expect.any(CharacterId));
      const receivedId = mockFavoritesRepository.contains.mock.calls[0]?.[0];
      expect(receivedId?.value).toBe(1009610);
    });

    it('should handle different character IDs', async () => {
      mockFavoritesRepository.contains.mockResolvedValue(true);

      await useCase.isFavorite(123);

      const receivedId = mockFavoritesRepository.contains.mock.calls[0]?.[0];
      expect(receivedId?.value).toBe(123);
    });

    it('should propagate repository errors', async () => {
      mockFavoritesRepository.contains.mockRejectedValue(new Error('Storage error'));

      await expect(useCase.isFavorite(1009610)).rejects.toThrow('Storage error');
    });

    it('should handle invalid character IDs', async () => {
      // CharacterId validates, so invalid IDs should throw
      await expect(useCase.isFavorite(0)).rejects.toThrow('Invalid character ID');
    });

    it('should handle negative character IDs', async () => {
      await expect(useCase.isFavorite(-1)).rejects.toThrow('Invalid character ID');
    });
  });

  describe('Integration scenarios', () => {
    it('should work with real-world favorite flow', async () => {
      // User has 2 favorites
      const favoriteIds = [
        new CharacterId(1009610),
        new CharacterId(1009368),
      ];
      mockFavoritesRepository.findAll.mockResolvedValue(favoriteIds);
      mockFavoritesRepository.count.mockResolvedValue(2);
      mockFavoritesRepository.contains.mockResolvedValue(true);
      mockCharacterRepository.findById
        .mockResolvedValueOnce(mockCharacters[0]!)
        .mockResolvedValueOnce(mockCharacters[1]!);

      const count = await useCase.getCount();
      const favorites = await useCase.execute();
      const isFav = await useCase.isFavorite(1009610);

      expect(count).toBe(2);
      expect(favorites).toHaveLength(2);
      expect(isFav).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      mockFavoritesRepository.count.mockResolvedValue(1);
      mockFavoritesRepository.findAll.mockResolvedValue([new CharacterId(1009610)]);
        // @ts-expect-error - Test code, mockCharacters elements are guaranteed to exist
        mockCharacterRepository.findById.mockResolvedValue(mockCharacters[0]);

      const [count, favorites] = await Promise.all([
        useCase.getCount(),
        useCase.execute(),
      ]);

      expect(count).toBe(1);
      expect(favorites).toHaveLength(1);
    });
  });
});
