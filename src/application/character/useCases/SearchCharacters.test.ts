/**
 * SearchCharacters Tests
 * 
 * Tests for search functionality covering empty queries, trimming,
 * filtering, error handling, and search result structure.
 */

import { SearchCharacters } from './SearchCharacters';
import { CharacterRepository } from '@domain/character/ports/CharacterRepository';
import { Character } from '@domain/character/entities/Character';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { CharacterName } from '@domain/character/valueObjects/CharacterName';
import { ImageUrl } from '@domain/character/valueObjects/ImageUrl';

describe('SearchCharacters', () => {
  let useCase: SearchCharacters;
  let mockRepository: jest.Mocked<CharacterRepository>;
  let mockCharacters: Character[];

  beforeEach(() => {
    // Create mock characters with valid image URLs
    mockCharacters = [
      new Character({
        id: new CharacterId(1009610),
        name: new CharacterName('Spider-Man'),
        description: 'Friendly neighborhood Spider-Man',
        thumbnail: new ImageUrl('http://example.com/spiderman', 'jpg'),
        modifiedDate: new Date('2024-01-01'),
      }),
      new Character({
        id: new CharacterId(1009608),
        name: new CharacterName('Spider-Woman'),
        description: 'Jessica Drew',
        thumbnail: new ImageUrl('http://example.com/spiderwoman', 'jpg'),
        modifiedDate: new Date('2024-01-01'),
      }),
      new Character({
        id: new CharacterId(1011347),
        name: new CharacterName('Spider-Girl'),
        description: 'May Parker',
        thumbnail: new ImageUrl('http://example.com/spidergirl', 'jpg'),
        modifiedDate: new Date('2024-01-01'),
      }),
    ];

    // Create mock repository
    mockRepository = {
      searchByName: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      findMany: jest.fn(),
      getComics: jest.fn(),
    } as jest.Mocked<CharacterRepository>;

    useCase = new SearchCharacters(mockRepository);
  });

  describe('execute', () => {
    describe('Empty query handling', () => {
      it('should return empty results for empty string', async () => {
        const result = await useCase.execute('');

        expect(result.characters).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.query).toBe('');
        expect(mockRepository.searchByName).not.toHaveBeenCalled();
      });

      it('should return empty results for whitespace-only query', async () => {
        const result = await useCase.execute('   ');

        expect(result.characters).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.query).toBe('');
        expect(mockRepository.searchByName).not.toHaveBeenCalled();
      });

      it('should return empty results for tabs and newlines', async () => {
        const result = await useCase.execute('\t\n  \n\t');

        expect(result.characters).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.query).toBe('');
      });
    });

    describe('Query trimming', () => {
      it('should trim leading whitespace', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('  Spider');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider');
      });

      it('should trim trailing whitespace', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('Spider  ');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider');
      });

      it('should trim both leading and trailing whitespace', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('  Spider  ');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider');
      });

      it('should preserve internal whitespace', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('Spider Man');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider Man');
      });
    });

    describe('Basic search', () => {
      it('should search by name', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('Spider');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider');
        expect(result.characters).toEqual(mockCharacters);
        expect(result.count).toBe(3);
        expect(result.query).toBe('Spider');
      });

      it('should return all matching characters', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('Spider');

        expect(result.characters).toHaveLength(3);
        expect(result.characters[0]?.name.value).toBe('Spider-Man');
        expect(result.characters[1]?.name.value).toBe('Spider-Woman');
        expect(result.characters[2]?.name.value).toBe('Spider-Girl');
      });

      it('should return correct count', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('Spider');

        expect(result.count).toBe(mockCharacters.length);
      });

      it('should return the trimmed query', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('  Spider  ');

        expect(result.query).toBe('Spider');
      });
    });

    describe('Contains filter', () => {
      it('should apply contains filter when option is true', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('Spider', { useContainsFilter: true });

        expect(result.characters).toEqual(mockCharacters);
      });

      it('should filter characters using matchesSearch', async () => {
        // Create characters where matchesSearch returns different values
        const character1 = new Character({
          id: new CharacterId(1),
          name: new CharacterName('Spider-Man'),
          description: 'Test description',
          thumbnail: new ImageUrl('http://example.com/1', 'jpg'),
          modifiedDate: new Date(),
        });
        const character2 = new Character({
          id: new CharacterId(2),
          name: new CharacterName('Iron Man'),
          description: 'Test description',
          thumbnail: new ImageUrl('http://example.com/2', 'jpg'),
          modifiedDate: new Date(),
        });

        // Mock matchesSearch to filter out Iron Man
        jest.spyOn(character1, 'matchesSearch').mockReturnValue(true);
        jest.spyOn(character2, 'matchesSearch').mockReturnValue(false);

        mockRepository.searchByName.mockResolvedValue([character1, character2]);

        const result = await useCase.execute('Spider', { useContainsFilter: true });

        expect(result.characters).toHaveLength(1);
        expect(result.characters[0]?.name.value).toBe('Spider-Man');
        expect(character1.matchesSearch).toHaveBeenCalledWith('Spider');
        expect(character2.matchesSearch).toHaveBeenCalledWith('Spider');
      });

      it('should not apply filter when option is false', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('Spider', { useContainsFilter: false });

        expect(result.characters).toEqual(mockCharacters);
        // matchesSearch should not be called
      });

      it('should not apply filter when option is undefined', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('Spider');

        expect(result.characters).toEqual(mockCharacters);
      });

      it('should update count after filtering', async () => {
        const character1 = new Character({
          id: new CharacterId(1),
          name: new CharacterName('Spider-Man'),
          description: 'Test description',
          thumbnail: new ImageUrl('http://example.com/1', 'jpg'),
          modifiedDate: new Date(),
        });
        const character2 = new Character({
          id: new CharacterId(2),
          name: new CharacterName('Iron Man'),
          description: 'Test description',
          thumbnail: new ImageUrl('http://example.com/2', 'jpg'),
          modifiedDate: new Date(),
        });

        jest.spyOn(character1, 'matchesSearch').mockReturnValue(true);
        jest.spyOn(character2, 'matchesSearch').mockReturnValue(false);

        mockRepository.searchByName.mockResolvedValue([character1, character2]);

        const result = await useCase.execute('Spider', { useContainsFilter: true });

        expect(result.count).toBe(1); // Only Spider-Man matches
      });
    });

    describe('No results', () => {
      it('should handle no results from repository', async () => {
        mockRepository.searchByName.mockResolvedValue([]);

        const result = await useCase.execute('NonExistent');

        expect(result.characters).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.query).toBe('NonExistent');
      });

      it('should handle no results after filtering', async () => {
        const character = new Character({
          id: new CharacterId(1),
          name: new CharacterName('Iron Man'),
          description: 'Test description',
          thumbnail: new ImageUrl('http://example.com/1', 'jpg'),
          modifiedDate: new Date(),
        });

        jest.spyOn(character, 'matchesSearch').mockReturnValue(false);

        mockRepository.searchByName.mockResolvedValue([character]);

        const result = await useCase.execute('Spider', { useContainsFilter: true });

        expect(result.characters).toEqual([]);
        expect(result.count).toBe(0);
      });
    });

    describe('Error handling', () => {
      it('should propagate repository errors', async () => {
        const error = new Error('API Error');
        mockRepository.searchByName.mockRejectedValue(error);

        await expect(useCase.execute('Spider')).rejects.toThrow('API Error');
      });

      it('should propagate network errors', async () => {
        mockRepository.searchByName.mockRejectedValue(new Error('Network error'));

        await expect(useCase.execute('Spider')).rejects.toThrow('Network error');
      });

      it('should handle repository returning null', async () => {
        mockRepository.searchByName.mockResolvedValue(null as any);

        await expect(useCase.execute('Spider')).rejects.toThrow();
      });
    });

    describe('Special characters', () => {
      it('should handle special characters in query', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('Spider-Man');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider-Man');
      });

      it('should handle parentheses in query', async () => {
        mockRepository.searchByName.mockResolvedValue([]);

        await useCase.execute('Spider-Man (Peter Parker)');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider-Man (Peter Parker)');
      });

      it('should handle single quotes in query', async () => {
        mockRepository.searchByName.mockResolvedValue([]);

        await useCase.execute("T'Challa");

        expect(mockRepository.searchByName).toHaveBeenCalledWith("T'Challa");
      });

      it('should handle numbers in query', async () => {
        mockRepository.searchByName.mockResolvedValue([]);

        await useCase.execute('Spider-Man 2099');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('Spider-Man 2099');
      });
    });

    describe('Case sensitivity', () => {
      it('should handle lowercase query', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('spider');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('spider');
      });

      it('should handle uppercase query', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('SPIDER');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('SPIDER');
      });

      it('should handle mixed case query', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        await useCase.execute('SpIdEr');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('SpIdEr');
      });
    });

    describe('Edge cases', () => {
      it('should handle single character query', async () => {
        mockRepository.searchByName.mockResolvedValue(mockCharacters);

        const result = await useCase.execute('S');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('S');
        expect(result.query).toBe('S');
      });

      it('should handle very long query', async () => {
        const longQuery = 'A'.repeat(1000);
        mockRepository.searchByName.mockResolvedValue([]);

        await useCase.execute(longQuery);

        expect(mockRepository.searchByName).toHaveBeenCalledWith(longQuery);
      });

      it('should handle query with only special characters', async () => {
        mockRepository.searchByName.mockResolvedValue([]);

        await useCase.execute('!@#$%');

        expect(mockRepository.searchByName).toHaveBeenCalledWith('!@#$%');
      });
    });
  });

  describe('SearchResult structure', () => {
    it('should return object with characters, count, and query', async () => {
      mockRepository.searchByName.mockResolvedValue(mockCharacters);

      const result = await useCase.execute('Spider');

      expect(result).toHaveProperty('characters');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('query');
    });

    it('should return characters as array', async () => {
      mockRepository.searchByName.mockResolvedValue(mockCharacters);

      const result = await useCase.execute('Spider');

      expect(Array.isArray(result.characters)).toBe(true);
    });

    it('should return count as number', async () => {
      mockRepository.searchByName.mockResolvedValue(mockCharacters);

      const result = await useCase.execute('Spider');

      expect(typeof result.count).toBe('number');
    });

    it('should return query as string', async () => {
      mockRepository.searchByName.mockResolvedValue(mockCharacters);

      const result = await useCase.execute('Spider');

      expect(typeof result.query).toBe('string');
    });
  });
});
