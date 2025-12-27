/**
 * E2E Test Data Fixtures
 *
 * WHAT THIS IS:
 * Controlled test data that ensures consistent, predictable E2E test results.
 * Instead of relying on live API data that can change, we define expected data
 * structures and mock responses.
 *
 * WHY WE NEED THIS:
 * - Live API data can change (characters added/removed, descriptions updated)
 * - API rate limits can cause test failures
 * - Network issues can make tests flaky
 * - Controlled data makes tests deterministic and reliable
 *
 * TECHNICAL DETAILS:
 * - Follows Comic Vine API response structure
 * - Used for mocking API responses in error scenarios
 * - Can be extended for full API mocking if needed
 */

/**
 * Mock character data for testing (Comic Vine structure)
 */
export const mockCharacters = {
  // Character with full data (description, comics, etc.)
  spiderMan: {
    id: 1443,
    name: "Spider-Man",
    deck: "Spider-Man is the superhero persona of Peter Parker",
    description:
      "<p>Bitten by a radioactive spider, high school student Peter Parker gained the speed, strength and powers of a spider. Adopting the name Spider-Man, Peter hoped to start a career using his new abilities. Taught that with great power comes great responsibility, Spidey has vowed to use his powers to help people.</p>",
    image: {
      icon_url:
        "https://comicvine.gamespot.com/a/uploads/square_avatar/0/1443/105555-119489-spider-man.jpg",
      medium_url:
        "https://comicvine.gamespot.com/a/uploads/scale_medium/0/1443/105555-119489-spider-man.jpg",
      screen_url:
        "https://comicvine.gamespot.com/a/uploads/screen_medium/0/1443/105555-119489-spider-man.jpg",
      screen_large_url:
        "https://comicvine.gamespot.com/a/uploads/screen_kubrick/0/1443/105555-119489-spider-man.jpg",
      small_url:
        "https://comicvine.gamespot.com/a/uploads/scale_small/0/1443/105555-119489-spider-man.jpg",
      super_url:
        "https://comicvine.gamespot.com/a/uploads/scale_large/0/1443/105555-119489-spider-man.jpg",
      thumb_url:
        "https://comicvine.gamespot.com/a/uploads/scale_avatar/0/1443/105555-119489-spider-man.jpg",
      tiny_url:
        "https://comicvine.gamespot.com/a/uploads/square_mini/0/1443/105555-119489-spider-man.jpg",
      original_url:
        "https://comicvine.gamespot.com/a/uploads/original/0/1443/105555-119489-spider-man.jpg",
    },
    publisher: {
      id: 31,
      name: "Marvel",
    },
    date_added: "2024-01-01 00:00:00",
    date_last_updated: "2024-01-15 12:00:00",
    site_detail_url: "https://comicvine.gamespot.com/spider-man/4005-1443/",
    api_detail_url: "https://comicvine.gamespot.com/api/character/4005-1443/",
  },

  // Character with minimal data (no description, few comics)
  minimal: {
    id: 999999,
    name: "Test Character",
    deck: null,
    description: null,
    image: {
      icon_url:
        "https://comicvine.gamespot.com/a/uploads/square_avatar/11/11111/placeholder.jpg",
      medium_url:
        "https://comicvine.gamespot.com/a/uploads/scale_medium/11/11111/placeholder.jpg",
      screen_url:
        "https://comicvine.gamespot.com/a/uploads/screen_medium/11/11111/placeholder.jpg",
      screen_large_url:
        "https://comicvine.gamespot.com/a/uploads/screen_kubrick/11/11111/placeholder.jpg",
      small_url:
        "https://comicvine.gamespot.com/a/uploads/scale_small/11/11111/placeholder.jpg",
      super_url:
        "https://comicvine.gamespot.com/a/uploads/scale_large/11/11111/placeholder.jpg",
      thumb_url:
        "https://comicvine.gamespot.com/a/uploads/scale_avatar/11/11111/placeholder.jpg",
      tiny_url:
        "https://comicvine.gamespot.com/a/uploads/square_mini/11/11111/placeholder.jpg",
      original_url:
        "https://comicvine.gamespot.com/a/uploads/original/11/11111/placeholder.jpg",
    },
    publisher: {
      id: 31,
      name: "Marvel",
    },
    date_added: "2024-01-01 00:00:00",
    date_last_updated: "2024-01-01 00:00:00",
    site_detail_url:
      "https://comicvine.gamespot.com/test-character/4005-999999/",
    api_detail_url: "https://comicvine.gamespot.com/api/character/4005-999999/",
  },

  // Character with long description (for mobile expand/collapse testing)
  longDescription: {
    id: 1009,
    name: "Hulk",
    deck: "The incredible Hulk is the alter ego of Bruce Banner",
    description:
      "<p>Caught in a gamma bomb explosion while trying to save the life of a teenager, Dr. Bruce Banner was transformed into the incredibly powerful creature called the Hulk. An all too often misunderstood hero, the angrier the Hulk gets, the stronger the Hulk gets. This is a very long description that will definitely be truncated on mobile devices and require the READ MORE button to expand fully. The Hulk possesses an incredible level of superhuman physical ability.</p>",
    image: {
      icon_url:
        "https://comicvine.gamespot.com/a/uploads/square_avatar/0/1009/105555-hulk.jpg",
      medium_url:
        "https://comicvine.gamespot.com/a/uploads/scale_medium/0/1009/105555-hulk.jpg",
      screen_url:
        "https://comicvine.gamespot.com/a/uploads/screen_medium/0/1009/105555-hulk.jpg",
      screen_large_url:
        "https://comicvine.gamespot.com/a/uploads/screen_kubrick/0/1009/105555-hulk.jpg",
      small_url:
        "https://comicvine.gamespot.com/a/uploads/scale_small/0/1009/105555-hulk.jpg",
      super_url:
        "https://comicvine.gamespot.com/a/uploads/scale_large/0/1009/105555-hulk.jpg",
      thumb_url:
        "https://comicvine.gamespot.com/a/uploads/scale_avatar/0/1009/105555-hulk.jpg",
      tiny_url:
        "https://comicvine.gamespot.com/a/uploads/square_mini/0/1009/105555-hulk.jpg",
      original_url:
        "https://comicvine.gamespot.com/a/uploads/original/0/1009/105555-hulk.jpg",
    },
    publisher: {
      id: 31,
      name: "Marvel",
    },
    date_added: "2024-01-01 00:00:00",
    date_last_updated: "2024-01-15 12:00:00",
    site_detail_url: "https://comicvine.gamespot.com/hulk/4005-1009/",
    api_detail_url: "https://comicvine.gamespot.com/api/character/4005-1009/",
  },
};

