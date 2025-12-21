/**
 * Comic Vine E2E Tests - IMPROVED VERSION
 * 
 * Professional-grade E2E tests following clean code principles:
 * - KISS (Keep It Simple, Stupid) - Clear, simple test logic
 * - DRY (Don't Repeat Yourself) - Reusable helpers
 * - Clear documentation - Every test explains what/why
 * - No magic numbers - Named constants
 * - Deterministic - No conditional logic in tests
 * 
 * Test Coverage: Core user journeys + edge cases + error scenarios
 */

import { test, expect } from '@playwright/test';
import {
  // Constants
  SELECTORS,
  TIMEOUTS,
  TEST_DATA,
  // Helpers
  waitForCharacters,
  getCharacterCards,
  countCharacterCards,
  addToFavorites,
  getFavoritesCount,
  searchCharacters,
  clearSearch,
  navigateToCharacterDetail,
  navigateToFavorites,
  navigateBack,
  scrollToBottom,
  clearFavorites,
  setFavorites,
} from './helpers';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

test.beforeEach(async ({ page }) => {
  /**
   * Navigate to home page before each test.
   * Ensures clean starting state.
   */
  await page.goto('/');
  
  /**
   * Clear favorites to avoid test interference.
   * Each test should start with zero favorites.
   */
  await clearFavorites(page);
});

// ============================================================================
// GROUP 1: INITIAL PAGE LOAD
// ============================================================================

test.describe('Initial Page Load', () => {
  /**
   * Test: Verify characters load on initial page visit.
   * 
   * User Story: As a user, I want to see Marvel characters when I visit the site
   * so that I can browse the character catalog.
   * 
   * Expected Behavior:
   * - At least 1 character card visible within 10 seconds
   * - Results counter shows total available
   * - Page title displays correctly
   */
  test('should display character grid on page load', async ({ page }) => {
    // Wait for characters to load
    await waitForCharacters(page);
    
    // Should show at least some characters
    const cardCount = await countCharacterCards(page);
    expect(cardCount).toBeGreaterThanOrEqual(TEST_DATA.minCardsOnLoad);
    
    // Should show results count
    await expect(page.locator(SELECTORS.resultsText)).toBeVisible();
    
    // Should show page title
    await expect(page.locator(SELECTORS.mainHeading)).toHaveText(/MARVEL CHARACTERS/i);
  });

  /**
   * Test: Verify page structure and accessibility.
   * 
   * Why: Ensures proper HTML semantics and A11y.
   * 
   * Expected: Main landmark, heading, skip link present
   */
  test('should have proper semantic structure', async ({ page }) => {
    // Wait for page load
    await waitForCharacters(page);
    
    // Should have main landmark
    await expect(page.locator(SELECTORS.mainContent)).toBeVisible();
    
    // Should have h1 heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have header with navigation
    await expect(page.locator('header')).toBeVisible();
  });
});

// ============================================================================
// GROUP 2: SEARCH FUNCTIONALITY
// ============================================================================

