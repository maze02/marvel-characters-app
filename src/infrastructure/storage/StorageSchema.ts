/**
 * Storage schema versions for migration support
 */
export const STORAGE_VERSION = 1;

/**
 * Favorites data structure
 */
export interface FavoritesData {
  version: number;
  favorites: number[]; // Array of character IDs
  lastModified: string; // ISO date string
}

/**
 * Create default favorites data
 */
export function createDefaultFavoritesData(): FavoritesData {
  return {
    version: STORAGE_VERSION,
    favorites: [],
    lastModified: new Date().toISOString(),
  };
}

/**
 * Validate favorites data structure
 */
export function validateFavoritesData(data: unknown): data is FavoritesData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.version === "number" &&
    Array.isArray(obj.favorites) &&
    obj.favorites.every((id) => typeof id === "number") &&
    typeof obj.lastModified === "string"
  );
}

/**
 * Migrate favorites data to current version
 */
export function migrateFavoritesData(data: FavoritesData): FavoritesData {
  // Currently only version 1 exists
  // Future versions would add migration logic here

  if (data.version === STORAGE_VERSION) {
    return data;
  }

  // If unknown version, reset to default
  return createDefaultFavoritesData();
}
