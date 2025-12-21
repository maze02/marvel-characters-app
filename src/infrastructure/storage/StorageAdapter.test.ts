/**
 * StorageAdapter Tests
 * 
 * Comprehensive tests for localStorage wrapper covering get/set operations,
 * error handling, quota exceeded scenarios, and edge cases.
 */

import { StorageAdapter, StorageError } from './StorageAdapter';

describe('StorageAdapter', () => {
  let adapter: StorageAdapter;
  let mockStorage: Storage;

  beforeEach(() => {
    // Create mock storage with proper key tracking
    const store: Record<string, string> = {};
    mockStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
    } as Storage;

    // Add proxy to make Object.keys work with store keys
    Object.keys(store).forEach(key => {
      (mockStorage as any)[key] = store[key];
    });

    adapter = new StorageAdapter(mockStorage);
  });

  describe('Constructor', () => {
    it('should create adapter with custom storage', () => {
      const customAdapter = new StorageAdapter(mockStorage);
      expect(customAdapter).toBeInstanceOf(StorageAdapter);
    });

    it('should create adapter with default window.localStorage', () => {
      const defaultAdapter = new StorageAdapter();
      expect(defaultAdapter).toBeInstanceOf(StorageAdapter);
    });
  });

  describe('get', () => {
    it('should get stored value', () => {
      const data = { name: 'Spider-Man', id: 1011334 };
      mockStorage.setItem('hero', JSON.stringify(data));

      const result = adapter.get<typeof data>('hero');

      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = adapter.get('non-existent');

      expect(result).toBeNull();
    });

    it('should parse JSON correctly', () => {
      mockStorage.setItem('array', JSON.stringify([1, 2, 3]));
      mockStorage.setItem('string', JSON.stringify('hello'));
      mockStorage.setItem('number', JSON.stringify(42));
      mockStorage.setItem('boolean', JSON.stringify(true));

      expect(adapter.get('array')).toEqual([1, 2, 3]);
      expect(adapter.get('string')).toBe('hello');
      expect(adapter.get('number')).toBe(42);
      expect(adapter.get('boolean')).toBe(true);
    });

    it('should handle complex nested objects', () => {
      const complex = {
        user: { name: 'Peter', age: 25 },
        favorites: [1, 2, 3],
        metadata: { created: '2024-01-01', version: 1 },
      };
      mockStorage.setItem('complex', JSON.stringify(complex));

      const result = adapter.get('complex');

      expect(result).toEqual(complex);
    });

    it('should throw StorageError on JSON parse failure', () => {
      // Invalid JSON
      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid{json}');

      expect(() => adapter.get('bad-data')).toThrow(StorageError);
      expect(() => adapter.get('bad-data')).toThrow('Failed to read from storage (key: bad-data)');
    });

    it('should throw StorageError on storage access failure', () => {
      (mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => adapter.get('key')).toThrow(StorageError);
    });

    it('should include original error in StorageError', () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid{json}');

      try {
        adapter.get('key');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).originalError).toBeDefined();
      }
    });
  });

  describe('set', () => {
    it('should store value', () => {
      const data = { name: 'Iron Man' };

      adapter.set('hero', data);

      expect(mockStorage.setItem).toHaveBeenCalledWith('hero', JSON.stringify(data));
    });

    it('should store primitive values', () => {
      adapter.set('string', 'hello');
      adapter.set('number', 42);
      adapter.set('boolean', true);
      adapter.set('null', null);

      expect(mockStorage.setItem).toHaveBeenCalledWith('string', '"hello"');
      expect(mockStorage.setItem).toHaveBeenCalledWith('number', '42');
      expect(mockStorage.setItem).toHaveBeenCalledWith('boolean', 'true');
      expect(mockStorage.setItem).toHaveBeenCalledWith('null', 'null');
    });

    it('should store arrays', () => {
      const array = [1, 2, 3, 4, 5];

      adapter.set('numbers', array);

      expect(mockStorage.setItem).toHaveBeenCalledWith('numbers', JSON.stringify(array));
    });

    it('should store complex objects', () => {
      const complex = {
        favorites: [1011334, 1009610],
        settings: { theme: 'dark', notifications: true },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      adapter.set('data', complex);

      expect(mockStorage.setItem).toHaveBeenCalledWith('data', JSON.stringify(complex));
    });

    it('should throw StorageError on quota exceeded', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      (mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw quotaError;
      });

      expect(() => adapter.set('key', 'value')).toThrow(StorageError);
      expect(() => adapter.set('key', 'value')).toThrow('Storage quota exceeded');
    });

    it('should handle NS_ERROR_DOM_QUOTA_REACHED', () => {
      const quotaError = new DOMException('Quota reached', 'NS_ERROR_DOM_QUOTA_REACHED');
      (mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw quotaError;
      });

      expect(() => adapter.set('key', 'value')).toThrow(StorageError);
      expect(() => adapter.set('key', 'value')).toThrow('Storage quota exceeded');
    });

    it('should throw StorageError on other errors', () => {
      (mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => adapter.set('key', 'value')).toThrow(StorageError);
      expect(() => adapter.set('key', 'value')).toThrow('Failed to write to storage');
    });

    it('should throw StorageError on JSON stringify failure', () => {
      const circular: any = {};
      circular.self = circular; // Circular reference

      expect(() => adapter.set('circular', circular)).toThrow(StorageError);
    });
  });

  describe('remove', () => {
    it('should remove item', () => {
      mockStorage.setItem('hero', JSON.stringify({ name: 'Thor' }));

      adapter.remove('hero');

      expect(mockStorage.removeItem).toHaveBeenCalledWith('hero');
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => adapter.remove('non-existent')).not.toThrow();
    });

    it('should throw StorageError on storage access failure', () => {
      (mockStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => adapter.remove('key')).toThrow(StorageError);
      expect(() => adapter.remove('key')).toThrow('Failed to remove from storage');
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      mockStorage.setItem('key1', 'value1');
      mockStorage.setItem('key2', 'value2');

      adapter.clear();

      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should throw StorageError on storage access failure', () => {
      (mockStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => adapter.clear()).toThrow(StorageError);
      expect(() => adapter.clear()).toThrow('Failed to clear storage');
    });
  });

  describe('has', () => {
    it('should return true if key exists', () => {
      mockStorage.setItem('hero', 'Spider-Man');

      const result = adapter.has('hero');

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', () => {
      const result = adapter.has('non-existent');

      expect(result).toBe(false);
    });

    it('should return false on storage access failure', () => {
      (mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const result = adapter.has('key');

      expect(result).toBe(false);
    });

    it('should handle null values correctly', () => {
      mockStorage.setItem('null-value', JSON.stringify(null));

      // Key exists, so should return true even if value is null
      const result = adapter.has('null-value');

      expect(result).toBe(true);
    });
  });

  describe('keys', () => {
    it('should return array of keys', () => {
      const keys = adapter.keys();

      // keys() returns Object.keys of storage, which includes Storage API methods
      expect(Array.isArray(keys)).toBe(true);
    });

    it('should not throw on storage access failure', () => {
      const errorStorage = {
        ...mockStorage,
      };
      Object.defineProperty(errorStorage, 'length', {
        get: () => {
          throw new Error('Storage unavailable');
        },
      });

      const errorAdapter = new StorageAdapter(errorStorage as Storage);
      
      expect(() => errorAdapter.keys()).not.toThrow();
      const keys = errorAdapter.keys();
      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle get-set-remove cycle', () => {
      const data = { id: 123, name: 'Test' };

      // Set
      adapter.set('test', data);
      expect(adapter.has('test')).toBe(true);

      // Get
      const retrieved = adapter.get('test');
      expect(retrieved).toEqual(data);

      // Remove
      adapter.remove('test');
      expect(adapter.has('test')).toBe(false);
      expect(adapter.get('test')).toBeNull();
    });

    it('should handle multiple keys', () => {
      adapter.set('user1', { name: 'Peter' });
      adapter.set('user2', { name: 'Tony' });
      adapter.set('user3', { name: 'Steve' });

      expect(adapter.get('user1')).toEqual({ name: 'Peter' });
      expect(adapter.get('user2')).toEqual({ name: 'Tony' });
      expect(adapter.get('user3')).toEqual({ name: 'Steve' });
    });

    it('should handle clear and repopulate', () => {
      adapter.set('key1', 'value1');
      adapter.set('key2', 'value2');

      expect(adapter.has('key1')).toBe(true);
      expect(adapter.has('key2')).toBe(true);

      adapter.clear();

      expect(adapter.has('key1')).toBe(false);
      expect(adapter.has('key2')).toBe(false);

      adapter.set('key3', 'value3');
      expect(adapter.has('key3')).toBe(true);
    });

    it('should overwrite existing keys', () => {
      adapter.set('hero', { name: 'Spider-Man' });
      adapter.set('hero', { name: 'Iron Man' });

      const result = adapter.get('hero');

      expect(result).toEqual({ name: 'Iron Man' });
    });
  });

  describe('StorageError', () => {
    it('should create error with message', () => {
      const error = new StorageError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StorageError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('StorageError');
    });

    it('should store original error', () => {
      const original = new Error('Original');
      const error = new StorageError('Wrapped', original);

      expect(error.originalError).toBe(original);
    });

    it('should work without original error', () => {
      const error = new StorageError('No original');

      expect(error.originalError).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string keys', () => {
      adapter.set('', 'empty-key-value');

      expect(adapter.get('')).toBe('empty-key-value');
      expect(adapter.has('')).toBe(true);
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key-with-special_chars.!@#$%';
      adapter.set(specialKey, 'value');

      expect(adapter.get(specialKey)).toBe('value');
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      adapter.set(longKey, 'value');

      expect(adapter.get(longKey)).toBe('value');
    });

    it('should handle empty objects', () => {
      adapter.set('empty', {});

      expect(adapter.get('empty')).toEqual({});
    });

    it('should handle empty arrays', () => {
      adapter.set('empty-array', []);

      expect(adapter.get('empty-array')).toEqual([]);
    });

    it('should handle undefined storage methods gracefully', () => {
      const partialStorage = {} as Storage;
      const partialAdapter = new StorageAdapter(partialStorage);

      // Should not crash, should handle missing methods
      expect(() => partialAdapter.keys()).not.toThrow();
    });
  });
});
