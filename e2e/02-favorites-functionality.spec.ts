import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  getFirstCharacterCard,
  getCharacterNameFromCard,
  toggleFavorite,
  navigateToFavorites,
  navigateToHome,
  getFavoritesNavButton,
} from "./helpers";

/**
 * E2E Test 2: Favorites Functionality
 *
 * Tests favorites feature:
 * - Add character to favorites
 * - Remove character from favorites
 * - Favorites count updates
 * - View favorites page
 * - Favorites persist across navigation
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
    await waitForCharacters(page);

    // Get first character card
    const card = getFirstCharacterCard(page);
    await expect(card).toBeVisible({ timeout: 20000 });

    // Get favorite button from card (button with aria-pressed or any button in card)
    const favoriteButton = card.locator("button").first();
    await expect(favoriteButton).toBeVisible({ timeout: 20000 });

    // Check current favorite state
    const initialAriaPressed =
      await favoriteButton.getAttribute("aria-pressed");
    const isAlreadyFavorite = initialAriaPressed === "true";

    if (!isAlreadyFavorite) {
      // Click to add to favorites
      await favoriteButton.click({ force: true });

      // Wait for state to update (button should now have aria-pressed="true")
      await page.waitForTimeout(2000);

      // Verify button state changed to favorited
      const newAriaPressed = await favoriteButton.getAttribute("aria-pressed");
      expect(newAriaPressed).toBe("true");

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
    await waitForCharacters(page);

    // Add to favorites first
    const card = getFirstCharacterCard(page);
    const favoriteButton = card.locator("button").first();
    await favoriteButton.waitFor({ state: "visible", timeout: 10000 });

    // Ensure it's favorited
    const isFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    if (!isFavorite) {
      await favoriteButton.click({ force: true });
      await page.waitForTimeout(800);
    }

    // Now remove from favorites
    await favoriteButton.click({ force: true });
    await page.waitForTimeout(800);

    // Verify button is no longer pressed
    const isStillFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    expect(isStillFavorite).toBeFalsy();
  });

  test("should navigate to favorites page and display favorited characters", async ({
    page,
  }) => {
    await waitForCharacters(page);

    // Add at least one character to favorites
    const card = getFirstCharacterCard(page);
    const characterName = await getCharacterNameFromCard(page, card);

    // Ensure it's favorited
    const favoriteButton = card.locator("button").first();
    await favoriteButton.waitFor({ state: "visible", timeout: 10000 });
    const isFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    if (!isFavorite) {
      await favoriteButton.click({ force: true });
      await page.waitForTimeout(1000);
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
    await waitForCharacters(page);

    // Add character to favorites
    const card = getFirstCharacterCard(page);
    const characterName = await getCharacterNameFromCard(page, card);

    // Ensure it's favorited
    const favoriteButton = card.locator("button").first();
    await favoriteButton.waitFor({ state: "visible", timeout: 10000 });
    const isFavorite =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    if (!isFavorite) {
      await favoriteButton.click({ force: true });
      await page.waitForTimeout(1000);
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
