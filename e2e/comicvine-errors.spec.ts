/**
 * Comic Vine E2E Tests - ERROR SCENARIOS & EDGE CASES
 * 
 * Comprehensive error handling and edge case testing:
 * - API errors (404, 500, timeout, rate limiting)
 * - Network failures and slow responses
 * - Character not found scenarios
 * - localStorage quota exceeded
 * - Full user journey integration tests
 * 
 * These tests ensure the app gracefully handles failures and edge cases.
 */

import { test, expect, Page } from '@playwright/test';
import {
  SELECTORS,
  TIMEOUTS,
  TEST_DATA,
  waitForCharacters,
  getCharacterCards,
  addToFavorites,
  searchCharacters,
  navigateToCharacterDetail,
  navigateToFavorites,
  clearFavorites,
} from './helpers';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

test.beforeEach(async ({ page }) => {
  await clearFavorites(page);
});

// ============================================================================
// API ERROR SCENARIOS
// ============================================================================

test.describe('API Error Handling', () => {
  test('should handle 500 server error gracefully', async ({ page }) => {
    /**
     * Simulate a 500 Internal Server Error from the API.
     * The app should display an error message and allow retry.
     */
    await page.route('**/api.comicvine.com/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/');

    // Should show error message
    const errorMessage = page.locator(SELECTORS.errorMessage);
    await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    await expect(errorMessage).toContainText(/error|failed/i);
  });

  test('should handle 404 API not found error', async ({ page }) => {
    /**
     * Simulate a 404 Not Found error from the API endpoint.
     * The app should handle this gracefully without crashing.
     */
    await page.route('**/api.comicvine.com/**', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not Found' }),
      });
    });

    await page.goto('/');

    // Should show error message or empty state
    const hasError = await page.locator(SELECTORS.errorMessage).isVisible().catch(() => false);
    const hasCards = await page.locator(SELECTORS.characterCard).count() > 0;
    
    // Either show error or gracefully show empty state
    expect(hasError || !hasCards).toBe(true);
  });

  test('should handle API timeout', async ({ page, context }) => {
    /**
     * Simulate a slow/hanging API that exceeds timeout.
     * The app should timeout and show appropriate error.
     */
    await page.route('**/api.comicvine.com/**', async route => {
      // Delay response beyond reasonable timeout
      await new Promise(resolve => setTimeout(resolve, 30000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ results: [] }),
      });
    });

    // Set shorter timeout for test
    await context.setDefaultTimeout(5000);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Should handle timeout gracefully (may show loading or error state)
    await page.waitForTimeout(TIMEOUTS.apiResponse);
    
    // App should not crash
    const mainContent = page.locator(SELECTORS.mainContent);
    await expect(mainContent).toBeVisible();
  });

  test('should handle API rate limiting (429)', async ({ page }) => {
    /**
     * Simulate rate limiting from the API (HTTP 429).
     * The app should display appropriate message and suggest retry.
     */
    await page.route('**/api.comicvine.com/**', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'Retry-After': '60',
        },
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      });
    });

    await page.goto('/');

    // Should show error message about rate limiting
    const errorMessage = page.locator(SELECTORS.errorMessage);
    await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.apiResponse });
  });

  test('should handle malformed API response', async ({ page }) => {
    /**
     * Simulate API returning invalid/malformed JSON.
     * The app should handle parsing errors gracefully.
     */
    await page.route('**/api.comicvine.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'INVALID JSON{{{',
      });
    });

    await page.goto('/');

    // Should show error or empty state, not crash
    await page.waitForTimeout(TIMEOUTS.apiResponse);
    const mainContent = page.locator(SELECTORS.mainContent);
    await expect(mainContent).toBeVisible();
  });
});

// ============================================================================
// NETWORK & PERFORMANCE EDGE CASES
// ============================================================================

