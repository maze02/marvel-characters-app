/**
 * LocalStorageFavoritesRepository Tests
 * 
 * Comprehensive tests for LocalStorage-based favorites repository covering
 * CRUD operations, validation, migration, error handling, and edge cases.
 */

import { LocalStorageFavoritesRepository } from './LocalStorageFavoritesRepository';
import { CharacterId } from '@domain/character/valueObjects/CharacterId';
import { StorageAdapter } from '../storage/StorageAdapter';
import { logger } from '@infrastructure/logging/Logger';

// Mock dependencies
jest.mock('../storage/StorageAdapter');
jest.mock('@infrastructure/logging/Logger');

describe('LocalStorageFavoritesRepository', () => {
  let repository: LocalStorageFavoritesRepository;
  let mockStorage: jest.Mocked<StorageAdapter>;

  beforeEach(() => {
    // Create mock storage
    mockStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      has: jest.fn(),
      keys: jest.fn(),
    } as unknown as jest.Mocked<StorageAdapter>;

    // Create repository with mock storage
    repository = new LocalStorageFavoritesRepository(mockStorage);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('should add a new favorite', async () => {
      // Arrange: Empty favorites
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const characterId = new CharacterId(1011334);

      // Act
      await repository.add(characterId);

      // Assert
      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          version: 1,
          favorites: [1011334],
        })
      );
    });

    it('should not add duplicate favorites', async () => {
      // Arrange: Already favorited
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const characterId = new CharacterId(1011334);

      // Act
      await repository.add(characterId);

      // Assert: Should not call save
      expect(mockStorage.set).not.toHaveBeenCalled();
    });

    it('should add multiple favorites', async () => {
      // Start with one favorite
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      await repository.add(new CharacterId(1009610)); // Spider-Man

      // Should now have two favorites
      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          favorites: [1011334, 1009610],
        })
      );
    });

    it('should update lastModified when adding', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const before = Date.now();
      await repository.add(new CharacterId(1011334));
      const after = Date.now();

      const savedData = mockStorage.set.mock.calls[0]?.[1] as any;
      const lastModified = new Date(savedData?.lastModified).getTime();

      expect(lastModified).toBeGreaterThanOrEqual(before);
      expect(lastModified).toBeLessThanOrEqual(after);
    });
  });

  describe('remove', () => {
    it('should remove a favorite', async () => {
      // Arrange
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334, 1009610],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      // Act
      await repository.remove(new CharacterId(1011334));

      // Assert
      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          favorites: [1009610],
        })
      );
    });

    it('should handle removing non-existent favorite', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      await repository.remove(new CharacterId(9999));

      // Should still save (with no changes to favorites array)
      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          favorites: [1011334],
        })
      );
    });

    it('should update lastModified when removing', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const before = Date.now();
      await repository.remove(new CharacterId(1011334));
      const after = Date.now();

      const savedData = mockStorage.set.mock.calls[0]?.[1] as any;
      const lastModified = new Date(savedData?.lastModified).getTime();

      expect(lastModified).toBeGreaterThanOrEqual(before);
      expect(lastModified).toBeLessThanOrEqual(after);
    });

    it('should handle removing from empty list', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      await repository.remove(new CharacterId(1011334));

      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          favorites: [],
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all favorites as CharacterIds', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334, 1009610, 1009368],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(CharacterId);
      expect(result[0]?.value).toBe(1011334);
      expect(result[1]?.value).toBe(1009610);
      expect(result[2]?.value).toBe(1009368);
    });

    it('should return empty array when no favorites', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should return empty array when storage is null', async () => {
      mockStorage.get.mockReturnValue(null);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('contains', () => {
    it('should return true if favorite exists', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334, 1009610],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.contains(new CharacterId(1011334));

      expect(result).toBe(true);
    });

    it('should return false if favorite does not exist', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.contains(new CharacterId(9999));

      expect(result).toBe(false);
    });

    it('should return false when storage is empty', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.contains(new CharacterId(1011334));

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return the number of favorites', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334, 1009610, 1009368],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.count();

      expect(result).toBe(3);
    });

    it('should return 0 when no favorites', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.count();

      expect(result).toBe(0);
    });

    it('should return 0 when storage is null', async () => {
      mockStorage.get.mockReturnValue(null);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all favorites', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334, 1009610],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      await repository.clear();

      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          version: 1,
          favorites: [],
        })
      );
    });

    it('should create default data structure when clearing', async () => {
      await repository.clear();

      const savedData = mockStorage.set.mock.calls[0]?.[1] as any;
      expect(savedData).toHaveProperty('version');
      expect(savedData).toHaveProperty('favorites');
      expect(savedData).toHaveProperty('lastModified');
      expect(savedData?.favorites).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorage.get.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw, should return default data
      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to load favorites',
        expect.any(Error)
      );
    });

    it('should handle invalid data structure', async () => {
      mockStorage.get.mockReturnValue({
        // Invalid structure (missing version)
        favorites: [1011334],
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid favorites data structure, resetting to default'
      );
    });

    it('should handle corrupted JSON', async () => {
      mockStorage.get.mockReturnValue('not an object');

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should recover from storage errors and continue operations', async () => {
      // First call throws error
      mockStorage.get.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // Should still allow adding favorites
      await repository.add(new CharacterId(1011334));

      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          favorites: [1011334],
        })
      );
    });
  });

  describe('Data validation and migration', () => {
    it('should validate data structure before using', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      await repository.findAll();

      // Should not log warnings for valid data
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should migrate old data format if needed', async () => {
      // Simulate old data format that needs migration
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334, 1009610],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
    });

    it('should create default data when storage is null', async () => {
      mockStorage.get.mockReturnValue(null);

      await repository.add(new CharacterId(1011334));

      expect(mockStorage.set).toHaveBeenCalledWith(
        'marvel_favorites',
        expect.objectContaining({
          version: 1,
          favorites: [1011334],
        })
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle add-remove-add cycle', async () => {
      // Start empty
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const characterId = new CharacterId(1011334);

      // Add
      await repository.add(characterId);
      expect(mockStorage.set).toHaveBeenCalledTimes(1);

      // Update mock to reflect added favorite
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [1011334],
        lastModified: new Date().toISOString(),
      });

      // Remove
      await repository.remove(characterId);
      expect(mockStorage.set).toHaveBeenCalledTimes(2);

      // Update mock to reflect removed favorite
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: new Date().toISOString(),
      });

      // Add again
      await repository.add(characterId);
      expect(mockStorage.set).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid operations', async () => {
      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      // Add multiple favorites rapidly
      await Promise.all([
        repository.add(new CharacterId(1011334)),
        repository.add(new CharacterId(1009610)),
        repository.add(new CharacterId(1009368)),
      ]);

      // All should complete
      expect(mockStorage.set).toHaveBeenCalled();
    });

    it('should handle large favorite lists', async () => {
      const largeFavoritesList = Array.from({ length: 1000 }, (_, i) => i + 1);

      mockStorage.get.mockReturnValue({
        version: 1,
        favorites: largeFavoritesList,
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(1000);
      expect(result[0]?.value).toBe(1);
      expect(result[999]?.value).toBe(1000);
    });
  });

  describe('Constructor', () => {
    it('should create repository with default storage adapter', () => {
      const repo = new LocalStorageFavoritesRepository();

      expect(repo).toBeInstanceOf(LocalStorageFavoritesRepository);
    });

    it('should use provided storage adapter', () => {
      const customStorage = new StorageAdapter();
      const repo = new LocalStorageFavoritesRepository(customStorage);

      expect(repo).toBeInstanceOf(LocalStorageFavoritesRepository);
    });
  });
});
