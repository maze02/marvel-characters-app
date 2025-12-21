/**
 * E2E Test Helpers
 * 
 * Reusable functions and constants for E2E tests.
 * Following DRY (Don't Repeat Yourself) principle.
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// CONSTANTS - Named values instead of magic numbers (KISS principle)
// ============================================================================

/**
 * CSS selectors used throughout tests.
 * Centralized to avoid duplication (DRY).
 */
export const SELECTORS = {
  // Character cards
  characterCard: '[data-testid="character-card"]',
  characterName: '[data-testid="character-card"] h2',
  favoriteButton: 'button[aria-label*="favorite"]',
  addFavoriteButton: 'button[aria-label*="Add"]',
  
  // Search
  searchInput: 'input[type="search"]',
  
  // Navigation
  logo: '[data-testid="logo"]',
  favoritesButton: 'header button[aria-label*="favorites"]',
  favoritesCount: '[data-testid="favorites-count"]',
  backButton: 'a[href="/"]',
  
  // Page elements
  mainHeading: 'h1',
  mainContent: 'main',
  resultsText: 'text=/RESULTS/',
  
  // Detail page
  comicItem: '[data-testid="comic-item"]',
  characterDescription: '[data-testid="character-description"]',
  
  // Loading states
  loadingBar: '[data-testid="loading-bar"]',
  
  // Error states
  errorMessage: '[role="alert"]',
  retryButton: 'button:has-text("Retry")',
} as const;

/**
 * Timeout values in milliseconds.
 * Named to explain what each timeout is for (KISS).
 */
export const TIMEOUTS = {
  pageLoad: 10000,       // Initial page load with API call
  apiResponse: 5000,     // Wait for API response
  stateUpdate: 200,      // React state update time
  debounce: 500,         // Search input debounce delay
  animation: 300,        // CSS animation duration
  networkIdle: 2000,     // Wait for network to be idle
} as const;

/**
 * Test data and requirements.
 * Makes tests self-documenting (KISS).
 */
export const TEST_DATA = {
  // Search queries
  searchQueries: {
    spider: 'Spider',
    ironMan: 'Iron Man',
    nonExistent: 'XYZ999NonExistent',
  },
  
  // Character IDs (known valid IDs for testing)
  characterIds: {
    spiderMan: 1009610,
    ironMan: 1009368,
  },
  
  // Requirements
  minCardsOnLoad: 1,          // At least 1 card should load
  minFavoritesForFilter: 2,   // Need 2 favorites to test filter
  maxComicsPerCharacter: 20,  // API limit
} as const;

// ============================================================================
// HELPER FUNCTIONS - Reusable actions (DRY principle)
// ============================================================================

/**
 * Wait for characters to load on the page.
 * 
 * Why: This is repeated in almost every test.
 * Benefit: Single place to update if selector changes.
 * 
 * @param page - Playwright page object
 */
export async function waitForCharacters(page: Page): Promise<void> {
  await page.waitForSelector(SELECTORS.characterCard, {
    timeout: TIMEOUTS.pageLoad,
    state: 'visible',
  });
}

/**
 * Get all character cards currently on the page.
 * 
 * Why: Avoids repeating the same selector query.
 * Benefit: Type-safe, consistent way to get cards.
 * 
 * @param page - Playwright page object
 * @returns Array of character card elements
 */
export async function getCharacterCards(page: Page) {
  return page.locator(SELECTORS.characterCard).all();
}

/**
 * Count how many character cards are visible.
 * 
 * Why: Common assertion in many tests.
 * Benefit: Clear, readable test code.
 * 
 * @param page - Playwright page object
 * @returns Number of visible character cards
 */
export async function countCharacterCards(page: Page): Promise<number> {
  const cards = await getCharacterCards(page);
  return cards.length;
}

/**
 * Add a character to favorites by card index.
 * 
 * Why: This action is repeated in multiple tests.
 * Benefit: Encapsulates the complexity of finding and clicking.
 * 
 * @param page - Playwright page object
 * @param cardIndex - Index of card to favorite (0-based)
 */
export async function addToFavorites(page: Page, cardIndex = 0): Promise<void> {
  const card = page.locator(SELECTORS.characterCard).nth(cardIndex);
  const favoriteBtn = card.locator(SELECTORS.addFavoriteButton);
  
  await favoriteBtn.click();
  
  // Wait for state to update (React needs time)
  await page.waitForTimeout(TIMEOUTS.stateUpdate);
}

/**
 * Get the current favorites count from the header.
 * 
 * Why: Common check in favorites tests.
 * Benefit: Handles both visible and hidden states.
 * 
 * @param page - Playwright page object
 * @returns Favorites count as number, or 0 if not visible
 */