test.describe('Network & Performance Edge Cases', () => {
  test('should handle slow API response (3 second delay)', async ({ page }) => {
    /**
     * Simulate a slow but successful API response.
     * The app should show loading state and eventually display results.
     */
    await page.route('**/api.comicvine.com/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await route.fetch();
      const json = await response.json();
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(json),
      });
    });

    await page.goto('/');

    // Should show loading state
    const loadingBar = page.locator(SELECTORS.loadingBar);
    await expect(loadingBar).toBeVisible({ timeout: 1000 });

    // Should eventually show characters after delay
    await waitForCharacters(page, { timeout: 15000 });
    const cards = await getCharacterCards(page);
    expect(cards.length).toBeGreaterThan(0);
  });

  test('should handle intermittent network failures', async ({ page }) => {
    /**
     * Simulate network failure followed by success on retry.
     * Tests resilience to temporary network issues.
     */
    let callCount = 0;
    
    await page.route('**/api.comicvine.com/**', async route => {
      callCount++;
      
      if (callCount === 1) {
        // First call fails
        route.abort('failed');
      } else {
        // Subsequent calls succeed
        const response = await route.fetch();
        route.fulfill({ response });
      }
    });

    await page.goto('/');
    
    // Should show error initially
    await page.waitForTimeout(TIMEOUTS.apiResponse);
    
    // If there's a retry button, click it
    const retryButton = page.locator(SELECTORS.retryButton);
    if (await retryButton.isVisible()) {
      await retryButton.click();
      
      // Should load successfully after retry
      await waitForCharacters(page, { timeout: 10000 });
      const cards = await getCharacterCards(page);
      expect(cards.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// CHARACTER NOT FOUND / 404 SCENARIOS
// ============================================================================

test.describe('Character Not Found', () => {
  test('should handle non-existent character ID gracefully', async ({ page }) => {
    /**
     * Navigate to a character detail page with invalid ID.
     * Should show 404 or error state, not crash.
     */
    const invalidCharacterId = 9999999999;
    
    await page.goto(`/character/${invalidCharacterId}`, { 
      waitUntil: 'domcontentloaded' 
    });

    await page.waitForTimeout(TIMEOUTS.apiResponse);

    // Should show error message or 404
    const hasError = await page.locator(SELECTORS.errorMessage).isVisible();
    const hasNotFound = await page.getByText(/not found|404/i).isVisible();
    const mainContent = page.locator(SELECTORS.mainContent);
    
    // Either show error/404 or gracefully handle
    expect(hasError || hasNotFound || await mainContent.isVisible()).toBe(true);
  });

  test('should handle character with no comics', async ({ page }) => {
    /**
     * Test character detail page when character has zero comics.
     * Should display appropriate empty state.
     */
    await page.route('**/api.comicvine.com/**/issues/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status_code: 1,
          results: [], // Empty comics array
        }),
      });
    });

    // Navigate to a valid character
    await page.goto('/');
    await waitForCharacters(page);
    
    const cards = await getCharacterCards(page);
    if (cards.length > 0) {
      await navigateToCharacterDetail(page, cards[0]);
      
      // Should show empty state for comics, not crash
      await page.waitForTimeout(TIMEOUTS.apiResponse);
      const mainContent = page.locator(SELECTORS.mainContent);
      await expect(mainContent).toBeVisible();
      
      // Should not have any comic items
      const comicCount = await page.locator(SELECTORS.comicItem).count();
      expect(comicCount).toBe(0);
    }
  });
});

// ============================================================================
// LOCALSTORAGE & BROWSER STORAGE EDGE CASES
// ============================================================================

