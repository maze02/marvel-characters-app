// @ts-nocheck - Test file with mock data
/**
 * ListCharacterComics Tests
 * 
 * Tests for the new two-step approach:
 * 1. Get character with issue_credits
 * 2. Batch fetch comics by IDs
 */

import { ListCharacterComics } from './ListCharacterComics';
import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Character } from '@domain/character/entities/Character';
import { Comic } from '@domain/character/entities/Comic';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { CharacterName } from '@domain/character/valueObjects/CharacterName';
import { ImageUrl } from '@domain/character/valueObjects/ImageUrl';
import { ReleaseDate } from '@domain/character/valueObjects/ReleaseDate';

// Helper to create a character with issue IDs
const createCharacterWithIssues = (issueIds: number[]) => new Character({
  id: new CharacterId(1234),
  name: new CharacterName('Spider-Man'),
  description: 'Friendly neighborhood Spider-Man',
  image: new ImageUrl('https://example.com/image.jpg'),
  issueIds,
});

describe('ListCharacterComics', () => {
  let useCase: ListCharacterComics;
  let mockRepository: jest.Mocked<CharacterRepository>;
  let mockCharacter: Character;
  let mockComics: Comic[];

  beforeEach(() => {
    // Create mock character with issue IDs
    mockCharacter = new Character({
      id: new CharacterId(1234),
      name: new CharacterName('Spider-Man'),
      description: 'Friendly neighborhood Spider-Man',
      thumbnail: new ImageUrl('http://example.com/character', 'jpg'),
      modifiedDate: new Date(),
      issueIds: [1, 2, 3], // Character appears in 3 issues
    });

    // Create mock comics
    mockComics = [
      new Comic({
        id: 1,
        title: 'Amazing Spider-Man #1',
        description: 'First issue',
        thumbnail: new ImageUrl('http://example.com/comic1', 'jpg'),
        onSaleDate: new ReleaseDate('2024-01-15'),
        characterId: new CharacterId(1234),
      }),
      new Comic({
        id: 2,
        title: 'Amazing Spider-Man #2',
        description: 'Second issue',
        thumbnail: new ImageUrl('http://example.com/comic2', 'jpg'),
        onSaleDate: new ReleaseDate('2024-02-15'),
        characterId: new CharacterId(1234),
      }),
      new Comic({
        id: 3,
        title: 'Amazing Spider-Man #3',
        description: 'Third issue',
        thumbnail: new ImageUrl('http://example.com/comic3', 'jpg'),
        onSaleDate: new ReleaseDate('2024-03-15'),
        characterId: new CharacterId(1234),
      }),
    ];

    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      findMany: jest.fn(),
      searchByName: jest.fn(),
      getComicsByIds: jest.fn(),
    } as jest.Mocked<CharacterRepository>;

    useCase = new ListCharacterComics(mockRepository);
  });

  describe('execute', () => {
    describe('Two-step approach', () => {
      it('should fetch character first, then fetch comics by IDs', async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);
        mockRepository.getComicsByIds.mockResolvedValue(mockComics);

        const result = await useCase.execute(1234);

        // Step 1: Get character
        expect(mockRepository.findById).toHaveBeenCalledWith(expect.any(CharacterId));
        const receivedId = mockRepository.findById.mock.calls[0]?.[0];
        expect(receivedId?.value).toBe(1234);

        // Step 2: Get comics by IDs
        expect(mockRepository.getComicsByIds).toHaveBeenCalledWith(
          [1, 2, 3], // Issue IDs from character
          expect.any(CharacterId)
        );

        expect(result).toEqual(mockComics);
      });

      it('should call repository methods in correct order', async () => {
        const callOrder: string[] = [];
        
        mockRepository.findById.mockImplementation(async () => {
          callOrder.push('findById');
          return mockCharacter;
        });
        
        mockRepository.getComicsByIds.mockImplementation(async () => {
          callOrder.push('getComicsByIds');
          return mockComics;
        });

        await useCase.execute(1234);

        expect(callOrder).toEqual(['findById', 'getComicsByIds']);
      });
    });

    describe('Character with no issues', () => {
      it('should return empty array if character has no issues', async () => {
        const characterWithNoIssues = new Character({
          id: new CharacterId(1234),
          name: new CharacterName('Obscure Character'),
          description: 'No comics',
          thumbnail: new ImageUrl('http://example.com/character', 'jpg'),
          modifiedDate: new Date(),
          issueIds: [], // No issues
        });

        mockRepository.findById.mockResolvedValue(characterWithNoIssues);

        const result = await useCase.execute(1234);

        expect(result).toEqual([]);
        // Should NOT call getComicsByIds since character has no issues
        expect(mockRepository.getComicsByIds).not.toHaveBeenCalled();
      });

      it('should return empty array if character has undefined issueIds', async () => {
        const characterNoIssueIds = new Character({
          id: new CharacterId(1234),
          name: new CharacterName('Test'),
          description: 'Test',
          thumbnail: new ImageUrl('http://example.com/character', 'jpg'),
          modifiedDate: new Date(),
          // issueIds not provided (defaults to empty array)
        });

        mockRepository.findById.mockResolvedValue(characterNoIssueIds);

        const result = await useCase.execute(1234);

        expect(result).toEqual([]);
        expect(mockRepository.getComicsByIds).not.toHaveBeenCalled();
      });
    });

    describe('Character not found', () => {
      it('should throw error if character not found', async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(1234)).rejects.toThrow(
          'Character with ID 1234 not found'
        );
      });

      it('should not call getComicsByIds if character not found', async () => {
        mockRepository.findById.mockResolvedValue(null);

        try {
          await useCase.execute(1234);
        } catch (error) {
          // Expected
        }

        expect(mockRepository.getComicsByIds).not.toHaveBeenCalled();
      });
    });

    describe('Character with many issues', () => {
      it('should handle character with 100+ issues', async () => {
        const issueIds = Array.from({ length: 150 }, (_, i) => i + 1);
        const characterManyIssues = new Character({
          id: new CharacterId(1234),
          name: new CharacterName('Spider-Man'),
          description: 'Many comics',
          thumbnail: new ImageUrl('http://example.com/character', 'jpg'),
          modifiedDate: new Date(),
          issueIds,
        });

        const manyComics = issueIds.map(id => new Comic({
          id,
          title: `Comic #${id}`,
          description: 'Test',
          thumbnail: new ImageUrl(`http://example.com/comic${id}`, 'jpg'),
          onSaleDate: new ReleaseDate('2024-01-01'),
          characterId: new CharacterId(1234),
        }));

        mockRepository.findById.mockResolvedValue(characterManyIssues);
        mockRepository.getComicsByIds.mockResolvedValue(manyComics);

        const result = await useCase.execute(1234);

        expect(result).toHaveLength(150);
        expect(mockRepository.getComicsByIds).toHaveBeenCalledWith(
          issueIds,
          expect.any(CharacterId)
        );
      });
    });

    describe('Error handling', () => {
      it('should propagate errors from findById', async () => {
        mockRepository.findById.mockRejectedValue(new Error('API Error'));

        await expect(useCase.execute(1234)).rejects.toThrow('API Error');
      });

      it('should propagate errors from getComicsByIds', async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);
        mockRepository.getComicsByIds.mockRejectedValue(new Error('Comics API Error'));

        await expect(useCase.execute(1234)).rejects.toThrow('Comics API Error');
      });

      it('should handle network errors', async () => {
        mockRepository.findById.mockRejectedValue(new Error('Network error'));

        await expect(useCase.execute(1234)).rejects.toThrow('Network error');
      });

      it('should handle invalid character ID validation', async () => {
        await expect(useCase.execute(0)).rejects.toThrow('Invalid character ID');
      });

      it('should handle negative character ID', async () => {
        await expect(useCase.execute(-1)).rejects.toThrow('Invalid character ID');
      });
    });

    describe('Results', () => {
      it('should return comics in order returned by repository', async () => {
        // Repository returns comics sorted by cover_date:desc
        mockRepository.findById.mockResolvedValue(mockCharacter);
        mockRepository.getComicsByIds.mockResolvedValue(mockComics);

        const result = await useCase.execute(1234);

        // Should maintain repository order (already sorted)
        expect(result[0]?.title).toBe('Amazing Spider-Man #1');
        expect(result[1]?.title).toBe('Amazing Spider-Man #2');
        expect(result[2]?.title).toBe('Amazing Spider-Man #3');
      });

      it('should handle partial results from repository', async () => {
        // Character has 3 issue IDs, but repository only returns 2 comics
        mockRepository.findById.mockResolvedValue(mockCharacter);
        mockRepository.getComicsByIds.mockResolvedValue([mockComics[0], mockComics[1]]);

        const result = await useCase.execute(1234);

        expect(result).toHaveLength(2);
      });

      it('should return empty array if repository returns empty', async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);
        mockRepository.getComicsByIds.mockResolvedValue([]);

        const result = await useCase.execute(1234);

        expect(result).toEqual([]);
      });
    });

    describe('Repository interaction', () => {
      it('should call each repository method exactly once', async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);
        mockRepository.getComicsByIds.mockResolvedValue(mockComics);

        await useCase.execute(1234);

        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockRepository.getComicsByIds).toHaveBeenCalledTimes(1);
      });

      it('should pass character ID correctly to both methods', async () => {
        mockRepository.findById.mockResolvedValue(mockCharacter);
        mockRepository.getComicsByIds.mockResolvedValue(mockComics);

        await useCase.execute(1234);

        const findByIdArg = mockRepository.findById.mock.calls[0]?.[0];
        const getComicsByIdsArg = mockRepository.getComicsByIds.mock.calls[0]?.[1];
        
        expect(findByIdArg?.value).toBe(1234);
        expect(getComicsByIdsArg?.value).toBe(1234);
      });
    });
  });
});
