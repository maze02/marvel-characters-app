import { CharacterId } from './CharacterId';

describe('CharacterId', () => {
  describe('constructor', () => {
    it('should create a valid character ID', () => {
      const id = new CharacterId(1011334);
      expect(id.value).toBe(1011334);
    });

    it('should throw error for non-integer values', () => {
      expect(() => new CharacterId(123.45)).toThrow('Must be a positive integer');
    });

    it('should throw error for zero', () => {
      expect(() => new CharacterId(0)).toThrow('Must be a positive integer');
    });

    it('should throw error for negative numbers', () => {
      expect(() => new CharacterId(-1)).toThrow('Must be a positive integer');
    });
  });

  describe('equals', () => {
    it('should return true for equal IDs', () => {
      const id1 = new CharacterId(123);
      const id2 = new CharacterId(123);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const id1 = new CharacterId(123);
      const id2 = new CharacterId(456);
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation of ID', () => {
      const id = new CharacterId(1011334);
      expect(id.toString()).toBe('1011334');
    });
  });
});