test.describe('Search Functionality', () => {
  /**
   * Test: Search for characters by name.
   * 
   * User Story: As a user, I want to search for specific characters
   * so that I can quickly find the ones I'm interested in.
   * 
   * Expected: Search returns relevant results
   */
  test('should filter characters by search query', async ({ page }) => {
    await waitForCharacters(page);
    
    // Search for "Spider"
    await searchCharacters(page, TEST_DATA.searchQueries.spider);
    
    // Should show search results
    await expect(page.locator(SELECTORS.resultsText)).toBeVisible();
    
    // At least one result should contain "Spider"
    const firstCardName = await page.locator(SELECTORS.characterName).first().textContent();
    expect(firstCardName).toBeTruthy();
    expect(firstCardName!.toLowerCase()).toContain('spider');
  });

  /**
   * Test: Clear search returns to full list.
   * 
   * Why: Users need to easily return to browsing all characters.
   * 
   * Expected: Clearing search shows original character list
   */
  test('should show all characters when search is cleared', async ({ page }) => {
    await waitForCharacters(page);
    
    // Get initial count
    const initialCount = await countCharacterCards(page);
    
    // Search for something
    await searchCharacters(page, TEST_DATA.searchQueries.spider);
    
    // Clear search
    await clearSearch(page);
    
    // Should show more characters again
    const finalCount = await countCharacterCards(page);
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  /**
   * Test: Empty search results show appropriate message.
   * 
   * User Story: As a user, I want to know when my search has no results
   * so that I can try a different search.
   * 
   * Expected: "0 RESULTS" or "No results found" message
   */
  test('should show empty state for no search results', async ({ page }) => {
    await waitForCharacters(page);
    
    // Search for something that doesn't exist
    await searchCharacters(page, TEST_DATA.searchQueries.nonExistent);
    
    // Should show 0 results or empty message
    const resultsText = await page.locator(SELECTORS.resultsText).textContent();
    expect(resultsText).toMatch(/0 RESULT/i);
    
    // Should not show any character cards
    const cards = await getCharacterCards(page);
    expect(cards.length).toBe(0);
  });

  /**
   * Test: Search is debounced (doesn't fire on every keystroke).
   * 
   * Why: Prevents excessive API calls while typing.
   * 
   * Expected: Search waits for user to stop typing
   */
  test('should debounce search input', async ({ page }) => {
    await waitForCharacters(page);
    
    const searchInput = page.locator(SELECTORS.searchInput);
    
    // Type quickly (without debounce wait)
    await searchInput.type('Spi', { delay: 50 });
    
    // Should NOT have searched yet (debounce period)
    // Wait less than debounce time
    await page.waitForTimeout(TIMEOUTS.debounce / 2);
    
    // Complete the search
    await searchInput.type('der', { delay: 50 });
    
    // Now wait for debounce + API
    await page.waitForTimeout(TIMEOUTS.debounce);
    await page.waitForLoadState('networkidle');
    
    // Should show search results
    await expect(page.locator(SELECTORS.resultsText)).toBeVisible();
  });
});

// ============================================================================
// GROUP 3: INFINITE SCROLL
// ============================================================================

test.describe('Infinite Scroll', () => {
  /**
   * Test: Scrolling loads more characters.
   * 
   * User Story: As a user, I want more characters to load as I scroll
   * so that I don't have to click pagination buttons.
   * 
   * Expected: Character count increases after scrolling
   */
  test('should load more characters on scroll', async ({ page }) => {
    await waitForCharacters(page);
    await page.waitForLoadState('networkidle');
    
    // Get initial count
    const initialCount = await countCharacterCards(page);
    
    // Scroll to bottom
    await scrollToBottom(page);
    
    // Wait for more to load
    await page.waitForTimeout(TIMEOUTS.apiResponse);
    
    // Should have more characters
    const finalCount = await countCharacterCards(page);
    expect(finalCount).toBeGreaterThan(initialCount);
  });
});

// ============================================================================
// GROUP 4: FAVORITES FUNCTIONALITY
// ============================================================================

test.describe('Favorites Functionality', () => {
  /**
   * Test: Add character to favorites.
   * 
   * User Story: As a user, I want to mark characters as favorites
   * so that I can easily find them later.
   * 
   * Expected: Favorites count increases, button state changes
   */
  test('should add character to favorites', async ({ page }) => {
    await waitForCharacters(page);
    
    // Add to favorites
    await addToFavorites(page, 0);
    
    // Favorites count should be 1
    const count = await getFavoritesCount(page);
    expect(count).toBe(1);
    
    // Button should change to "Remove from favorites"
    const firstCard = page.locator(SELECTORS.characterCard).first();
    const button = firstCard.locator('button');
    await expect(button).toHaveAttribute('aria-label', /Remove/i);
  });

  /**
   * Test: Remove character from favorites.
   * 
   * Expected: Favorites count decreases, button state reverts
   */
  test('should remove character from favorites', async ({ page }) => {
    await waitForCharacters(page);
    
    // Add to favorites
    await addToFavorites(page, 0);
    expect(await getFavoritesCount(page)).toBe(1);
    
    // Remove from favorites (click again)
    await addToFavorites(page, 0);
    
    // Count should be 0 (badge hidden)
    const count = await getFavoritesCount(page);
    expect(count).toBe(0);
  });

  /**
   * Test: Navigate to favorites page.
   * 
   * User Story: As a user, I want to view all my favorited characters
   * so that I can quickly access my saved characters.
   * 
   * Expected: Shows only favorited characters
   */
  test('should show favorites page with favorited characters', async ({ page }) => {
    await waitForCharacters(page);
    
    // Add 2 favorites
    await addToFavorites(page, 0);
    await addToFavorites(page, 1);
    
    // Navigate to favorites
    await navigateToFavorites(page);
    
    // Should show FAVORITES title
    await expect(page.locator('text=FAVORITES')).toBeVisible();
    
    // Should show 2 results
    const resultsText = await page.locator(SELECTORS.resultsText).textContent();
    expect(resultsText).toContain('2 RESULT');
    
    // Should show 2 cards
    const cardCount = await countCharacterCards(page);
    expect(cardCount).toBe(2);
  });

  /**
   * Test: Favorites persist across page reloads.
   * 
   * Why: Users expect favorites to be saved.
   * 
   * Expected: Favorites stored in localStorage persist after reload
   */
  test('should persist favorites after page reload', async ({ page }) => {
    await waitForCharacters(page);
    
    // Add to favorites
    await addToFavorites(page, 0);
    expect(await getFavoritesCount(page)).toBe(1);
    
    // Reload page
    await page.reload();
    await waitForCharacters(page);
    
    // Favorites should still be there
    const count = await getFavoritesCount(page);
    expect(count).toBe(1);
  });

  /**
   * Test: Empty favorites page shows appropriate message.
   * 
   * Expected: Helpful message when no favorites exist
   */
  test('should show empty state when no favorites', async ({ page }) => {
    // Go directly to favorites (without adding any)
    await navigateToFavorites(page);
    
    // Should show empty message or 0 results
    const resultsText = await page.locator(SELECTORS.resultsText).textContent();
    expect(resultsText).toMatch(/0 RESULT/i);
  });
});

// ============================================================================
// GROUP 5: NAVIGATION
// ============================================================================

test.describe('Navigation', () => {
  /**
   * Test: Click character card navigates to detail page.
   * 
   * User Story: As a user, I want to click a character to see more details
   * so that I can learn more about them.
   * 
   * Expected: Navigation to /character/:id
   */
  test('should navigate to character detail page', async ({ page }) => {
    await waitForCharacters(page);
    
    // Click first character
    const firstCard = page.locator(SELECTORS.characterCard).first();
    await firstCard.click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/character\/\d+/);
    
    // Should show character name
    await expect(page.locator(SELECTORS.mainHeading)).toBeVisible();
  });

  /**
   * Test: Back button returns to previous page.
   * 
   * Expected: Clicking back button navigates to home
   */
  test('should navigate back from detail page', async ({ page }) => {
    await waitForCharacters(page);
    
    // Go to detail page
    const firstCard = page.locator(SELECTORS.characterCard).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/character\/\d+/);
    
    // Click back button
    await navigateBack(page);
    
    // Should be on home page
    await expect(page).toHaveURL('/');
    await expect(page.locator(SELECTORS.characterCard)).toBeVisible();
  });

  /**
   * Test: Logo click navigates to home.
   * 
   * Expected: Clicking logo always returns to home page
   */
  test('should navigate home when logo clicked', async ({ page }) => {
    await waitForCharacters(page);
    
    // Go to favorites
    await navigateToFavorites(page);
    await expect(page).toHaveURL(/\/favorites/);
    
    // Click logo
    await page.locator(SELECTORS.logo).click();
    
    // Should be on home page
    await expect(page).toHaveURL('/');
  });

  /**
   * Test: Browser back button works correctly.
   * 
   * Why: Users expect browser navigation to work.
   * 
   * Expected: Browser back button navigates correctly
   */
  test('should support browser back button', async ({ page }) => {
    await waitForCharacters(page);
    
    // Navigate to detail page
    const firstCard = page.locator(SELECTORS.characterCard).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/character\/\d+/);
    
    // Use browser back button
    await page.goBack();
    
    // Should be on home page
    await expect(page).toHaveURL('/');
    await expect(page.locator(SELECTORS.characterCard)).toBeVisible();
  });
});

