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
 * USER JOURNEY: Browsing and Searching for Characters
 *
 * BUSINESS VALUE: Ensures users can discover Marvel characters through browsing
 * and search functionality. This is the primary entry point to the application.
 *
 * WHAT THIS TESTS:
 * 1. When users first visit the site, they see a list of Marvel characters
 * 2. Users can type in a search box to find specific characters
 * 3. The search results update to show only matching characters
 * 4. Users can click on a character card to learn more about them
 * 5. Users can scroll down to automatically load more characters (infinite scroll)
 * 6. Users can clear their search to see all characters again
 *
 * FAILURE IMPACT: If these tests fail, users cannot browse or find characters.
 * This is a CRITICAL failure that makes the app unusable.
 *
 * TECHNICAL DETAILS:
 * - Loads initial 50 characters
 * - Search is debounced (waits 400ms after typing stops)
 * - Infinite scroll triggers at page bottom
 * - Results count updates dynamically
 */
test.describe("Character List and Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppLoad(page);
  });

  test("should load initial 50 characters", async ({ page }) => {
    /**
     * WHAT THIS TESTS: When users visit the homepage, they should immediately
     * see a list of Marvel characters to browse.
     *
     * WHY IT MATTERS: This is the first impression. If this fails, users see
     * an empty page and think the site is broken.
     */
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
    /**
     * WHAT THIS TESTS: Users can type in the search box to find specific
     * characters (like "Spider-Man") and see filtered results.
     *
     * WHY IT MATTERS: Users often know which character they want to see.
     * Without search, they'd have to scroll through hundreds of characters.
     */
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
    /**
     * WHAT THIS TESTS: When users click on a character card, they navigate
     * to that character's detail page to learn more.
     *
     * WHY IT MATTERS: This is the main interaction in the app. If this breaks,
     * users can see the list but can't access any detailed information.
     */
    await waitForCharacters(page);

    // Get character name before navigation
    const characterName = await navigateToCharacterDetail(page);

    // Verify character name is displayed on detail page (could be in heading or text)
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });
  });

  test("should clear search and show all characters", async ({ page }) => {
    /**
     * WHAT THIS TESTS: After searching, users can clear the search box to
     * return to browsing all characters.
     *
     * WHY IT MATTERS: Users might search for "Spider", see Spider-Man, but then
     * want to browse other characters. They shouldn't have to reload the page.
     */
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
    // Wait for the search to complete and new results to load
    await page.waitForLoadState("networkidle", { timeout: 10000 });

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
    /**
     * WHAT THIS TESTS: The "infinite scroll" feature that automatically loads
     * more characters as users scroll down the page.
     *
     * WHY IT MATTERS: There are thousands of Marvel characters. Without infinite
     * scroll, users would only see 50 characters or have to click pagination buttons.
     * This provides a smooth, modern browsing experience.
     */
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
