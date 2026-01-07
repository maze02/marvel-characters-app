/**
 * Storage Error for storage operation failures
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Storage Adapter
 *
 * Safe wrapper around localStorage with error handling.
 * Provides type-safe get/set operations with JSON serialization.
 *
 * @example
 * ```typescript
 * const storage = new StorageAdapter();
 * storage.set('key', { data: 'value' });
 * const data = storage.get<{ data: string }>('key');
 * ```
 */
export class StorageAdapter {
  private readonly storage: Storage;

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage;
  }

  /**
   * Get item from storage
   *
   * @param key - Storage key
   * @returns Parsed data or null if not found
   * @throws {StorageError} if storage access fails
   */
  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);

      if (item === null) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      throw new StorageError(
        `Failed to read from storage (key: ${key})`,
        error,
      );
    }
  }

  /**
   * Set item in storage
   *
   * @param key - Storage key
   * @param value - Data to store (will be JSON stringified)
   * @throws {StorageError} if storage access fails or quota exceeded
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
    } catch (error) {
      // Check for quota exceeded error
      if (
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" ||
          error.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        throw new StorageError(
          "Storage quota exceeded. Please clear some favorites.",
          error,
        );
      }

      throw new StorageError(`Failed to write to storage (key: ${key})`, error);
    }
  }

  /**
   * Remove item from storage
   *
   * @param key - Storage key
   * @throws {StorageError} if storage access fails
   */
  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      throw new StorageError(
        `Failed to remove from storage (key: ${key})`,
        error,
      );
    }
  }

  /**
   * Clear all items from storage
   *
   * @throws {StorageError} if storage access fails
   */
  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      throw new StorageError("Failed to clear storage", error);
    }
  }

  /**
   * Check if key exists in storage
   *
   * @param key - Storage key
   * @returns true if key exists, false otherwise
   */
  has(key: string): boolean {
    try {
      return this.storage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys in storage
   *
   * @returns Array of storage keys
   */
  keys(): string[] {
    try {
      return Object.keys(this.storage);
    } catch {
      return [];
    }
  }
}