/**
 * Mock API responses for error scenarios (Comic Vine structure)
 */
export const mockApiResponses = {
  // Empty character list (no results)
  emptyList: {
    error: "OK",
    limit: 50,
    offset: 0,
    number_of_page_results: 0,
    number_of_total_results: 0,
    status_code: 1,
    results: [],
  },

  // Character list with results
  characterList: (characters: any[]) => ({
    error: "OK",
    limit: 50,
    offset: 0,
    number_of_page_results: characters.length,
    number_of_total_results: characters.length,
    status_code: 1,
    results: characters,
  }),

  // Character detail response (single character, not array)
  characterDetail: (character: any) => ({
    error: "OK",
    limit: 1,
    offset: 0,
    number_of_page_results: 1,
    number_of_total_results: 1,
    status_code: 1,
    results: character,
  }),

  // 404 Not Found (Comic Vine error format)
  notFound: {
    error: "Object Not Found",
    limit: 1,
    offset: 0,
    number_of_page_results: 0,
    number_of_total_results: 0,
    status_code: 101,
    results: {},
  },

  // 500 Server Error (Comic Vine error format)
  serverError: {
    error: "Internal Server Error",
    limit: 0,
    offset: 0,
    number_of_page_results: 0,
    number_of_total_results: 0,
    status_code: 100,
    results: [],
  },

  // Rate limit exceeded (Comic Vine error format)
  rateLimitExceeded: {
    error: "Rate limit exceeded. Please try again later.",
    limit: 0,
    offset: 0,
    number_of_page_results: 0,
    number_of_total_results: 0,
    status_code: 107,
    results: [],
  },
};

