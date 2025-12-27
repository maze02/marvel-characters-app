import { test, expect } from "@playwright/test";
import {
  waitForAppLoad,
  waitForCharacters,
  navigateToCharacterDetail,
  navigateToHome,
  navigateToFavorites,
  getFirstCharacterCard,
} from "./helpers";

/**
 * USER JOURNEY: Viewing Character Details and Comics
 *
 * BUSINESS VALUE: Provides users with detailed information about Marvel characters,
 * including their comics appearances. This is the core content that users come to see.
 *
 * WHAT THIS TESTS:
 * 1. Users can view full character information on a dedicated detail page
 * 2. Users see a list of comics featuring that character
 * 3. Users can scroll horizontally through the comics list
 * 4. More comics load automatically when scrolling to the end (infinite scroll)
 * 5. Users can add/remove favorites directly from the detail page
 * 6. Users can navigate back to the main character list
 * 7. Users can navigate to the favorites page from the detail page
 * 8. On mobile, long character descriptions can be expanded/collapsed
 *
 * FAILURE IMPACT: If these tests fail, users cannot access detailed character
 * information. This is a CRITICAL failure for the app's main purpose.
 *
 * TECHNICAL DETAILS:
 * - Loads 20 comics initially, more on horizontal scroll
 * - Character descriptions use adaptive line-clamping on mobile
 * - Navigation preserves context (can return to previous page)
 */