export async function getFavoritesCount(page: Page): Promise<number> {
  const countElement = page.locator(SELECTORS.favoritesCount);
  const isVisible = await countElement.isVisible().catch(() => false);
  
  if (!isVisible) {
    return 0;
  }
  
  const text = await countElement.textContent();
  return parseInt(text || '0', 10);
}

/**
 * Search for characters by name.
 * 
 * Why: Search is used in multiple tests with same pattern.
 * Benefit: Handles debounce wait automatically.
 * 
 * @param page - Playwright page object
 * @param query - Search query string
 */
export async function searchCharacters(page: Page, query: string): Promise<void> {
  const searchInput = page.locator(SELECTORS.searchInput);
  await searchInput.fill(query);
  
  // Wait for debounce + API response
  await page.waitForTimeout(TIMEOUTS.debounce);
  await page.waitForLoadState('networkidle');
}

/**
 * Clear search input and wait for results.
 * 
 * Why: Clearing search is a common action.
 * Benefit: Consistent way to clear with proper waiting.
 * 
 * @param page - Playwright page object
 */
export async function clearSearch(page: Page): Promise<void> {
  const searchInput = page.locator(SELECTORS.searchInput);
  await searchInput.clear();
  
  // Wait for debounce + API response
  await page.waitForTimeout(TIMEOUTS.debounce);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to character detail page by ID.
 * 
 * Why: Multiple tests need to go to detail pages.
 * Benefit: Centralizes URL construction.
 * 
 * @param page - Playwright page object
 * @param characterId - Character ID
 */
export async function navigateToCharacterDetail(
  page: Page,
  characterId: number
): Promise<void> {
  await page.goto(`/character/${characterId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Scroll to bottom of page to trigger infinite scroll.
 * 
 * Why: Infinite scroll tests need this action.
 * Benefit: Encapsulates the scroll mechanism.
 * 
 * @param page - Playwright page object
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

/**
 * Navigate to favorites page using header button.
 * 
 * Why: Multiple tests need to go to favorites page.
 * Benefit: Consistent navigation method.
 * 
 * @param page - Playwright page object
 */
export async function navigateToFavorites(page: Page): Promise<void> {
  const favoritesBtn = page.locator(SELECTORS.favoritesButton);
  await favoritesBtn.click();
  
  // Wait for navigation
  await page.waitForURL(/\/favorites/);
  await page.waitForLoadState('networkidle');
}

/**
 * Go back to home page using back button.
 * 
 * Why: Tests need to navigate back from detail pages.
 * Benefit: Consistent back navigation.
 * 
 * @param page - Playwright page object
 */
export async function navigateBack(page: Page): Promise<void> {
  const backBtn = page.locator(SELECTORS.backButton);
  await backBtn.click();
  
  // Wait for navigation
  await page.waitForURL('/');
  await page.waitForLoadState('networkidle');
}

/**
 * Assert that a loading indicator is visible.
 * 
 * Why: Loading states are important for UX.
 * Benefit: Consistent way to check loading state.
 * 
 * @param page - Playwright page object
 */
export async function expectLoadingIndicator(page: Page): Promise<void> {
  const loadingBar = page.locator(SELECTORS.loadingBar);
  await expect(loadingBar).toBeVisible({ timeout: TIMEOUTS.stateUpdate });
}

/**
 * Assert that page shows expected number of results.
 * 
 * Why: Many tests check result counts.
 * Benefit: Readable, reusable assertion.
 * 
 * @param page - Playwright page object
 * @param expectedCount - Expected number of results
 */
export async function expectResultCount(
  page: Page,
  expectedCount: number
): Promise<void> {
  const resultsText = await page.textContent(SELECTORS.resultsText);
  expect(resultsText).toContain(`${expectedCount} RESULT`);
}

/**
 * Clear all favorites from localStorage.
 * 
 * Why: Tests need clean state.
 * Benefit: Ensures tests don't interfere with each other.
 * 
 * @param page - Playwright page object
 */
export async function clearFavorites(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('marvel-favorites');
  });
}

/**
 * Set favorites in localStorage.
 * 
 * Why: Some tests need pre-populated favorites.
 * Benefit: Fast test setup without UI interaction.
 * 
 * @param page - Playwright page object
 * @param characterIds - Array of character IDs to favorite
 */
export async function setFavorites(
  page: Page,
  characterIds: number[]
): Promise<void> {
  await page.evaluate((ids) => {
    localStorage.setItem('marvel-favorites', JSON.stringify(ids));
  }, characterIds);
}
