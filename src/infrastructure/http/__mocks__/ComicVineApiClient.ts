/**
 * Manual Mock for ComicVineApiClient
 *
 * Jest will automatically use this mock when ComicVineApiClient is imported in tests.
 * This ensures all integration tests use mocked data instead of making real API calls.
 */

// Mock data that can be used in tests
export const mockCharactersData = [
  {
    id: 1,
    name: "Spider-Man",
    description: "Friendly neighborhood Spider-Man",
    thumbnail: { path: "https://example.com/spiderman", extension: "jpg" },
    modified: "2024-01-01",
    comics: { available: 10 },
  },
  {
    id: 2,
    name: "Iron Man",
    description: "Genius billionaire playboy philanthropist",
    thumbnail: { path: "https://example.com/ironman", extension: "jpg" },
    modified: "2024-01-01",
    comics: { available: 15 },
  },
  {
    id: 3,
    name: "Captain America",
    description: "Super soldier from World War II",
    thumbnail: { path: "https://example.com/cap", extension: "jpg" },
    modified: "2024-01-01",
    comics: { available: 20 },
  },
  {
    id: 4,
    name: "Thor",
    description: "God of Thunder",
    thumbnail: { path: "https://example.com/thor", extension: "jpg" },
    modified: "2024-01-01",
    comics: { available: 25 },
  },
  {
    id: 5,
    name: "Hulk",
    description: "The Incredible Hulk",
    thumbnail: { path: "https://example.com/hulk", extension: "jpg" },
    modified: "2024-01-01",
    comics: { available: 12 },
  },
];

export const mockComicsData = [
  {
    id: 1,
    title: "Amazing Spider-Man #1",
    thumbnail: { path: "https://example.com/comic1", extension: "jpg" },
    dates: [{ type: "onsaleDate", date: "2024-01-01" }],
  },
  {
    id: 2,
    title: "Amazing Spider-Man #2",
    thumbnail: { path: "https://example.com/comic2", extension: "jpg" },
    dates: [{ type: "onsaleDate", date: "2024-01-15" }],
  },
];

// Mock implementation of ComicVineApiClient
export class ComicVineApiClient {
  async getCharacters(params?: any): Promise<any> {
    return Promise.resolve({
      results: mockCharactersData,
      total: 100,
      offset: params?.offset || 0,
      limit: params?.limit || 50,
    });
  }

  async getCharacter(id: number): Promise<any> {
    const character = mockCharactersData.find((c) => c.id === id);
    if (!character) {
      return Promise.reject(new Error("Character not found"));
    }
    return Promise.resolve(character);
  }

  async getCharacterComics(_characterId: number, params?: any): Promise<any> {
    return Promise.resolve({
      results: mockComicsData,
      total: mockComicsData.length,
      offset: params?.offset || 0,
      limit: params?.limit || 20,
    });
  }

  async searchCharacters(query: string): Promise<any> {
    const filtered = mockCharactersData.filter((char) =>
      char.name.toLowerCase().includes(query.toLowerCase()),
    );
    return Promise.resolve({
      results: filtered,
      total: filtered.length,
    });
  }

  // Additional methods that might be called
  cancelPendingRequests(): void {
    // No-op in mock
  }

  clearCache(): void {
    // No-op in mock
  }
}

// Export as default as well for compatibility
export default ComicVineApiClient;
