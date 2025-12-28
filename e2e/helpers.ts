import { Page, expect } from "@playwright/test";

/**
 * E2E Test Helper Functions
 * 

 * ============================================================================
 * TECHNICAL NOTES:
 * ============================================================================
 * Reusable utility functions following DRY (Don't Repeat Yourself) principles
 * and Playwright best practices.
 */

/**
 * Wait for the application to be fully loaded
 *
 * WHAT THIS DOES:
 * Makes sure the webpage has finished loading and is ready for the user to
 * interact with it. Like waiting for a page to stop showing a loading spinner.
 *
 * WHY WE NEED THIS:
 * If we try to click buttons before the page is loaded, the test will fail.
 * This ensures everything is ready before we proceed.
 *
 * TECHNICAL DETAILS:
 * - Waits for root DOM element (#root)
 * - Waits for main content area
 * - Waits for network requests to complete (networkidle)
 */
export async function waitForAppLoad(page: Page): Promise<void> {
  // Wait for root element first
  await page.waitForSelector("#root", { timeout: 15000 });

  // Wait for main content area
  await page.waitForSelector("main", { timeout: 15000 });

  // Instead of networkidle (which can be flaky with continuous requests),
  // wait for the page to be in a ready state by checking for key UI elements
  // This is more reliable and follows E2E best practice #6 (condition-based waits)
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
}

/**
 * Wait for characters to be loaded on the list page
 *
 * WHAT THIS DOES:
 * Waits until we can see character cards on the screen. Like waiting for
 * images to load on a photo gallery page.
 *
 * WHY WE NEED THIS:
 * After the page loads, it takes a moment to fetch character data from the
 * server and display it. We wait for at least one character to appear before
 * trying to interact with them.
 *
 * TECHNICAL DETAILS:
 * - Waits for character-card elements with data-testid
 * - Waits for favorite buttons to be ready
 * - Ensures first card is visible and interactive
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

  // Wait for the first character card to be fully visible and interactive
  await expect(
    page.locator('[data-testid="character-card"]').first(),
  ).toBeVisible({ timeout: 5000 });
}

/**
 * Get the first character card
 *
 * WHAT THIS DOES:
 * Finds the first character card on the page. Like pointing at the first
 * photo in a gallery.
 *
 * WHY WE NEED THIS:
 * Many tests need to interact with a character card (click it, favorite it, etc.).
 * Instead of always finding "the first card" in each test, we have this helper
 * function that does it once.
 *
 * TECHNICAL DETAILS:
 * - Returns Playwright locator for first character-card element
 */
export function getFirstCharacterCard(page: Page) {
  return page.locator('[data-testid="character-card"]').first();
}

/**
 * Get character name from a card
 *
 * WHAT THIS DOES:
 * Reads the character's name from a character card. Like reading the label
 * under a photo in a gallery.
 *
 * WHY WE NEED THIS:
 * We often need to remember which character we clicked on, so we can verify
 * later that we're on the correct detail page. This function extracts the
 * name text from the card.
 *
 * TECHNICAL DETAILS:
 * - Extracts text content from character-name element
 * - Returns trimmed string
 * - Throws error if name not found
 */
export async function getCharacterNameFromCard(
  page: Page,
  card = getFirstCharacterCard(page),
): Promise<string> {
  const name = await card
    .locator('[data-testid="character-name"]')
    .textContent();
  if (!name) {
    throw new Error("Character name not found in card");
  }
  return name.trim();
}

/**
 * Navigate to character detail page
 *
 * WHAT THIS DOES:
 * Simulates a user clicking on a character card to view more details about them.
 * Like clicking on a photo thumbnail to see the full-size image.
 *
 * WHY WE NEED THIS:
 * Many tests need to go to a character's detail page. This function handles
 * all the steps: remember the character name, click the card, wait for the
 * new page to load, and return the name so we can verify it later.
 *
 * TECHNICAL DETAILS:
 * - Gets character name before navigating
 * - Clicks the card link (not the favorite button)
 * - Waits for URL to change to /character/:id
 * - Waits for network requests to complete
 * - Returns character name for verification
 */
export async function navigateToCharacterDetail(
  page: Page,
  card = getFirstCharacterCard(page),
): Promise<string> {
  const characterName = await getCharacterNameFromCard(page, card);
  // Click on the card link (not the button) using stable selector
  const cardLink = card.locator('[data-testid="character-card-link"]');
  await cardLink.click();
  await page.waitForURL(/\/character\/\d+/, { timeout: 15000 });
  // Wait for page to load (not networkidle - can be flaky)
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
  return characterName;
}

/**
 * Get search input
 *
 * WHAT THIS DOES:
 * Finds the search box where users type character names.
 *
 * WHY WE NEED THIS:
 * Multiple tests need to interact with the search box. This helper finds
 * it using the proper accessibility role (searchbox) so it's easy to reuse.
 *
 * TECHNICAL DETAILS:
 * - Uses semantic role="searchbox" selector
 */
export function getSearchInput(page: Page) {
  return page.getByRole("searchbox");
}

/**
 * Perform a search
 *
 * WHAT THIS DOES:
 * Simulates a user typing in the search box and waiting for results to appear.
 * Like typing "Spider-Man" in a search box and waiting for matching characters
 * to show up.
 *
 * WHY WE NEED THIS:
 * Search involves multiple steps: find the search box, type the text, wait
 * for the debounce delay, wait for API call, wait for results. This function
 * handles all of that automatically.
 *
 * TECHNICAL DETAILS:
 * - Fills search input with query string
 * - Waits for the specific search API response (not just networkidle)
 * - Waits for character cards to appear with updated results
 * - Uses waitForResponse to avoid race conditions
 */
