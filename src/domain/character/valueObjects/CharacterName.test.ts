import { CharacterName } from './CharacterName';

describe('CharacterName', () => {
  describe('constructor', () => {
    it('should create a valid character name', () => {
      const name = new CharacterName('Spider-Man');
      expect(name.value).toBe('Spider-Man');
    });

    it('should trim whitespace', () => {
      const name = new CharacterName('  Spider-Man  ');
      expect(name.value).toBe('Spider-Man');
    });

    it('should throw error for empty string', () => {
      expect(() => new CharacterName('')).toThrow('cannot be empty');
    });

    it('should throw error for whitespace only', () => {
      expect(() => new CharacterName('   ')).toThrow('cannot be empty');
    });

    it('should throw error for name exceeding max length', () => {
      const longName = 'a'.repeat(201);
      expect(() => new CharacterName(longName)).toThrow('cannot exceed');
    });
  });

  describe('contains', () => {
    it('should match substring case-insensitively', () => {
      const name = new CharacterName('Spider-Man');
      expect(name.contains('spider')).toBe(true);
      expect(name.contains('SPIDER')).toBe(true);
      expect(name.contains('Man')).toBe(true);
    });

    it('should return false for non-matching substring', () => {
      const name = new CharacterName('Spider-Man');
      expect(name.contains('Batman')).toBe(false);
    });
  });

  describe('startsWith', () => {
    it('should match prefix case-insensitively', () => {
      const name = new CharacterName('Spider-Man');
      expect(name.startsWith('Spider')).toBe(true);
      expect(name.startsWith('SPIDER')).toBe(true);
      expect(name.startsWith('Sp')).toBe(true);
    });

    it('should return false for non-matching prefix', () => {
      const name = new CharacterName('Spider-Man');
      expect(name.startsWith('Man')).toBe(false);
    });
  });
});
