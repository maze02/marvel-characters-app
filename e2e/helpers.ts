import { Page, expect } from "@playwright/test";

/**
 * E2E Test Helpers
 *
 * Reusable utility functions following DRY principles and best practices.
 */

/**
 * Wait for the application to be fully loaded
 */
export async function waitForAppLoad(page: Page): Promise<void> {
  // Wait for root element first
  await page.waitForSelector("#root", { timeout: 15000 });

  // Wait for main content area
  await page.waitForSelector("main", { timeout: 15000 });

  // Wait for network to be idle (API calls completed)
  await page.waitForLoadState("networkidle", { timeout: 20000 });
}

/**
 * Wait for characters to be loaded on the list page
 */
export async function waitForCharacters(page: Page): Promise<void> {
  // Wait for at least one character card
  await page.waitForSelector('[data-testid="character-card"]', {
    timeout: 20000,
  });

  // Wait for favorite buttons to be ready (they load with cards)
  await page
    .waitForSelector("button[aria-pressed]", { timeout: 5000 })
    .catch(() => {
      // If no favorite buttons yet, that's okay - they'll appear
    });

  // Additional wait to ensure all initial characters are loaded
  await page.waitForTimeout(1500);
}

/**
 * Get the first character card
 */
export function getFirstCharacterCard(page: Page) {
  return page.locator('[data-testid="character-card"]').first();
}

/**
 * Get character name from a card
 */
export async function getCharacterNameFromCard(
  page: Page,
  card = getFirstCharacterCard(page),
): Promise<string> {
  const name = await card.locator("h2").textContent();
  if (!name) {
    throw new Error("Character name not found in card");
  }
  return name.trim();
}

/**
 * Navigate to character detail page
 */
export async function navigateToCharacterDetail(
  page: Page,
  card = getFirstCharacterCard(page),
): Promise<string> {
  const characterName = await getCharacterNameFromCard(page, card);
  // Click on the card link (not the button)
  const cardLink = card.locator("a").first();
  await cardLink.click();
  await page.waitForURL(/\/character\/\d+/, { timeout: 15000 });
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  return characterName;
}

/**
 * Get search input
 */
export function getSearchInput(page: Page) {
  return page.getByRole("searchbox");
}

/**
 * Perform a search
 */
export async function performSearch(page: Page, query: string): Promise<void> {
  const searchInput = getSearchInput(page);
  await searchInput.fill(query);
  // Wait for debounce (300ms) + API call
  await page.waitForTimeout(800);
  await page.waitForSelector('[data-testid="character-card"]', {
    timeout: 10000,
  });
}

/**
 * Get favorites button in navbar
 */
export function getFavoritesNavButton(page: Page) {
  // Navbar button is in the header, has aria-label with "favorite" or "View favorites"
  return page
    .locator(
      'header button[aria-label*="favorite" i], header button[aria-label*="View" i]',
    )
    .first();
}

/**
 * Navigate to favorites page
 */
export async function navigateToFavorites(page: Page): Promise<void> {
  const favoritesButton = getFavoritesNavButton(page);
  await favoritesButton.waitFor({ state: "visible", timeout: 5000 });
  await favoritesButton.click();
  await page.waitForURL(/\/favorites/, { timeout: 10000 });
  await waitForAppLoad(page);
}

/**
 * Get favorite button on a character card
 */
export function getFavoriteButtonOnCard(
  page: Page,
  card = getFirstCharacterCard(page),
) {
  // FavoriteButton has aria-pressed attribute
  return card
    .locator("button[aria-pressed]")
    .or(card.locator("button").first());
}

/**
 * Toggle favorite on a character
 */
export async function toggleFavorite(
  page: Page,
  card = getFirstCharacterCard(page),
): Promise<boolean> {
  const favoriteButton = getFavoriteButtonOnCard(page, card);
  await favoriteButton.waitFor({ state: "visible", timeout: 10000 });
  const initialState =
    (await favoriteButton.getAttribute("aria-pressed")) === "true";
  await favoriteButton.click({ force: true }); // Force click to bypass any overlay
  await page.waitForTimeout(800); // Wait for state update
  return !initialState;
}

/**
 * Get logo/home link
 */
export function getLogoLink(page: Page) {
  return page.locator('a[href="/"], [class*="logo"]').first();
}

/**
 * Navigate to home
 */
export async function navigateToHome(page: Page): Promise<void> {
  const logoLink = getLogoLink(page);
  await logoLink.click();
  await page.waitForURL(/\//, { timeout: 5000 });
  await waitForAppLoad(page);
}
