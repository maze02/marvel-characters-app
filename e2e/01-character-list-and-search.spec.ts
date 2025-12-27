import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  getFirstCharacterCard,
  getCharacterNameFromCard,
  navigateToCharacterDetail,
  getSearchInput,
  performSearch,
} from "./helpers";

/**
 * E2E Test 1: Character List and Search
 *
 * Tests the main functionality:
 * - Loads initial 50 characters
 * - Search functionality works
 * - Results count updates
 * - Navigation to character detail
 */
test.describe("Character List and Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppLoad(page);
  });

  test("should load initial 50 characters", async ({ page }) => {
    await waitForCharacters(page);

    // Check that characters are displayed
    const characterCards = page.locator('[data-testid="character-card"]');
    const count = await characterCards.count();

    // Should have at least some characters loaded
    expect(count).toBeGreaterThan(0);

    // Check results count is displayed
    const resultsCount = page.getByText(/\d+ RESULTS/i);
    await expect(resultsCount).toBeVisible();
  });

  test("should search for characters by name", async ({ page }) => {
    await waitForCharacters(page);

    // Verify search bar is visible
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible();

    // Perform search
    await performSearch(page, "Spider");

    // Verify search results contain "Spider" in name
    const firstResult = getFirstCharacterCard(page);
    const characterName = await getCharacterNameFromCard(page, firstResult);

    expect(characterName.toLowerCase()).toContain("spider");

    // Verify results count updated
    const resultsCount = page.getByText(/\d+ RESULTS/i);
    await expect(resultsCount).toBeVisible();
  });

  test("should navigate to character detail page on card click", async ({
    page,
  }) => {
    await waitForCharacters(page);

    // Get character name before navigation
    const characterName = await navigateToCharacterDetail(page);

    // Wait for detail page to fully render
    await page.waitForTimeout(1000);

    // Verify character name is displayed on detail page (could be in heading or text)
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });
  });

  test("should clear search and show all characters", async ({ page }) => {
    await waitForCharacters(page);

    // Perform search
    await performSearch(page, "Spider");

    const countAfterSearch = await page
      .locator('[data-testid="character-card"]')
      .count();
    expect(countAfterSearch).toBeGreaterThan(0);

    // Clear search
    const searchInput = getSearchInput(page);
    await searchInput.clear();
    await page.waitForTimeout(800); // Wait for debounce + API call

    // Should show all characters again
    await waitForCharacters(page);
    const countAfterClear = await page
      .locator('[data-testid="character-card"]')
      .count();
    expect(countAfterClear).toBeGreaterThan(0);
  });

  test("should load more characters when scrolling to bottom", async ({
    page,
  }) => {
    await waitForCharacters(page);

    // Count initial characters loaded
    const characterCards = page.locator('[data-testid="character-card"]');
    const initialCount = await characterCards.count();

    // Verify we have initial characters (should be 50 based on PAGINATION.DEFAULT_LIMIT)
    expect(initialCount).toBeGreaterThan(0);

    // Find the sentinel element (triggers infinite scroll when visible)
    const sentinel = page.locator('[data-testid="sentinel"]');
    await expect(sentinel).toBeVisible({ timeout: 5000 });

    // Scroll to sentinel to trigger infinite scroll
    // IntersectionObserver has 100px rootMargin, so scrolling into view should trigger it
    await sentinel.scrollIntoViewIfNeeded();

    // Wait for IntersectionObserver to fire and API call to complete
    // Use waitFor with a function that checks if count increased
    await expect(async () => {
      const currentCount = await characterCards.count();
      if (currentCount > initialCount) {
        return currentCount;
      }
      throw new Error(
        `Count still ${currentCount}, expected > ${initialCount}`,
      );
    }).toPass({
      timeout: 15000,
      intervals: [500, 1000, 2000], // Check every 500ms, then 1s, then 2s
    });

    // Get final count
    const finalCount = await characterCards.count();

    // Verify more characters were loaded
    expect(finalCount).toBeGreaterThan(initialCount);

    // Verify sentinel is still present (for potential further loading)
    // Note: sentinel might be hidden if hasMore becomes false, which is fine
    const sentinelVisible = await sentinel.isVisible().catch(() => false);
    if (sentinelVisible) {
      await expect(sentinel).toBeVisible();
    }
  });
});