/**
 * Test user data for favorites functionality
 */
export const testUsers = {
  // User with no favorites
  newUser: {
    favorites: [],
  },

  // User with some favorites (Comic Vine character IDs)
  existingUser: {
    favorites: [1443, 1009, 1456], // Spider-Man, Hulk, Iron Man
  },

  // User with many favorites (for testing search/pagination)
  powerUser: {
    favorites: Array.from({ length: 50 }, (_, i) => 1000 + i),
  },
};

/**
 * Search test data
 */
export const searchQueries = {
  // Queries that should return results
  valid: ["Spider", "Iron", "Captain", "Thor"],

  // Queries that should return no results
  invalid: [
    "ZZZNoMatchXXX",
    "InvalidCharacterName999",
    "ThisShouldNeverMatch123",
  ],

  // Edge case queries
  edgeCases: [
    "", // Empty search
    "a", // Single character
    "The Amazing Spider-Man", // Long query
    "spider-man", // With hyphen
    "SPIDER", // All caps
  ],
};

/**
 * Comics/Issues test data (Comic Vine structure)
 */
export const mockComics = {
  // Generate mock issues for testing infinite scroll
  generateComics: (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: 10000 + i,
      name: `Test Comic Title #${i + 1}`,
      issue_number: `${i + 1}`,
      volume: {
        id: 1000,
        name: "Test Comic Series",
      },
      cover_date: "2024-01-01",
      store_date: "2024-01-01",
      description: `<p>This is test comic issue #${i + 1}</p>`,
      image: {
        icon_url:
          "https://comicvine.gamespot.com/a/uploads/square_avatar/11/11111/placeholder.jpg",
        medium_url:
          "https://comicvine.gamespot.com/a/uploads/scale_medium/11/11111/placeholder.jpg",
        screen_url:
          "https://comicvine.gamespot.com/a/uploads/screen_medium/11/11111/placeholder.jpg",
        screen_large_url:
          "https://comicvine.gamespot.com/a/uploads/screen_kubrick/11/11111/placeholder.jpg",
        small_url:
          "https://comicvine.gamespot.com/a/uploads/scale_small/11/11111/placeholder.jpg",
        super_url:
          "https://comicvine.gamespot.com/a/uploads/scale_large/11/11111/placeholder.jpg",
        thumb_url:
          "https://comicvine.gamespot.com/a/uploads/scale_avatar/11/11111/placeholder.jpg",
        tiny_url:
          "https://comicvine.gamespot.com/a/uploads/square_mini/11/11111/placeholder.jpg",
        original_url:
          "https://comicvine.gamespot.com/a/uploads/original/11/11111/placeholder.jpg",
      },
      date_added: "2024-01-01 00:00:00",
      date_last_updated: "2024-01-01 00:00:00",
      site_detail_url: `https://comicvine.gamespot.com/test-comic-${i + 1}/4000-${10000 + i}/`,
      api_detail_url: `https://comicvine.gamespot.com/api/issue/4000-${10000 + i}/`,
    }));
  },

  // Comics response with pagination (Comic Vine structure)
  comicsResponse: (comics: any[], offset: number = 0) => ({
    error: "OK",
    limit: 20,
    offset,
    number_of_page_results: Math.min(20, comics.length - offset),
    number_of_total_results: comics.length,
    status_code: 1,
    results: comics.slice(offset, offset + 20),
  }),
};

/**
 * Helper to set up localStorage with test data
 */
export const setupLocalStorage = (data: Record<string, any>) => {
  return `
    localStorage.clear();
    ${Object.entries(data)
      .map(
        ([key, value]) =>
          `localStorage.setItem('${key}', '${JSON.stringify(value)}');`,
      )
      .join("\n")}
  `;
};

/**
 * Helper to mock API responses in tests
 *
 * USAGE EXAMPLE:
 * ```
 * await page.route('**\/characters\/?**', (route) => {
 *   route.fulfill({
 *     status: 200,
 *     contentType: 'application/json',
 *     body: JSON.stringify(mockApiResponses.emptyList)
 *   });
 * });
 * ```
 */
export const mockApiRoute = (response: any, status: number = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(response),
});
