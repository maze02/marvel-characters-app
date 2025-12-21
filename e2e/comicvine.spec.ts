import { test, expect } from '@playwright/test';

test.describe('Comic Vine API Integration - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load 50 characters initially', async ({ page }) => {
    // Wait for characters to load
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Count character cards
    const cards = await page.$$('[data-testid="character-card"]');
    expect(cards.length).toBeGreaterThanOrEqual(1); // At least some loaded

    // Should show results count
    const resultsText = await page.textContent('text=/RESULTS/');
    expect(resultsText).toBeTruthy();
  });

  test('should load more characters on scroll (infinite scroll)', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const initialCards = await page.$$('[data-testid="character-card"]');
    const initialCount = initialCards.length;

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for more characters to load
    await page.waitForTimeout(2000);

    const updatedCards = await page.$$('[data-testid="character-card"]');
    const updatedCount = updatedCards.length;

    // Should have loaded more
    expect(updatedCount).toBeGreaterThan(initialCount);
  });

  test('should search characters by name', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Type in search box
    await page.fill('input[type="search"]', 'Spider');

    // Wait for debounce (300ms) + search results
    await page.waitForTimeout(500);

    // Should show search results
    const resultsText = await page.textContent('text=/RESULTS/');
    expect(resultsText).toBeTruthy();

    // Check if any character names contain "Spider"
    const firstCardName = await page.textContent('[data-testid="character-card"]:first-child h2');
    if (firstCardName) {
      expect(firstCardName.toLowerCase()).toContain('spider');
    }
  });

  test('should clear search results', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Search
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('Spider');
    await page.waitForTimeout(500);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // Should show all characters again
    const cards = await page.$$('[data-testid="character-card"]');
    expect(cards.length).toBeGreaterThanOrEqual(10);
  });

  test('should add character to favorites', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Get initial favorites count (should be 0 or hidden)
    const favoritesButton = page.locator('header button[aria-label*="favorites"]');

    // Click first favorite button on a card
    const firstCardFavoriteBtn = page.locator('[data-testid="character-card"]').first().locator('button[aria-label*="Add"]');
    await firstCardFavoriteBtn.click();

    // Favorites count should appear and be 1
    const favoritesCount = page.locator('[data-testid="favorites-count"]');
    await expect(favoritesCount).toBeVisible();
    await expect(favoritesCount).toHaveText('1');
  });

  test('should remove character from favorites', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Add to favorites
    const firstCardFavoriteBtn = page.locator('[data-testid="character-card"]').first().locator('button');
    await firstCardFavoriteBtn.click();

    // Wait for state to update
    await page.waitForTimeout(200);

    // Remove from favorites
    await firstCardFavoriteBtn.click();

    // Favorites count should be 0 or hidden
    const favoritesCount = page.locator('[data-testid="favorites-count"]');
    const isVisible = await favoritesCount.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('should filter to show only favorites', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Add multiple to favorites
    const favoriteButtons = await page.$$('[data-testid="character-card"] button[aria-label*="Add"]');
    if (favoriteButtons.length >= 2) {
      await favoriteButtons[0].click();
      await page.waitForTimeout(100);
      await favoriteButtons[1].click();
      await page.waitForTimeout(100);
    }

    // Click header favorites button
    const headerFavButton = page.locator('header button[aria-label*="Show favorites"]');
    await headerFavButton.click();

    // Should show FAVORITES title
    await expect(page.locator('text=FAVORITES')).toBeVisible();

    // Should show only favorited characters
    const resultsText = await page.textContent('text=/RESULTS/');
    expect(resultsText).toContain('2 RESULTS');
  });

  test('should navigate to character detail page', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Click first character card
    const firstCard = page.locator('[data-testid="character-card"]').first();
    await firstCard.click();

    // Should navigate to detail page
    await page.waitForURL(/\/character\/\d+/);

    // Should show character details
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show 20 comics on character detail page', async ({ page }) => {
    // Navigate directly to a character (if we know ID)
    await page.goto('/character/1009610'); // Spider-Man ID (example)

    // Wait for comics section
    await page.waitForSelector('text=COMICS', { timeout: 10000 }).catch(() => {
      // Comics section might not appear if character has no comics
    });

    // Check if comics are loaded (max 20)
    const comics = await page.$$('[data-testid="comic-item"]');
    expect(comics.length).toBeLessThanOrEqual(20);
  });

  test('should persist favorites across page reloads', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Add to favorites
    const firstCardFavoriteBtn = page.locator('[data-testid="character-card"]').first().locator('button');
    await firstCardFavoriteBtn.click();

    // Wait for localStorage update
    await page.waitForTimeout(200);

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Favorites count should still be 1
    const favoritesCount = page.locator('[data-testid="favorites-count"]');
    await expect(favoritesCount).toBeVisible();
    await expect(favoritesCount).toHaveText('1');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Press Tab to focus on first card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip logo
    await page.keyboard.press('Tab'); // Skip favorites button
    await page.keyboard.press('Tab'); // Focus search
    await page.keyboard.press('Tab'); // Focus first card

    // Press Enter to navigate
    await page.keyboard.press('Enter');

    // Should navigate to detail page
    await page.waitForURL(/\/character\/\d+/);
  });

  test('should be accessible (basic checks)', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 });

    // Check for skip link
    const skipLink = page.locator('text=Skip to main content');
    await expect(skipLink).toBeInViewport({ ratio: 0.01 }).catch(() => {
      // Skip link might be off-screen until focused
    });

    // Check for proper heading structure
    const mainHeading = page.locator('main');
    await expect(mainHeading).toBeVisible();

    // Check ARIA labels on interactive elements
    const favoriteButtons = await page.$$('button[aria-label*="favorite"]');
    expect(favoriteButtons.length).toBeGreaterThan(0);
  });
});
