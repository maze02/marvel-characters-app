/**
 * ReleaseDate Tests
 */

import { ReleaseDate } from './ReleaseDate';

describe('ReleaseDate', () => {
  describe('constructor', () => {
    it('should create from string', () => {
      const date = new ReleaseDate('2024-01-15');
      expect(date).toBeDefined();
    });

    it('should create from Date object', () => {
      const jsDate = new Date('2024-01-15');
      const date = new ReleaseDate(jsDate);
      expect(date).toBeDefined();
    });

    it('should throw on invalid date string', () => {
      expect(() => new ReleaseDate('invalid')).toThrow('Invalid release date');
    });
  });

  describe('value', () => {
    it('should return Date copy', () => {
      const date = new ReleaseDate('2024-01-15');
      const value1 = date.value;
      const value2 = date.value;
      
      expect(value1).not.toBe(value2); // Different instances
      expect(value1.getTime()).toBe(value2.getTime()); // Same value
    });
  });

  describe('toISOString', () => {
    it('should return ISO string', () => {
      const date = new ReleaseDate('2024-01-15');
      expect(date.toISOString()).toContain('2024-01-15');
    });
  });

  describe('toDisplayString', () => {
    it('should return formatted display string', () => {
      const date = new ReleaseDate('2024-01-15');
      const display = date.toDisplayString();
      expect(display).toContain('2024');
      expect(display).toContain('January');
    });
  });

  describe('compareTo', () => {
    it('should return negative when before', () => {
      const date1 = new ReleaseDate('2024-01-01');
      const date2 = new ReleaseDate('2024-01-15');
      expect(date1.compareTo(date2)).toBeLessThan(0);
    });

    it('should return positive when after', () => {
      const date1 = new ReleaseDate('2024-01-15');
      const date2 = new ReleaseDate('2024-01-01');
      expect(date1.compareTo(date2)).toBeGreaterThan(0);
    });

    it('should return zero when equal', () => {
      const date1 = new ReleaseDate('2024-01-15');
      const date2 = new ReleaseDate('2024-01-15');
      expect(date1.compareTo(date2)).toBe(0);
    });
  });

  describe('isBefore', () => {
    it('should return true when before', () => {
      const date1 = new ReleaseDate('2024-01-01');
      const date2 = new ReleaseDate('2024-01-15');
      expect(date1.isBefore(date2)).toBe(true);
    });

    it('should return false when after', () => {
      const date1 = new ReleaseDate('2024-01-15');
      const date2 = new ReleaseDate('2024-01-01');
      expect(date1.isBefore(date2)).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should return true when after', () => {
      const date1 = new ReleaseDate('2024-01-15');
      const date2 = new ReleaseDate('2024-01-01');
      expect(date1.isAfter(date2)).toBe(true);
    });

    it('should return false when before', () => {
      const date1 = new ReleaseDate('2024-01-01');
      const date2 = new ReleaseDate('2024-01-15');
      expect(date1.isAfter(date2)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same date', () => {
      const date1 = new ReleaseDate('2024-01-15');
      const date2 = new ReleaseDate('2024-01-15');
      expect(date1.equals(date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new ReleaseDate('2024-01-01');
      const date2 = new ReleaseDate('2024-01-15');
      expect(date1.equals(date2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return ISO string', () => {
      const date = new ReleaseDate('2024-01-15');
      expect(date.toString()).toContain('2024-01-15');
    });
  });
});