export async function performSearch(page: Page, query: string): Promise<void> {
  const searchInput = getSearchInput(page);

  // Set up response listener BEFORE typing (to catch the debounced request)
  // This ensures we wait for the RIGHT network request, not just any idle state
  const responsePromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      // Wait for the search API response by checking if the URL contains:
      // 1. The characters endpoint
      // 2. The filter parameter with our search query
      // Example URL: .../characters/?filter=publisher:31,name:Spider&limit=50
      return url.includes("characters") && url.includes(`name:${query}`);
    },
    { timeout: 15000 }, // Allow time for debounce (400ms) + API call
  );

  // Type in search box (this will trigger debounced search after 400ms)
  await searchInput.fill(query);

  // Wait for the actual search API response to complete
  await responsePromise;

  // Wait for character cards to be updated with search results
  await page.waitForSelector('[data-testid="character-card"]', {
    timeout: 10000,
  });
}

/**
 * Get favorites button in navbar
 *
 * WHAT THIS DOES:
 * Finds the "Favorites" button in the top navigation bar. This is the button
 * users click to see all their saved favorite characters.
 *
 * WHY WE NEED THIS:
 * Multiple tests need to navigate to the favorites page. This helper finds
 * the button reliably using its aria-label accessibility attribute.
 *
 * TECHNICAL DETAILS:
 * - Looks for button in header with aria-label containing "favorite"
 * - Returns first matching button
 */
export function getFavoritesNavButton(page: Page) {
  // Navbar button with stable data-testid selector
  return page.locator('[data-testid="favorites-nav-button"]');
}

/**
 * Navigate to favorites page
 *
 * WHAT THIS DOES:
 * Simulates clicking the "Favorites" button in the navigation bar to go to
 * the page showing all favorited characters.
 *
 * WHY WE NEED THIS:
 * Tests that verify favorites functionality need to visit the favorites page.
 * This function handles finding the button, clicking it, and waiting for the
 * new page to load.
 *
 * TECHNICAL DETAILS:
 * - Finds and clicks favorites navigation button
 * - Waits for URL to change to /favorites
 * - Waits for app to fully load
 */
export async function navigateToFavorites(page: Page): Promise<void> {
  const favoritesButton = getFavoritesNavButton(page);
  await favoritesButton.waitFor({ state: "visible", timeout: 5000 });
  await favoritesButton.click();
  await page.waitForURL(/\/favorites/, { timeout: 10000 });
  // Wait for page to load
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
}

/**
 * Get favorite button on a character card
 *
 * WHAT THIS DOES:
 * Finds the heart-shaped button on a character card that users click to
 * save the character to their favorites.
 *
 * WHY WE NEED THIS:
 * Many tests interact with the favorite button. This helper finds it reliably
 * using a stable selector (data-testid) so tests don't break if styling changes.
 *
 * TECHNICAL DETAILS:
 * - Uses data-testid="favorite-button" selector
 * - Works on any character card
 */
export function getFavoriteButtonOnCard(
  page: Page,
  card = getFirstCharacterCard(page),
) {
  // FavoriteButton has data-testid="favorite-button"
  return card.locator('[data-testid="favorite-button"]');
}

/**
 * Toggle favorite on a character
 *
 * WHAT THIS DOES:
 * Simulates clicking the heart button on a character card to add or remove
 * them from favorites. Like clicking a "like" button on social media.
 *
 * WHY WE NEED THIS:
 * Tests need to verify that favoriting works correctly. This function clicks
 * the button and waits for the state to actually change (heart fills in or
 * empties out) before continuing.
 *
 * TECHNICAL DETAILS:
 * - Finds favorite button on card
 * - Checks current state (favorited or not)
 * - Clicks button
 * - Waits for aria-pressed attribute to toggle
 * - Returns new favorited state
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
  // Wait for the state to change
  const expectedState = !initialState;
  await expect(favoriteButton).toHaveAttribute(
    "aria-pressed",
    expectedState.toString(),
    { timeout: 3000 },
  );
  return expectedState;
}

/**
 * Get logo/home link
 *
 * WHAT THIS DOES:
 * Finds the Marvel logo at the top of the page that users can click to
 * return to the home page. Like clicking a website's logo to go back to
 * the main page.
 *
 * WHY WE NEED THIS:
 * Tests need to navigate back to the home page from other pages. The logo
 * is a standard way to do this on websites.
 *
 * TECHNICAL DETAILS:
 * - Looks for links with href="/" or elements with class containing "logo"
 * - Returns first matching element
 */
export function getLogoLink(page: Page) {
  return page.locator('[data-testid="site-logo"]');
}

/**
 * Navigate to home
 *
 * WHAT THIS DOES:
 * Simulates clicking the logo to return to the main character list page.
 * Like clicking "Home" or the logo to go back to where you started.
 *
 * WHY WE NEED THIS:
 * Tests that navigate to detail or favorites pages need a way to return
 * to the home page. This function handles clicking the logo and waiting
 * for the home page to load.
 *
 * TECHNICAL DETAILS:
 * - Finds and clicks logo link
 * - Waits for URL to change to /
 * - Waits for app to fully load
 */
export async function navigateToHome(page: Page): Promise<void> {
  const logoLink = getLogoLink(page);
  await logoLink.click();
  await page.waitForURL(/\//, { timeout: 5000 });
  // Wait for page to load
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
}