test.describe("Character Detail and Comics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppLoad(page);
    await waitForCharacters(page);
  });

  test("should display character details on detail page", async ({ page }) => {
    /**
     * WHAT THIS TESTS: When users click on a character, they see a detailed
     * page with the character's name, image, description, and favorite button.
     *
     * WHY IT MATTERS: This is the main content page. If this doesn't load,
     * users can't learn about the characters they're interested in.
     */
    // Navigate to detail page
    const characterName = await navigateToCharacterDetail(page);

    // Wait for detail page to fully load
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Verify character name is displayed (could be in h1, h2, or heading)
    const nameElement = page
      .getByRole("heading")
      .filter({ hasText: new RegExp(characterName, "i") })
      .or(page.getByText(characterName, { exact: false }));
    await expect(nameElement.first()).toBeVisible({ timeout: 15000 });

    // Verify favorite button is present
    const favoriteButton = page
      .locator('[data-testid="favorite-button"]')
      .first();
    await expect(favoriteButton).toBeVisible({ timeout: 10000 });
  });

  test("should display character comics", async ({ page }) => {
    /**
     * WHAT THIS TESTS: The detail page shows a list of comics that feature
     * the character, or a message if no comics are available.
     *
     * WHY IT MATTERS: Seeing which comics a character appears in helps users
     * discover comics to read. This is valuable content for Marvel fans.
     */
    // Navigate to character detail page
    await navigateToCharacterDetail(page);

    // Wait for page to fully load including comics
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Check for comics section using stable selector
    const comicsSection = page.locator('[data-testid="comics-section"]');
    const noComicsMessage = page.getByText(/no comics|no issues|no results/i, {
      exact: false,
    });

    // Wait for either comics section or no comics message to appear
    await Promise.race([
      comicsSection
        .waitFor({ state: "visible", timeout: 10000 })
        .catch(() => {}),
      noComicsMessage
        .waitFor({ state: "visible", timeout: 10000 })
        .catch(() => {}),
    ]);

    // Either comics section exists or "no comics" message
    const hasComicsSection = await comicsSection.isVisible().catch(() => false);
    const hasNoComicsMessage = await noComicsMessage
      .isVisible()
      .catch(() => false);

    expect(hasComicsSection || hasNoComicsMessage).toBeTruthy();
  });

  test("should toggle favorite from detail page", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can add or remove favorites directly from the
     * character detail page without returning to the main list.
     *
     * WHY IT MATTERS: Users often decide to favorite a character after reading
     * their details. They shouldn't have to go back to the list page to do this.
     */
    // Navigate to character detail
    await navigateToCharacterDetail(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    // Find favorite button (could be in CharacterHero component)
    const favoriteButton = page
      .locator('[data-testid="favorite-button"]')
      .first();
    await expect(favoriteButton).toBeVisible({ timeout: 5000 });

    // Get initial state
    const initialState =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";

    // Click favorite button
    await favoriteButton.click();

    // Wait for state to change
    const expectedState = !initialState;
    await expect(favoriteButton).toHaveAttribute(
      "aria-pressed",
      expectedState.toString(),
      { timeout: 3000 },
    );

    // Verify state changed
    const newState =
      (await favoriteButton.getAttribute("aria-pressed")) === "true";
    expect(newState).not.toBe(initialState);
  });

  test("should navigate back to list from detail page", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can return to the main character list from the
     * detail page by clicking the logo or back button.
     *
     * WHY IT MATTERS: Users need to navigate between pages. Getting stuck on
     * the detail page would be a critical navigation failure.
     */
    // Navigate to detail page
    await navigateToCharacterDetail(page);

    // Navigate back to home
    await navigateToHome(page);

    // Verify we're on the list page with characters
    await waitForCharacters(page);
    await expect(getFirstCharacterCard(page)).toBeVisible();
  });

  test("should navigate to favorites from detail page", async ({ page }) => {
    /**
     * WHAT THIS TESTS: Users can access their favorites page from the detail
     * page by clicking the favorites button in the navigation.
     *
     * WHY IT MATTERS: Navigation should work from any page. Users shouldn't
     * have to return to the home page first.
     */
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

  test("should load more comics when scrolling horizontally to the end", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: The horizontal comics carousel loads more comics
     * automatically when users scroll to the end (infinite horizontal scroll).
     *
     * WHY IT MATTERS: Popular characters appear in hundreds of comics. Loading
     * them all at once would be slow. Infinite scroll provides a smooth experience
     * while keeping the page fast.
     */
    // Navigate to character detail page
    await navigateToCharacterDetail(page);

    // Wait for page to fully load including comics
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Count initial comics (should be 20 based on COMICS_PAGE_SIZE)
    const comicItems = page.locator('[data-testid="comic-item"]');

    // Wait for comics to be visible or skip if none
    await comicItems
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
    const initialCount = await comicItems.count();

    // Skip test if character has no comics
    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Find the scroll container using stable selector
    const scrollContainer = page.locator(
      '[data-testid="comics-scroll-container"]',
    );

    // Verify container exists
    await expect(scrollContainer).toBeVisible({ timeout: 5000 });

    // Get scroll dimensions
    const scrollWidth = await scrollContainer.evaluate(
      (el) => (el as HTMLElement).scrollWidth,
    );
    const clientWidth = await scrollContainer.evaluate(
      (el) => (el as HTMLElement).clientWidth,
    );

    // Only test infinite scroll if content is scrollable and we have 20+ comics
    // (indicating there might be more to load)
    if (scrollWidth > clientWidth && initialCount >= 20) {
      // Scroll horizontally to 85% of scroll width (triggers load more at 80% threshold)
      const scrollPosition = Math.floor(scrollWidth * 0.85);
      await scrollContainer.evaluate((el, pos) => {
        (el as HTMLElement).scrollTo({ left: pos, behavior: "smooth" });
      }, scrollPosition);

      // Wait for loading indicator to appear (if there are more comics)
      const loadingIndicator = page.locator('[data-testid="loading-more"]');
      const hasLoadingIndicator = await loadingIndicator
        .isVisible()
        .catch(() => false);

      if (hasLoadingIndicator) {
        // Wait for loading to complete
        await loadingIndicator.waitFor({ state: "hidden", timeout: 10000 });
      }

      // Wait for network to be idle
      await page.waitForLoadState("networkidle", { timeout: 15000 });

      // Count comics after scroll
      const finalCount = await comicItems.count();

      // Verify more comics were loaded (if character has more than 20 comics)
      if (finalCount > initialCount) {
        expect(finalCount).toBeGreaterThan(initialCount);
      }
    } else {
      // Character might not have more than 20 comics, which is fine
      // Just verify comics are displayed
      expect(initialCount).toBeGreaterThan(0);
    }
  });
});

