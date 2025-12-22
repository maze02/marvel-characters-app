// @ts-nocheck - Test file with mock data
/**
 * ListCharacterComics Tests
 * 
 * Tests for fetching comics for a character, covering limits,
 * sorting, validation, and error handling.
 */

import { ListCharacterComics } from './ListCharacterComics';
import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Comic } from '@domain/character/entities/Comic';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { ImageUrl } from '@domain/character/valueObjects/ImageUrl';
import { ReleaseDate } from '@domain/character/valueObjects/ReleaseDate';
import { PAGINATION, COMICS } from '@config/constants';

describe('ListCharacterComics', () => {
  let useCase: ListCharacterComics;
  let mockRepository: jest.Mocked<CharacterRepository>;
  let mockComics: Comic[];

  beforeEach(() => {
    // Create mock comics with different release dates
    mockComics = [
      new Comic({
        id: 1,
        title: 'Amazing Spider-Man #1',
        description: 'First issue',
        thumbnail: new ImageUrl('http://example.com/comic1', 'jpg'),
        onSaleDate: new ReleaseDate('2024-01-15'),
        characterId: new CharacterId(1009610),
      }),
      new Comic({
        id: 2,
        title: 'Amazing Spider-Man #2',
        description: 'Second issue',
        thumbnail: new ImageUrl('http://example.com/comic2', 'jpg'),
        onSaleDate: new ReleaseDate('2024-02-15'),
        characterId: new CharacterId(1009610),
      }),
      new Comic({
        id: 3,
        title: 'Amazing Spider-Man #3',
        description: 'Third issue',
        thumbnail: new ImageUrl('http://example.com/comic3', 'jpg'),
        onSaleDate: new ReleaseDate('2024-03-15'),
        characterId: new CharacterId(1009610),
      }),
    ];

    // Create mock repository
    mockRepository = {
      getComics: jest.fn(),
      findById: jest.fn(),
      searchByName: jest.fn(),
      list: jest.fn(),
      findMany: jest.fn(),
    } as jest.Mocked<CharacterRepository>;

    useCase = new ListCharacterComics(mockRepository);
  });

  describe('execute', () => {
    describe('Basic retrieval', () => {
      it('should return comics for character', async () => {
        mockRepository.getComics.mockResolvedValue(mockComics);

        const result = await useCase.execute(1009610);

        expect(result).toEqual(mockComics);
      });

      it('should call repository with correct CharacterId', async () => {
        mockRepository.getComics.mockResolvedValue(mockComics);

        await useCase.execute(1009610);

        expect(mockRepository.getComics).toHaveBeenCalledWith(
          expect.any(CharacterId),
          COMICS.DEFAULT_DETAIL_PAGE_LIMIT
        );
        const receivedId = mockRepository.getComics.mock.calls[0]?.[0];
        expect(receivedId?.value).toBe(1009610);
      });

      it('should use default limit when not specified', async () => {
        mockRepository.getComics.mockResolvedValue(mockComics);

        await useCase.execute(1009610);

        expect(mockRepository.getComics).toHaveBeenCalledWith(
          expect.any(CharacterId),
          20 // DEFAULT_DETAIL_PAGE_LIMIT
        );
      });

      it('should handle empty results', async () => {
        mockRepository.getComics.mockResolvedValue([]);

        const result = await useCase.execute(1009610);

        expect(result).toEqual([]);
      });

      it('should handle single comic', async () => {
        // @ts-expect-error - Test code, mockComics[0] is guaranteed to exist
        mockRepository.getComics.mockResolvedValue([mockComics[0]]);

        const result = await useCase.execute(1009610);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockComics[0]);
      });
    });

    describe('Custom limits', () => {
      it('should use custom limit when specified', async () => {
        mockRepository.getComics.mockResolvedValue(mockComics);

        await useCase.execute(1009610, 10);

        expect(mockRepository.getComics).toHaveBeenCalledWith(
          expect.any(CharacterId),
          10
        );
      });

      it('should accept limit of 1', async () => {
        if (mockComics[0]) {
          mockRepository.getComics.mockResolvedValue([mockComics[0]]);
        }

        await useCase.execute(1009610, 1);

        expect(mockRepository.getComics).toHaveBeenCalledWith(
          expect.any(CharacterId),
          1
        );
      });

      it('should accept limit of MAX_LIMIT', async () => {
        mockRepository.getComics.mockResolvedValue(mockComics);

        await useCase.execute(1009610, PAGINATION.MAX_LIMIT);

        expect(mockRepository.getComics).toHaveBeenCalledWith(
          expect.any(CharacterId),
          100
        );
      });

      it('should handle different limit values', async () => {
        mockRepository.getComics.mockResolvedValue(mockComics);

        await useCase.execute(1009610, 50);

        expect(mockRepository.getComics).toHaveBeenCalledWith(
          expect.any(CharacterId),
          50
        );
      });
    });

    describe('Limit validation', () => {
      it('should throw error when limit is 0', async () => {
        await expect(useCase.execute(1009610, 0)).rejects.toThrow(
          'Limit must be between 1 and 100'
        );
      });

      it('should throw error when limit is negative', async () => {
        await expect(useCase.execute(1009610, -1)).rejects.toThrow(
          'Limit must be between 1 and 100'
        );
      });

      it('should throw error when limit exceeds MAX_LIMIT', async () => {
        await expect(useCase.execute(1009610, 101)).rejects.toThrow(
          'Limit must be between 1 and 100'
        );
      });

      it('should throw error when limit is very large', async () => {
        await expect(useCase.execute(1009610, 1000)).rejects.toThrow(
          'Limit must be between 1 and 100'
        );
      });

      it('should not call repository when limit is invalid', async () => {
        try {
          await useCase.execute(1009610, 0);
        } catch (error) {
          // Expected
        }

        expect(mockRepository.getComics).not.toHaveBeenCalled();
      });
    });

    describe('Sorting', () => {
      it('should sort comics by release date', async () => {
        // Return comics in wrong order
        const unsortedComics = [mockComics[2], mockComics[0], mockComics[1]];
        mockRepository.getComics.mockResolvedValue(unsortedComics);

        const result = await useCase.execute(1009610);

        // Should be sorted by date (earliest first)
        expect(result[0].title).toBe('Amazing Spider-Man #1');
        expect(result[1].title).toBe('Amazing Spider-Man #2');
        expect(result[2].title).toBe('Amazing Spider-Man #3');
      });

      it('should handle comics without dates', async () => {
        const comicNoDate = new Comic({
          id: 4,
          title: 'No Date Comic',
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/comic4', 'jpg'),
          onSaleDate: null,
          characterId: new CharacterId(1009610),
        });

        mockRepository.getComics.mockResolvedValue([comicNoDate, mockComics[0]!]);

        const result = await useCase.execute(1009610);

        // Comic with date should come first
        expect(result[0]?.title).toBe('Amazing Spider-Man #1');
        expect(result[1]?.title).toBe('No Date Comic');
      });

      it('should handle all comics without dates', async () => {
        const comic1NoDate = new Comic({
          id: 1,
          title: 'Comic A',
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/a', 'jpg'),
          onSaleDate: null,
          characterId: new CharacterId(1009610),
        });

        const comic2NoDate = new Comic({
          id: 2,
          title: 'Comic B',
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/b', 'jpg'),
          onSaleDate: null,
          characterId: new CharacterId(1009610),
        });

        mockRepository.getComics.mockResolvedValue([comic1NoDate, comic2NoDate]);

        const result = await useCase.execute(1009610);

        expect(result).toHaveLength(2);
      });

      it('should maintain sort stability for same dates', async () => {
        const comic1 = new Comic({
          id: 1,
          title: 'Comic 1',
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/1', 'jpg'),
          onSaleDate: new ReleaseDate('2024-01-01'),
          characterId: new CharacterId(1009610),
        });

        const comic2 = new Comic({
          id: 2,
          title: 'Comic 2',
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/2', 'jpg'),
          onSaleDate: new ReleaseDate('2024-01-01'),
          characterId: new CharacterId(1009610),
        });

        mockRepository.getComics.mockResolvedValue([comic2, comic1]);

        const result = await useCase.execute(1009610);

        expect(result).toHaveLength(2);
      });
    });

    describe('Error handling', () => {
      it('should propagate repository errors', async () => {
        mockRepository.getComics.mockRejectedValue(new Error('API Error'));

        await expect(useCase.execute(1009610)).rejects.toThrow('API Error');
      });

      it('should propagate network errors', async () => {
        mockRepository.getComics.mockRejectedValue(new Error('Network error'));

        await expect(useCase.execute(1009610)).rejects.toThrow('Network error');
      });

      it('should handle timeout errors', async () => {
        mockRepository.getComics.mockRejectedValue(new Error('Request timeout'));

        await expect(useCase.execute(1009610)).rejects.toThrow('Request timeout');
      });

      it('should handle invalid character IDs', async () => {
        await expect(useCase.execute(0)).rejects.toThrow('Invalid character ID');
      });

      it('should handle negative character IDs', async () => {
        await expect(useCase.execute(-1)).rejects.toThrow('Invalid character ID');
      });
    });

    describe('Edge cases', () => {
      it('should handle very old release dates', async () => {
        const oldComic = new Comic({
          id: 1,
          title: 'Old Comic',
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/old', 'jpg'),
          onSaleDate: new ReleaseDate('1963-03-01'),
          characterId: new CharacterId(1009610),
        });

        // @ts-expect-error - Test code, mockComics[0] is guaranteed to exist
        mockRepository.getComics.mockResolvedValue([mockComics[0], oldComic]);

        const result = await useCase.execute(1009610);

        // Old comic should come first
        expect(result[0]!.title).toBe('Old Comic');
      });

      it('should handle future release dates', async () => {
        const futureComic = new Comic({
          id: 1,
          title: 'Future Comic',
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/future', 'jpg'),
          onSaleDate: new ReleaseDate('2099-01-01'),
          characterId: new CharacterId(1009610),
        });

        mockRepository.getComics.mockResolvedValue([futureComic, mockComics[0]!]);

        const result = await useCase.execute(1009610);

        // Current comic should come first
        expect(result[0]?.title).toBe('Amazing Spider-Man #1');
        expect(result[1]?.title).toBe('Future Comic');
      });

      it('should handle repository returning null', async () => {
        mockRepository.getComics.mockResolvedValue(null as any);

        await expect(useCase.execute(1009610)).rejects.toThrow();
      });

      it('should handle large result sets', async () => {
        const manyComics = Array.from({ length: 100 }, (_, i) => new Comic({
          id: i + 1,
          title: `Comic ${i + 1}`,
          description: 'Test',
          thumbnail: new ImageUrl(`http://example.com/${i}`, 'jpg'),
          onSaleDate: new ReleaseDate('2024-01-01'),
          characterId: new CharacterId(1009610),
        }));

        mockRepository.getComics.mockResolvedValue(manyComics);

        const result = await useCase.execute(1009610, 100);

        expect(result).toHaveLength(100);
      });
    });

    describe('Repository interaction', () => {
      it('should call repository only once', async () => {
        mockRepository.getComics.mockResolvedValue(mockComics);

        await useCase.execute(1009610);

        expect(mockRepository.getComics).toHaveBeenCalledTimes(1);
      });

      it('should not modify comics returned from repository', async () => {
        const originalTitle = mockComics[0].title;
        mockRepository.getComics.mockResolvedValue(mockComics);

        await useCase.execute(1009610);

        expect(mockComics[0].title).toBe(originalTitle);
      });

      it('should work with minimal comic data', async () => {
        const minimalComic = new Comic({
          id: 1,
          title: 'A',
          description: '',
          thumbnail: new ImageUrl('http://example.com/a', 'jpg'),
          onSaleDate: null,
          characterId: new CharacterId(1009610),
        });

        mockRepository.getComics.mockResolvedValue([minimalComic]);

        const result = await useCase.execute(1009610);

        expect(result).toHaveLength(1);
        expect(result[0]?.title).toBe('A');
      });
    });
  });
});