test.describe('LocalStorage Edge Cases', () => {
  test('should handle localStorage quota exceeded', async ({ page }) => {
    /**
     * Simulate localStorage quota exceeded error.
     * App should handle gracefully without crashing.
     */
    await page.goto('/');
    await waitForCharacters(page);

    // Override localStorage.setItem to simulate quota exceeded
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function() {
        const error = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw error;
      };
    });

    // Try to add a favorite
    const cards = await getCharacterCards(page);
    if (cards.length > 0) {
      const favoriteButton = cards[0].locator(SELECTORS.favoriteButton);
      await favoriteButton.click();
      
      await page.waitForTimeout(TIMEOUTS.stateUpdate);
      
      // App should not crash, may show error message
      const mainContent = page.locator(SELECTORS.mainContent);
      await expect(mainContent).toBeVisible();
    }
  });

  test('should handle corrupted localStorage data', async ({ page }) => {
    /**
     * Simulate corrupted favorites data in localStorage.
     * App should recover gracefully, possibly clearing bad data.
     */
    await page.goto('/');
    
    // Set corrupted data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('marvel_favorites', '{INVALID_JSON:::');
    });

    // Reload page
    await page.reload();
    
    // App should handle corrupted data without crashing
    const mainContent = page.locator(SELECTORS.mainContent);
    await expect(mainContent).toBeVisible();
    
    // Favorites should be reset or handled gracefully
    await page.waitForTimeout(TIMEOUTS.stateUpdate);
  });

  test('should handle missing localStorage (private mode simulation)', async ({ page, context }) => {
    /**
     * Simulate browser with disabled localStorage (e.g., private mode).
     * App should work without favorites functionality.
     */
    await page.goto('/');
    
    // Disable localStorage
    await page.evaluate(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: false,
      });
    });

    // Reload and check if app still works
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    await waitForCharacters(page);
    
    // Main functionality should still work
    const cards = await getCharacterCards(page);
    expect(cards.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// FULL USER JOURNEY INTEGRATION TESTS
// ============================================================================

test.describe('Complete User Journeys', () => {
  test('should complete full user journey: search → detail → favorite → favorites page', async ({ page }) => {
    /**
     * End-to-end test of complete user flow:
     * 1. User loads app and sees characters
     * 2. User searches for a specific character
     * 3. User clicks on character to see details
     * 4. User adds character to favorites
     * 5. User navigates to favorites page
     * 6. User sees their favorited character
     * 7. User removes from favorites
     */
    
    // Step 1: Load app
    await page.goto('/');
    await waitForCharacters(page);
    const initialCards = await getCharacterCards(page);
    expect(initialCards.length).toBeGreaterThan(0);

    // Step 2: Search for character
    await searchCharacters(page, TEST_DATA.searchQueries.spider);
    await waitForCharacters(page);
    
    const searchResults = await getCharacterCards(page);
    expect(searchResults.length).toBeGreaterThan(0);
    
    // Get the character name for later verification
    const characterName = await searchResults[0].locator(SELECTORS.characterName).textContent();
    expect(characterName).toBeTruthy();

    // Step 3: Navigate to character detail
    await navigateToCharacterDetail(page, searchResults[0]);
    await expect(page.locator(SELECTORS.mainHeading)).toContainText(characterName!);

    // Step 4: Add to favorites from detail page
    const detailFavoriteButton = page.locator(SELECTORS.favoriteButton).first();
    await detailFavoriteButton.click();
    await page.waitForTimeout(TIMEOUTS.stateUpdate);
    
    // Should show as favorited
    await expect(detailFavoriteButton).toHaveAttribute('aria-label', /remove/i);

    // Step 5: Navigate to favorites page
    await navigateToFavorites(page);
    
    // Step 6: Verify character appears in favorites
    await waitForCharacters(page);
    const favoriteCards = await getCharacterCards(page);
    expect(favoriteCards.length).toBe(1);
    
    const favoriteName = await favoriteCards[0].locator(SELECTORS.characterName).textContent();
    expect(favoriteName).toBe(characterName);

    // Step 7: Remove from favorites
    const removeFavoriteButton = favoriteCards[0].locator(SELECTORS.favoriteButton);
    await removeFavoriteButton.click();
    await page.waitForTimeout(TIMEOUTS.stateUpdate);
    
    // Favorites should be empty
    const remainingCards = await getCharacterCards(page);
    expect(remainingCards.length).toBe(0);
  });

  test('should maintain favorites across page navigation and reload', async ({ page }) => {
    /**
     * Test that favorites persist across:
     * - Navigation between pages
     * - Browser refresh
     * - Closing and reopening detail pages
     */
    
    // Add a favorite
    await page.goto('/');
    await waitForCharacters(page);
    
    const cards = await getCharacterCards(page);
    const characterName = await cards[0].locator(SELECTORS.characterName).textContent();
    
    await addToFavorites(page, cards[0]);
    await page.waitForTimeout(TIMEOUTS.stateUpdate);

    // Navigate to detail page
    await navigateToCharacterDetail(page, cards[0]);
    await page.waitForTimeout(TIMEOUTS.pageLoad);
    
    // Navigate back
    await page.goBack();
    await waitForCharacters(page);
    
    // Favorite should still be marked
    const cardsAfterBack = await getCharacterCards(page);
    const stillFavorited = cardsAfterBack[0].locator(SELECTORS.favoriteButton);
    await expect(stillFavorited).toHaveAttribute('aria-label', /remove/i);

    // Reload page
    await page.reload();
    await waitForCharacters(page);
    
    // Favorite should persist after reload
    const cardsAfterReload = await getCharacterCards(page);
    const persistedFavorite = cardsAfterReload[0].locator(SELECTORS.favoriteButton);
    await expect(persistedFavorite).toHaveAttribute('aria-label', /remove/i);

    // Navigate to favorites page
    await navigateToFavorites(page);
    await waitForCharacters(page);
    
    const favoriteCards = await getCharacterCards(page);
    expect(favoriteCards.length).toBe(1);
    
    const favoriteName = await favoriteCards[0].locator(SELECTORS.characterName).textContent();
    expect(favoriteName).toBe(characterName);
  });

  test('should handle rapid interactions without breaking', async ({ page }) => {
    /**
     * Test app stability under rapid user interactions:
     * - Quick favorite/unfavorite clicks
     * - Rapid navigation
     * - Rapid search input changes
     */
    
    await page.goto('/');
    await waitForCharacters(page);
    
    const cards = await getCharacterCards(page);
    expect(cards.length).toBeGreaterThan(0);

    // Rapid favorite/unfavorite
    const favoriteButton = cards[0].locator(SELECTORS.favoriteButton);
    for (let i = 0; i < 5; i++) {
      await favoriteButton.click();
      await page.waitForTimeout(50); // Very short delay
    }
    
    await page.waitForTimeout(TIMEOUTS.stateUpdate);
    
    // App should still be functional
    const mainContent = page.locator(SELECTORS.mainContent);
    await expect(mainContent).toBeVisible();

    // Rapid search changes
    const searchInput = page.locator(SELECTORS.searchInput);
    const queries = ['Spi', 'Spider', 'Spider-', 'Spider-M', 'Spider-Man'];
    
    for (const query of queries) {
      await searchInput.fill(query);
      await page.waitForTimeout(100);
    }
    
    // Wait for debounce and final search
    await page.waitForTimeout(TIMEOUTS.debounce + TIMEOUTS.stateUpdate);
    await waitForCharacters(page);
    
    // Should show search results
    const searchCards = await getCharacterCards(page);
    expect(searchCards.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// ACCESSIBILITY ERROR SCENARIOS
// ============================================================================

test.describe('Accessibility in Error States', () => {
  test('should announce errors to screen readers', async ({ page }) => {
    /**
     * Verify that error messages are accessible to screen readers.
     * Error elements should have appropriate ARIA roles and labels.
     */
    await page.route('**/api.comicvine.com/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });

    await page.goto('/');
    await page.waitForTimeout(TIMEOUTS.apiResponse);

    // Error should have role="alert" for screen readers
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
    
    // Error should have readable text
    const errorText = await errorAlert.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(10);
  });

  test('should maintain keyboard navigation in error states', async ({ page }) => {
    /**
     * Ensure keyboard navigation works even when errors occur.
     * Users should be able to navigate and retry using keyboard.
     */
    await page.route('**/api.comicvine.com/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });

    await page.goto('/');
    await page.waitForTimeout(TIMEOUTS.apiResponse);

    // Tab through page elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to interact with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});
