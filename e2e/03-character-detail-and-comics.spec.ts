import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  navigateToCharacterDetail,
  toggleFavorite,
  navigateToHome,
  navigateToFavorites,
  getFirstCharacterCard,
} from "./helpers";

/**
 * E2E Test 3: Character Detail and Comics
 *
 * Tests character detail page:
 * - Display character information
 * - Show character comics (first 20)
 * - Favorite button on detail page
 * - Navigation back to list
 */
test.describe("Character Detail and Comics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppLoad(page);
    await waitForCharacters(page);
  });

  test("should display character details on detail page", async ({ page }) => {
    // Navigate to detail page
    const characterName = await navigateToCharacterDetail(page);

    // Wait for detail page to fully load
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.waitForTimeout(2000); // Additional wait for React to render

    // Verify character name is displayed (could be in h1, h2, or heading)
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Verify favorite button is present (has aria-pressed attribute or is a button)
    const favoriteButton = page
      .locator("button[aria-pressed]")
      .or(
        page.locator("button").filter({
          has: page.locator("svg"),
        }),
      )
      .first();
    await expect(favoriteButton).toBeVisible({ timeout: 10000 });
  });

  test("should display character comics", async ({ page }) => {
    // Navigate to character detail page
    await navigateToCharacterDetail(page);

    // Wait for page to fully load including comics
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Wait a bit more for comics to load (they load separately)
    await page.waitForTimeout(2000);

    // Check for comics section
    // Comics section might have a heading, or be in a scrollable container
    const comicsHeading = page.getByText(/comics/i, { exact: false }).first();
    const comicsContainer = page
      .locator('[class*="comic"], [class*="Comic"]')
      .first();
    const noComicsMessage = page.getByText(/no comics|no issues|no results/i, {
      exact: false,
    });

    // Either comics heading/container exists or "no comics" message
    const hasComicsSection =
      (await comicsHeading.isVisible().catch(() => false)) ||
      (await comicsContainer.isVisible().catch(() => false));
    const hasNoComicsMessage = await noComicsMessage
      .isVisible()
      .catch(() => false);

    expect(hasComicsSection || hasNoComicsMessage).toBeTruthy();
  });

  test("should toggle favorite from detail page", async ({ page }) => {
    // Navigate to character detail
    await navigateToCharacterDetail(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    // Find favorite button (could be in CharacterHero component)
    const favoriteButton = page.locator("button[aria-pressed]").first();
    await expect(favoriteButton).toBeVisible({ timeout: 5000 });

    // Get initial state
    const initialState =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";

    // Click favorite button
    await favoriteButton.click();
    await page.waitForTimeout(500); // Wait for state update

    // Verify state changed
    const newState =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    expect(newState).not.toBe(initialState);
  });

  test("should navigate back to list from detail page", async ({ page }) => {
    // Navigate to detail page
    await navigateToCharacterDetail(page);

    // Navigate back to home
    await navigateToHome(page);

    // Verify we're on the list page with characters
    await waitForCharacters(page);
    await expect(getFirstCharacterCard(page)).toBeVisible();
  });

  test("should navigate to favorites from detail page", async ({ page }) => {
    // Navigate to detail page
    await navigateToCharacterDetail(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    // Navigate to favorites page
    await navigateToFavorites(page);

    // Verify we're on favorites page (check for heading) - use first() to avoid strict mode violation
    await expect(
      page.getByRole("heading", { name: /FAVORITES/i }).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
