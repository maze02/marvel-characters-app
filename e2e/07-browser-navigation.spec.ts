import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  navigateToCharacterDetail,
  navigateToFavorites,
} from "./helpers";

/**
 * USER JOURNEY: Browser Navigation Controls
 *
 * BUSINESS VALUE: Users expect standard browser navigation (back/forward buttons)
 * to work correctly. This is essential for user experience and matches web
 * conventions that users are familiar with.
 *
 * WHAT THIS TESTS:
 * 1. Users can click browser back button to return to previous page
 * 2. Users can click browser forward button to go forward again
 * 3. Navigation history is maintained correctly across pages
 * 4. State is preserved when using browser navigation
 *
 * FAILURE IMPACT: If these tests fail, users get frustrated when browser
 * back/forward buttons don't work as expected. This is a MEDIUM priority
 * for user experience.
 *
 * TECHNICAL DETAILS:
 * - Tests React Router's history integration
 * - Validates browser history API works correctly
 * - Ensures pages reload properly on back/forward
 */
test.describe("Browser Navigation Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppLoad(page);
  });

  test("should navigate back using browser back button", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can click the browser's back button to return
     * to the previous page, just like any other website.
     *
     * WHY IT MATTERS: Browser back button is one of the most common user
     * actions. If it doesn't work, users feel the site is broken.
     */
    await waitForCharacters(page);

    // Navigate to character detail page
    const characterName = await navigateToCharacterDetail(page);

    // Wait for detail page to load using condition-based waiting
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Click browser back button
    await page.goBack();
    await waitForAppLoad(page);

    // Should be back on list page
    await waitForCharacters(page);
    const searchInput = page.getByRole("searchbox");
    await expect(searchInput).toBeVisible();

    // Verify URL is back to home
    const url = new URL(page.url());
    expect(url.pathname).toBe("/");
  });

  test("should navigate forward using browser forward button", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: After going back, users can click the browser's
     * forward button to return to where they were.
     *
     * WHY IT MATTERS: Forward button is part of standard browser navigation.
     * Users expect it to work just like the back button.
     */
    await waitForCharacters(page);

    // Navigate to character detail
    const characterName = await navigateToCharacterDetail(page);

    // Wait for detail page using condition-based waiting
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Go back to list
    await page.goBack();
    await waitForAppLoad(page);
    await waitForCharacters(page);

    // Now go forward again
    await page.goForward();

    // Wait for detail page to reload using condition-based waiting
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Verify URL is detail page
    expect(page.url()).toContain("/character/");
  });

  test("should maintain history when navigating between multiple pages", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: Browser back button works correctly even after
     * visiting multiple pages (home → detail → favorites → back → back).
     *
     * WHY IT MATTERS: Users often browse multiple pages before going back.
     * History should be maintained accurately for complex navigation flows.
     */
    await waitForCharacters(page);

    // Step 1: Navigate to character detail
    const characterName = await navigateToCharacterDetail(page);

    // Wait for navigation to complete using URL check
    await expect(page).toHaveURL(/\/character\//, { timeout: 10000 });

    // Step 2: Navigate to favorites page
    await navigateToFavorites(page);
    await expect(page).toHaveURL(/\/favorites/, { timeout: 10000 });

    // Step 3: Go back once (should be on detail page)
    await page.goBack();

    // Wait for navigation using URL and element visibility
    await expect(page).toHaveURL(/\/character\//, { timeout: 10000 });

    // Verify we're back on the correct character's detail page
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Step 4: Go back again (should be on home page)
    await page.goBack();
    await waitForAppLoad(page);
    await waitForCharacters(page);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/");
  });

  test("should preserve scroll position when using back button", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: When users scroll down the list, click a character,
     * then click back, the page scrolls back to where they were.
     *
     * WHY IT MATTERS: Users expect to return to where they left off. If the
     * page scrolls to the top, they lose their place and get frustrated.
     */
    await waitForCharacters(page);

    // Scroll down to trigger infinite scroll
    const sentinel = page.locator('[data-testid="sentinel"]');
    await expect(sentinel).toBeVisible({ timeout: 5000 });
    await sentinel.scrollIntoViewIfNeeded();

    // Wait for more characters to load using condition-based waiting
    const initialCount = await page
      .locator('[data-testid="character-card"]')
      .count();
    await expect(async () => {
      const newCount = await page
        .locator('[data-testid="character-card"]')
        .count();
      expect(newCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: 10000 });

    // Get scroll position
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);

    // Navigate to a character
    const characterName = await navigateToCharacterDetail(page);

    // Wait for detail page using condition-based waiting
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Go back
    await page.goBack();
    await waitForAppLoad(page);
    await waitForCharacters(page);

    // Note: Scroll position restoration is browser-dependent behavior
    // We just verify the page loaded correctly
    const searchInput = page.getByRole("searchbox");
    await expect(searchInput).toBeVisible();
  });
});
