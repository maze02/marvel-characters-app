import { Character } from './Character';
import { CharacterId } from '../valueObjects/CharacterId';
import { CharacterName } from '../valueObjects/CharacterName';
import { ImageUrl } from '../valueObjects/ImageUrl';

describe('Character', () => {
  const createTestCharacter = (overrides?: Partial<{
    id: CharacterId;
    name: CharacterName;
    description: string;
    thumbnail: ImageUrl;
    modifiedDate: Date;
  }>) => {
    return new Character({
      id: new CharacterId(1011334),
      name: new CharacterName('Spider-Man'),
      description: 'Friendly neighborhood Spider-Man',
      thumbnail: new ImageUrl('http://example.com/image', 'jpg'),
      modifiedDate: new Date('2024-01-01'),
      ...overrides,
    });
  };

  describe('constructor', () => {
    it('should create a valid character', () => {
      const character = createTestCharacter();
      expect(character.id.value).toBe(1011334);
      expect(character.name.value).toBe('Spider-Man');
    });

    it('should trim description whitespace', () => {
      const character = createTestCharacter({
        description: '  Some description  ',
      });
      expect(character.description).toBe('Some description');
    });
  });

  describe('hasDescription', () => {
    it('should return true when description exists', () => {
      const character = createTestCharacter();
      expect(character.hasDescription()).toBe(true);
    });

    it('should return false when description is empty', () => {
      const character = createTestCharacter({ description: '' });
      expect(character.hasDescription()).toBe(false);
    });
  });

  describe('matchesSearch', () => {
    it('should match character name', () => {
      const character = createTestCharacter();
      expect(character.matchesSearch('spider')).toBe(true);
      expect(character.matchesSearch('man')).toBe(true);
    });

    it('should not match non-matching term', () => {
      const character = createTestCharacter();
      expect(character.matchesSearch('batman')).toBe(false);
    });
  });

  describe('compareByName', () => {
    it('should sort characters alphabetically', () => {
      const spider = createTestCharacter({
        name: new CharacterName('Spider-Man'),
      });
      const iron = createTestCharacter({
        id: new CharacterId(1009368),
        name: new CharacterName('Iron Man'),
      });
      
      expect(spider.compareByName(iron)).toBeGreaterThan(0);
      expect(iron.compareByName(spider)).toBeLessThan(0);
    });
  });

  describe('equals', () => {
    it('should return true for same character ID', () => {
      const char1 = createTestCharacter();
      const char2 = createTestCharacter();
      expect(char1.equals(char2)).toBe(true);
    });

    it('should return false for different character IDs', () => {
      const char1 = createTestCharacter();
      const char2 = createTestCharacter({
        id: new CharacterId(999),
      });
      expect(char1.equals(char2)).toBe(false);
    });
  });
});