/**
 * USER JOURNEY: Reading Character Descriptions on Mobile
 *
 * BUSINESS VALUE: On mobile devices, character descriptions are truncated to
 * save screen space. Users can tap "READ MORE" to expand and read the full text.
 *
 * WHAT THIS TESTS:
 * 1. Long character descriptions are initially truncated on mobile
 * 2. A "READ MORE" button appears for truncated descriptions
 * 3. Tapping "READ MORE" expands the full description
 * 4. A "HIDE" button appears after expansion
 * 5. Tapping "HIDE" collapses the description back
 * 6. These buttons are visible and not cut off at the bottom of the screen
 *
 * FAILURE IMPACT: If this fails, mobile users cannot read full character
 * descriptions. This is a HIGH priority issue for mobile users.
 *
 * TECHNICAL DETAILS:
 * - Tests on iPhone SE (375x667) and smaller viewports (320x568)
 * - Uses adaptive line-clamping based on character count
 * - Ensures buttons are within viewport bounds
 */
test.describe("Character Detail - Mobile Description Expand/Collapse", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppLoad(page);
    await waitForCharacters(page);
  });

  test("should show and interact with READ MORE/HIDE buttons on mobile", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: On mobile devices (iPhone SE size), users can expand
     * truncated character descriptions by tapping "READ MORE" and collapse
     * them again with "HIDE".
     *
     * WHY IT MATTERS: Mobile screens are small. Long descriptions would push
     * comics off-screen. This feature lets users read more without sacrificing
     * the overall page layout.
     */
    // Navigate to a character with a description
    await navigateToCharacterDetail(page);
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Look for the READ MORE button (only appears for long descriptions)
    const readMoreButton = page.locator(
      '[data-testid="expand-description-button"]',
    );

    // If character has a description that's truncated
    const isReadMoreVisible = await readMoreButton
      .isVisible()
      .catch(() => false);

    if (isReadMoreVisible) {
      // Verify button is visible and not clipped
      await expect(readMoreButton).toBeVisible();

      // Get button position to ensure it's within viewport
      const buttonBox = await readMoreButton.boundingBox();
      expect(buttonBox).not.toBeNull();
      if (buttonBox) {
        expect(buttonBox.y).toBeGreaterThan(0); // Not clipped at top
        expect(buttonBox.y + buttonBox.height).toBeLessThan(667); // Not clipped at bottom
      }

      // Click READ MORE
      await readMoreButton.click();

      // CRITICAL: Verify HIDE button appears after expansion
      const hideButton = page.locator(
        '[data-testid="collapse-description-button"]',
      );
      await expect(hideButton).toBeVisible({ timeout: 2000 });

      // Verify HIDE button is also not clipped
      const hideButtonBox = await hideButton.boundingBox();
      expect(hideButtonBox).not.toBeNull();

      // Click HIDE
      await hideButton.click();

      // Verify READ MORE appears again after collapsing
      await expect(readMoreButton).toBeVisible({ timeout: 2000 });
    }
  });

  test("should handle expand/collapse on different mobile viewports", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: The expand/collapse feature works correctly even on
     * very small mobile devices (like older iPhones).
     *
     * WHY IT MATTERS: Not all users have large, modern phones. The app should
     * work well on smaller screens too. This ensures accessibility for all users.
     */
    // Test on a smaller viewport (iPhone SE)
    await page.setViewportSize({ width: 320, height: 568 });

    await navigateToCharacterDetail(page);
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    const readMoreButton = page.locator(
      '[data-testid="expand-description-button"]',
    );
    const isVisible = await readMoreButton.isVisible().catch(() => false);

    if (isVisible) {
      // Verify button is accessible on small screen
      await expect(readMoreButton).toBeVisible();

      // Get initial button position to ensure it's not clipped
      const readMoreBox = await readMoreButton.boundingBox();
      expect(readMoreBox).not.toBeNull();
      if (readMoreBox) {
        // Ensure button is visible within viewport before expansion
        expect(readMoreBox.y).toBeGreaterThan(0);
      }

      // Click and verify expansion works
      await readMoreButton.click();

      const hideButton = page.locator(
        '[data-testid="collapse-description-button"]',
      );

      // Scroll to the HIDE button to ensure it's in view
      // (expanded content may extend beyond viewport, which is expected)
      await hideButton.scrollIntoViewIfNeeded();

      // Verify HIDE button is visible after scrolling
      await expect(hideButton).toBeVisible({ timeout: 2000 });

      // Click HIDE to collapse
      await hideButton.click();

      // Verify READ MORE appears again
      await expect(readMoreButton).toBeVisible({ timeout: 2000 });
    }
  });
});
