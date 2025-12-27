import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  getFirstCharacterCard,
  navigateToCharacterDetail,
} from "./helpers";

/**
 * USER JOURNEY: Bookmarking and URL Sharing
 *
 * BUSINESS VALUE: Users should be able to bookmark pages, share URLs, and
 * navigate directly to any page in the app. This enables discovery through
 * search engines and social sharing.
 *
 * WHAT THIS TESTS:
 * 1. Users can navigate directly to /favorites via URL
 * 2. Users can navigate directly to /character/:id via URL
 * 3. Invalid character IDs show appropriate error page
 * 4. Page refreshes maintain state and data
 * 5. URLs can be shared and work for other users
 *
 * FAILURE IMPACT: If these tests fail, users cannot bookmark pages or share
 * links. This is a HIGH priority for SEO and user engagement.
 *
 * TECHNICAL DETAILS:
 * - Tests React Router's client-side routing
 * - Validates deep linking works correctly
 * - Ensures error boundaries handle invalid routes
 */
test.describe("Direct URL Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage for test independence
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppLoad(page);
  });

  test("should load favorites page via direct URL", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can type "/favorites" directly in the browser
     * or click a bookmarked favorites URL. The page loads correctly without
     * first visiting the home page.
     *
     * WHY IT MATTERS: Bookmarking and direct access are expected behaviors.
     * Users shouldn't be forced to always start at home page.
     */
    // Add favorites first so page has content
    await waitForCharacters(page);
    const card = getFirstCharacterCard(page);
    const characterName = await card
      .locator('[data-testid="character-name"]')
      .textContent();
    const favoriteButton = card.locator('[data-testid="favorite-button"]');
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute("aria-pressed", "true", {
      timeout: 3000,
    });

    // Navigate directly to favorites via URL (simulates bookmark or typed URL)
    await page.goto("/favorites");
    await waitForAppLoad(page);

    // Should display favorites page heading
    await expect(
      page.getByRole("heading", { name: /FAVORITES/i }).first(),
    ).toBeVisible();

    // Should display the favorited character
    await expect(
      page.getByText(characterName || "", { exact: false }),
    ).toBeVisible();

    // URL should be correct
    expect(page.url()).toContain("/favorites");
  });

  test("should load character detail page via direct URL", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can navigate directly to a character's detail
     * page using a URL like /character/1009610. This enables sharing specific
     * character pages via links.
     *
     * WHY IT MATTERS: Users want to share interesting characters with friends
     * or bookmark specific character pages. Direct URLs make this possible.
     */
    await waitForCharacters(page);

    // Get a character ID from the first card
    const card = getFirstCharacterCard(page);
    const cardLink = card.locator('[data-testid="character-card-link"]');
    const href = await cardLink.getAttribute("href");
    const characterName = await card
      .locator('[data-testid="character-name"]')
      .textContent();

    // Extract character ID from href (e.g., "/character/1009610")
    const characterId = href?.split("/character/")[1];
    expect(characterId).toBeTruthy();

    // Navigate directly to character detail page via URL
    await page.goto(`/character/${characterId}`);
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Should display character name
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName || "", "i") })
      .or(page.getByText(characterName || "", { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Should display favorite button
    const favoriteButton = page
      .locator('[data-testid="favorite-button"]')
      .first();
    await expect(favoriteButton).toBeVisible();

    // URL should be correct
    expect(page.url()).toContain(`/character/${characterId}`);
  });

  test("should show error page for invalid character ID", async ({ page }) => {
    /**
     * WHAT THIS TESTS: When users navigate to a character ID that doesn't
     * exist (invalid URL, broken link, deleted character), they see a
     * clear error page with a way to return home.
     *
     * WHY IT MATTERS: Broken links shouldn't leave users stranded. Clear
     * error messages and navigation options maintain a good user experience.
     */
    // Navigate to invalid character ID
    await page.goto("/character/999999999");

    // Wait for error state to load
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Should show error heading
    await expect(
      page.getByRole("heading", { name: /Character Not Found/i }),
    ).toBeVisible({ timeout: 10000 });

    // Should show helpful error message
    await expect(
      page.getByText(/Unable to load character details/i),
    ).toBeVisible();

    // Should provide "Return to Home" link
    const homeLink = page.getByRole("link", { name: /Return to Home/i });
    await expect(homeLink).toBeVisible();

    // Click "Return to Home" should work
    await homeLink.click();
    await waitForCharacters(page);
    await expect(getFirstCharacterCard(page)).toBeVisible();
  });

  test("should maintain state after page refresh on character detail", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: When users refresh the page while viewing a character
     * detail page, the data reloads correctly and they don't lose their place.
     *
     * WHY IT MATTERS: Users expect refresh to work. They might refresh to
     * see updated data or accidentally hit F5. The page should reload properly.
     */
    await waitForCharacters(page);

    // Navigate to character detail
    const characterName = await navigateToCharacterDetail(page);
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Verify character is displayed
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Get current URL
    const currentUrl = page.url();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Should still display the same character
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // URL should remain the same
    expect(page.url()).toBe(currentUrl);
  });

  test("should navigate to home page via direct URL", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can always navigate to "/" (home page) directly.
     * This is the most basic navigation and should always work.
     *
     * WHY IT MATTERS: The home page is the entry point. It must load via
     * direct URL for SEO, bookmarks, and general navigation.
     */
    // Navigate to home via URL
    await page.goto("/");
    await waitForAppLoad(page);
    await waitForCharacters(page);

    // Should display character cards
    await expect(getFirstCharacterCard(page)).toBeVisible();

    // Should display search bar
    const searchInput = page.getByRole("searchbox");
    await expect(searchInput).toBeVisible();

    // URL should be exactly "/"
    const url = new URL(page.url());
    expect(url.pathname).toBe("/");
  });

  test("should handle favorites with no data via direct URL", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: Users who bookmark /favorites but have no favorites
     * saved should see the appropriate empty state (not an error or blank page).
     *
     * WHY IT MATTERS: First-time users might bookmark the favorites page
     * before adding favorites. This should work gracefully.
     */
    // Navigate directly to favorites with no favorites saved
    await page.goto("/favorites");
    await waitForAppLoad(page);

    // Should show empty state (not error)
    await expect(
      page.getByRole("heading", { name: /No Favorites Yet/i }),
    ).toBeVisible();
    await expect(page.getByText(/Start favoriting characters/i)).toBeVisible();

    // Should NOT show error message
    const errorHeading = page.getByRole("heading", { name: /error|failed/i });
    const hasError = await errorHeading.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test("should preserve favorites across navigation and direct URL access", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: Favorites persisted in localStorage work correctly
     * with direct URL navigation. Users can favorite characters, navigate
     * via URL, and still see their favorites.
     *
     * WHY IT MATTERS: localStorage should persist across all navigation
     * types, including direct URLs. This ensures data consistency.
     */
    await waitForCharacters(page);

    // Add a favorite
    const card = getFirstCharacterCard(page);
    const characterName = await card
      .locator('[data-testid="character-name"]')
      .textContent();
    const favoriteButton = card.locator('[data-testid="favorite-button"]');
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute("aria-pressed", "true", {
      timeout: 3000,
    });

    // Navigate away using direct URL
    await page.goto("/");
    await waitForAppLoad(page);
    await waitForCharacters(page);

    // Navigate to favorites using direct URL
    await page.goto("/favorites");
    await waitForAppLoad(page);

    // Favorite should still be there
    await expect(
      page.getByText(characterName || "", { exact: false }),
    ).toBeVisible();
    await expect(page.getByText(/1 RESULTS/i)).toBeVisible();
  });
});