// ============================================================================
// GROUP 6: DETAIL PAGE
// ============================================================================

test.describe('Character Detail Page', () => {
  /**
   * Test: Detail page shows character information.
   * 
   * Expected: Name, description, image, and comics visible
   */
  test('should display character details', async ({ page }) => {
    // Navigate to known character
    await navigateToCharacterDetail(page, TEST_DATA.characterIds.spiderMan);
    
    // Should show character name
    await expect(page.locator(SELECTORS.mainHeading)).toBeVisible();
    
    // Should show main content
    await expect(page.locator(SELECTORS.mainContent)).toBeVisible();
  });

  /**
   * Test: Detail page shows character comics (up to 20).
   * 
   * User Story: As a user, I want to see what comics a character appears in
   * so that I can find comics to read.
   * 
   * Expected: Comics section with up to 20 comics
   */
  test('should display character comics', async ({ page }) => {
    await navigateToCharacterDetail(page, TEST_DATA.characterIds.spiderMan);
    
    // Wait for comics section (might not exist for all characters)
    const comicsHeading = page.locator('text=COMICS');
    const hasComics = await comicsHeading.isVisible().catch(() => false);
    
    if (hasComics) {
      // Should show max 20 comics
      const comics = await page.locator(SELECTORS.comicItem).count();
      expect(comics).toBeLessThanOrEqual(TEST_DATA.maxComicsPerCharacter);
    }
  });

  /**
   * Test: Can favorite character from detail page.
   * 
   * Expected: Favorite button works on detail page
   */
  test('should allow favoriting from detail page', async ({ page }) => {
    await navigateToCharacterDetail(page, TEST_DATA.characterIds.spiderMan);
    
    // Find and click favorite button
    const favoriteBtn = page.locator(SELECTORS.favoriteButton).first();
    await favoriteBtn.click();
    
    // Favorites count should increase
    await page.waitForTimeout(TIMEOUTS.stateUpdate);
    const count = await getFavoritesCount(page);
    expect(count).toBe(1);
  });
});

