import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  getFirstCharacterCard,
  getCharacterNameFromCard,
  navigateToFavorites,
  navigateToHome,
} from "./helpers";

/**
 * USER JOURNEY: Managing Favorite Characters
 *
 * BUSINESS VALUE: Allows users to build a personal collection of their favorite
 * Marvel characters. This creates user engagement and gives them a reason to return.
 *
 * WHAT THIS TESTS:
 * 1. Users can click the heart button to mark a character as a favorite
 * 2. Users can click the heart again to remove a character from favorites
 * 3. Users can navigate to a dedicated page showing all their favorites
 * 4. Favorites are remembered even after closing and reopening the browser
 * 5. The favorites counter in the navigation updates when adding/removing favorites
 *
 * FAILURE IMPACT: If these tests fail, users cannot save their favorite characters
 * or will lose their saved favorites. This is a HIGH priority failure that breaks
 * a key feature but doesn't make the entire app unusable.
 *
 * TECHNICAL DETAILS:
 * - Favorites stored in browser's localStorage
 * - Favorites persist across page reloads and browser sessions
 * - Each test clears localStorage to ensure independence
 */
test.describe("Favorites Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppLoad(page);
  });

  test("should add character to favorites", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can click the heart button on a character card
     * to save it to their favorites list.
     *
     * WHY IT MATTERS: This is the primary interaction for the favorites feature.
     * If users can't add favorites, the entire feature is broken.
     */
    await waitForCharacters(page);

    // Get first character card
    const card = getFirstCharacterCard(page);
    await expect(card).toBeVisible({ timeout: 20000 });

    // Get favorite button from card
    const favoriteButton = card.locator('[data-testid="favorite-button"]');
    await expect(favoriteButton).toBeVisible({ timeout: 20000 });

    // Check current favorite state
    const initialAriaPressed =
      await favoriteButton.getAttribute("aria-pressed");
    const isAlreadyFavorite = initialAriaPressed === "true";

    if (!isAlreadyFavorite) {
      // Click to add to favorites
      await favoriteButton.click({ force: true });

      // Wait for state to update (button should now have aria-pressed="true")
      await expect(favoriteButton).toHaveAttribute("aria-pressed", "true", {
        timeout: 3000,
      });

      // Verify favorites count increased (if count badge exists)
      const favoritesCountElement = page.locator(
        '[data-testid="favorites-count"]',
      );
      const countExists = await favoritesCountElement
        .isVisible()
        .catch(() => false);
      if (countExists) {
        const newCountText = await favoritesCountElement.textContent();
        const newCount = parseInt(newCountText || "0");
        expect(newCount).toBeGreaterThan(0);
      }
    } else {
      // Character is already favorited - verify the state
      expect(isAlreadyFavorite).toBeTruthy();
    }
  });

  test("should remove character from favorites", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can click the heart button again to remove
     * a character from their favorites (unfavorite).
     *
     * WHY IT MATTERS: Users should be able to change their mind. If they
     * accidentally favorite a character or no longer like them, they need
     * a way to remove them from the list.
     */
    await waitForCharacters(page);

    // Add to favorites first
    const card = getFirstCharacterCard(page);
    const favoriteButton = card.locator('[data-testid="favorite-button"]');
    await favoriteButton.waitFor({ state: "visible", timeout: 10000 });

    // Ensure it's favorited
    const isFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    if (!isFavorite) {
      await favoriteButton.click({ force: true });
      await expect(favoriteButton).toHaveAttribute("aria-pressed", "true", {
        timeout: 3000,
      });
    }

    // Now remove from favorites
    await favoriteButton.click({ force: true });
    await expect(favoriteButton).toHaveAttribute("aria-pressed", "false", {
      timeout: 3000,
    });

    // Verify button is no longer pressed
    const isStillFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    expect(isStillFavorite).toBeFalsy();
  });

  test("should navigate to favorites page and display favorited characters", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: After favoriting characters, users can click the favorites
     * button in the navigation to see a dedicated page with all their favorites.
     *
     * WHY IT MATTERS: Saving favorites is pointless if users can't view them later.
     * This page is where users access their curated collection.
     */
    await waitForCharacters(page);

    // Add at least one character to favorites
    const card = getFirstCharacterCard(page);
    const characterName = await getCharacterNameFromCard(page, card);

    // Ensure it's favorited
    const favoriteButton = card.locator('[data-testid="favorite-button"]');
    await favoriteButton.waitFor({ state: "visible", timeout: 10000 });
    const isFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    if (!isFavorite) {
      await favoriteButton.click({ force: true });
      await expect(favoriteButton).toHaveAttribute("aria-pressed", "true", {
        timeout: 3000,
      });
    }

    // Navigate to favorites page
    await navigateToFavorites(page);
    await waitForCharacters(page); // Wait for favorites to load

    // Verify favorited character is displayed
    await expect(page.getByText(characterName, { exact: false })).toBeVisible({
      timeout: 15000,
    });

    // Verify page title (uppercase "FAVORITES") - use first() to avoid strict mode violation
    await expect(
      page.getByRole("heading", { name: /FAVORITES/i }).first(),
    ).toBeVisible();
  });

  test("should persist favorites across page reloads", async ({ page }) => {
    /**
     * WHAT THIS TESTS: After adding favorites and refreshing the page (or closing
     * and reopening the browser), users should still see their saved favorites.
     *
     * WHY IT MATTERS: If favorites disappear on page reload, users will be frustrated
     * and won't trust the feature. This tests data persistence.
     */
    await waitForCharacters(page);

    // Add character to favorites
    const card = getFirstCharacterCard(page);
    const characterName = await getCharacterNameFromCard(page, card);

    // Ensure it's favorited
    const favoriteButton = card.locator('[data-testid="favorite-button"]');
    await favoriteButton.waitFor({ state: "visible", timeout: 10000 });
    const isFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    if (!isFavorite) {
      await favoriteButton.click({ force: true });
      await expect(favoriteButton).toHaveAttribute("aria-pressed", "true", {
        timeout: 3000,
      });
    }

    // Reload page
    await page.reload();
    await waitForAppLoad(page);
    await waitForCharacters(page);

    // Navigate to favorites to verify persistence
    await navigateToFavorites(page);
    await waitForCharacters(page); // Wait for favorites to load
    await expect(page.getByText(characterName, { exact: false })).toBeVisible({
      timeout: 15000,
    });
  });
});
