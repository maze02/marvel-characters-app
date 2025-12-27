import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  getFirstCharacterCard,
  navigateToFavorites,
  getSearchInput,
} from "./helpers";

/**
 * USER JOURNEY: Managing and Searching Favorites
 *
 * BUSINESS VALUE: Users build personal collections and need to quickly find
 * specific characters within their favorites. This is especially important for
 * power users who favorite many characters.
 *
 * WHAT THIS TESTS:
 * 1. Users can search within their favorites list
 * 2. Search results show "X OF Y RESULTS" format
 * 3. Users can clear search to see all favorites again
 * 4. Search shows appropriate empty state when no matches found
 * 5. Favorites count badge displays correct number
 *
 * FAILURE IMPACT: If these tests fail, users cannot efficiently navigate their
 * favorites collection. This is a HIGH priority for engaged users.
 *
 * TECHNICAL DETAILS:
 * - Search filters favorites locally (no API call)
 * - Debounced search (400ms)
 * - Results count format: "X OF Y RESULTS" when searching, "Y RESULTS" otherwise
 */
test.describe("Favorites Page Search and Management", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure test independence
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppLoad(page);
  });

  test("should search within favorites list", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can type in the search box on the favorites page
     * to filter their saved favorites by character name.
     *
     * WHY IT MATTERS: Users who save many favorites need to quickly find
     * specific characters without scrolling through the entire list.
     */
    await waitForCharacters(page);

    // Add two different characters to favorites
    const cards = page.locator('[data-testid="character-card"]');

    // Get first character name and favorite it
    const firstCard = cards.nth(0);
    const firstName = await firstCard
      .locator('[data-testid="character-name"]')
      .textContent();
    const firstFavoriteButton = firstCard.locator(
      '[data-testid="favorite-button"]',
    );
    await firstFavoriteButton.click();
    await expect(firstFavoriteButton).toHaveAttribute("aria-pressed", "true", {
      timeout: 3000,
    });

    // Get second character name and favorite it
    const secondCard = cards.nth(1);
    const secondName = await secondCard
      .locator('[data-testid="character-name"]')
      .textContent();
    const secondFavoriteButton = secondCard.locator(
      '[data-testid="favorite-button"]',
    );
    await secondFavoriteButton.click();
    await expect(secondFavoriteButton).toHaveAttribute("aria-pressed", "true", {
      timeout: 3000,
    });

    // Navigate to favorites page
    await navigateToFavorites(page);
    await waitForCharacters(page);

    // Verify both characters are displayed
    await expect(
      page.getByText(firstName || "", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText(secondName || "", { exact: false }),
    ).toBeVisible();

    // Search for first character only
    const searchInput = getSearchInput(page);
    await searchInput.fill(firstName || "");

    // Wait for debounce and results to update using condition-based waiting
    // Should show filtered results: "1 OF 2 RESULTS"
    await expect(page.getByText(/1 OF 2 RESULTS/i)).toBeVisible({
      timeout: 5000,
    });

    // First character should be visible
    await expect(
      page.getByText(firstName || "", { exact: false }),
    ).toBeVisible();
  });

  test("should clear search and show all favorites", async ({ page }) => {
    /**
     * WHAT THIS TESTS: After searching favorites, users can clear the search
     * box to return to viewing all their saved characters.
     *
     * WHY IT MATTERS: Users might search, not find what they want, and need
     * to return to browsing all favorites without reloading the page.
     */
    await waitForCharacters(page);

    // Add multiple favorites
    const cards = page.locator('[data-testid="character-card"]');
    await cards.nth(0).locator('[data-testid="favorite-button"]').click();
    await cards.nth(1).locator('[data-testid="favorite-button"]').click();
    await cards.nth(2).locator('[data-testid="favorite-button"]').click();

    // Navigate to favorites
    await navigateToFavorites(page);
    await waitForCharacters(page);

    // Verify initial state: "3 RESULTS"
    await expect(page.getByText(/3 RESULTS/i)).toBeVisible();

    // Search to filter
    const searchInput = getSearchInput(page);
    const firstName = await cards
      .nth(0)
      .locator('[data-testid="character-name"]')
      .textContent();
    await searchInput.fill(firstName || "");

    // Wait for debounce using condition-based waiting
    // Should show filtered: "1 OF 3 RESULTS"
    await expect(page.getByText(/1 OF 3 RESULTS/i)).toBeVisible({
      timeout: 5000,
    });

    // Clear search
    await searchInput.clear();

    // Wait for debounce using condition-based waiting
    // Should show all again: "3 RESULTS"
    await expect(page.getByText(/^3 RESULTS$/i)).toBeVisible({ timeout: 5000 });
  });

  test("should show empty state when search yields no results", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: When users search for a character name that doesn't
     * match any of their favorites, they see a helpful "No Characters Found"
     * message instead of a blank screen.
     *
     * WHY IT MATTERS: Empty results without explanation look like a bug.
     * Users need clear feedback that their search didn't match anything.
     */
    await waitForCharacters(page);

    // Add one favorite
    const card = getFirstCharacterCard(page);
    const favoriteButton = card.locator('[data-testid="favorite-button"]');
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute("aria-pressed", "true", {
      timeout: 3000,
    });

    // Navigate to favorites
    await navigateToFavorites(page);
    await waitForCharacters(page);

    // Search for something that doesn't exist
    const searchInput = getSearchInput(page);
    await searchInput.fill("ZZZNoMatchXXX123");

    // Wait for debounce (400ms) plus buffer
    await page.waitForTimeout(600);

    // Should show empty state
    await expect(page.getByText("No Characters Found")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText(/Try searching for different character names/i),
    ).toBeVisible();
  });

  test("should display favorites count badge in navbar", async ({ page }) => {
    /**
     * WHAT THIS TESTS: The heart icon in the navbar shows a badge with the
     * number of favorited characters. This updates immediately when adding
     * or removing favorites.
     *
     * WHY IT MATTERS: Users need quick visual feedback showing how many
     * favorites they have. This encourages engagement with the feature.
     */
    await waitForCharacters(page);

    // Initially no badge (0 favorites)
    const badge = page.locator('[data-testid="favorites-count"]');
    const initiallyVisible = await badge.isVisible().catch(() => false);
    expect(initiallyVisible).toBeFalsy();

    // Add first favorite
    const cards = page.locator('[data-testid="character-card"]');
    await cards.nth(0).locator('[data-testid="favorite-button"]').click();

    // Badge should appear with "1"
    await expect(badge).toBeVisible({ timeout: 3000 });
    await expect(badge).toHaveText("1");

    // Add second favorite
    await cards.nth(1).locator('[data-testid="favorite-button"]').click();

    // Badge should update to "2"
    await expect(badge).toHaveText("2", { timeout: 3000 });

    // Remove one favorite
    await cards.nth(0).locator('[data-testid="favorite-button"]').click();

    // Badge should update to "1"
    await expect(badge).toHaveText("1", { timeout: 3000 });
  });

  test("should show correct results count format", async ({ page }) => {
    /**
     * WHAT THIS TESTS: The results count text changes format based on context:
     * - "X RESULTS" when not searching
     * - "X OF Y RESULTS" when searching
     *
     * WHY IT MATTERS: This provides clear context about whether users are
     * viewing all favorites or a filtered subset.
     */
    await waitForCharacters(page);

    // Add 3 favorites
    const cards = page.locator('[data-testid="character-card"]');
    await cards.nth(0).locator('[data-testid="favorite-button"]').click();
    await cards.nth(1).locator('[data-testid="favorite-button"]').click();
    await cards.nth(2).locator('[data-testid="favorite-button"]').click();

    // Navigate to favorites
    await navigateToFavorites(page);
    await waitForCharacters(page);

    // Initial format: "3 RESULTS" (no "OF")
    await expect(page.getByText(/^3 RESULTS$/i)).toBeVisible();

    // Start searching
    const searchInput = getSearchInput(page);
    const firstName = await cards
      .nth(0)
      .locator('[data-testid="character-name"]')
      .textContent();
    await searchInput.fill(firstName || "");

    // Wait for debounce using condition-based waiting
    // Search format: "1 OF 3 RESULTS"
    await expect(page.getByText(/1 OF 3 RESULTS/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