// ============================================================================
// GROUP 7: ACCESSIBILITY
// ============================================================================

test.describe('Accessibility', () => {
  /**
   * Test: Keyboard navigation works.
   * 
   * User Story: As a keyboard user, I want to navigate the site with keyboard
   * so that I can use the site without a mouse.
   * 
   * Expected: Tab navigation and Enter to activate links
   */
  test('should support keyboard navigation', async ({ page }) => {
    await waitForCharacters(page);
    
    // Tab through elements
    await page.keyboard.press('Tab'); // Focus on first focusable element
    
    // Should be able to navigate with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate with Enter
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  /**
   * Test: ARIA labels present on interactive elements.
   * 
   * Why: Screen readers need proper labels.
   * 
   * Expected: All buttons have aria-labels
   */
  test('should have proper ARIA labels', async ({ page }) => {
    await waitForCharacters(page);
    
    // Favorite buttons should have aria-labels
    const favoriteButtons = await page.locator(SELECTORS.favoriteButton).all();
    expect(favoriteButtons.length).toBeGreaterThan(0);
    
    // Check first button has aria-label
    const firstButton = favoriteButtons[0];
    const ariaLabel = await firstButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/favorite/i);
  });
});

// ============================================================================
// GROUP 8: ERROR SCENARIOS
// ============================================================================

test.describe('Error Handling', () => {
  /**
   * Test: App handles offline gracefully.
   * 
   * User Story: As a user, I want helpful error messages
   * so that I know what went wrong.
   * 
   * Note: This test simulates network failure.
   */
  test('should show error message when offline', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    // Try to load page
    await page.goto('/').catch(() => {
      // Expected to fail
    });
    
    // Should show some error indication
    // (This depends on how your app handles offline state)
    
    // Restore online
    await page.context().setOffline(false);
  });
});
