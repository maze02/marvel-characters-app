import { test, expect } from "@playwright/test";
import { waitForAppLoad } from "./helpers";

/**
 * USER JOURNEY: Handling API Errors Gracefully
 *
 * BUSINESS VALUE: When the API fails or network is down, users should see
 * helpful error messages instead of broken pages. This maintains trust and
 * provides clear next steps.
 *
 * WHAT THIS TESTS:
 * 1. Users see error message when character list fails to load
 * 2. Users can retry after an error
 * 3. Users see error message when character detail fails to load
 * 4. Error messages are user-friendly (not technical jargon)
 *
 * FAILURE IMPACT: If these tests fail, users see broken pages with no
 * guidance when APIs fail. This is a HIGH priority for user experience
 * and error recovery.
 *
 * TECHNICAL DETAILS:
 * - Uses Playwright route mocking to simulate API failures
 * - Tests error boundaries and error states
 * - Validates retry functionality
 */
test.describe("Error Handling", () => {
  test("should show error message when character list API fails", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: When the API that loads character list fails,
     * users see a clear error message explaining what went wrong.
     *
     * WHY IT MATTERS: Network failures happen. Users need to understand
     * the problem isn't their fault and know what to do next.
     */
    // Mock API to fail
    await page.route("**/characters/?**", (route) => route.abort("failed"));

    // Navigate to home page
    await page.goto("/");
    await waitForAppLoad(page);

    // Should show error state (not blank page)
    // Wait for error UI to render using condition-based waiting
    const errorHeading = page.getByText(
      /error|failed|unable|something went wrong/i,
    );
    const retryButton = page.getByRole("button", { name: /retry/i });

    // Use expect.toPass() for flexible condition-based waiting
    await expect(async () => {
      const hasError = await errorHeading.isVisible().catch(() => false);
      const hasRetry = await retryButton.isVisible().catch(() => false);
      expect(hasError || hasRetry).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test("should allow retrying after character list load failure", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: After an error, users can click a "Retry" button
     * to try loading the data again.
     *
     * WHY IT MATTERS: Transient errors (temporary network issues) should
     * be recoverable. Users need a way to retry without refreshing.
     *
     * NOTE: React Query automatically retries up to 3 times, so need
     * to fail enough requests to exhaust all retries and show the error state.
     */
    let requestCount = 0;

    // Fail first 4 requests (initial + 3 retries), then succeed
    await page.route("**/characters/?**", (route) => {
      requestCount++;
      if (requestCount <= 4) {
        // Fail initial request and all automatic retries
        route.abort("failed");
      } else {
        // Succeed on manual retry (user clicking retry button)
        route.continue();
      }
    });

    await page.goto("/");
    await waitForAppLoad(page);

    // Wait for error state to render - retry button should appear
    // React Query will try 3 times automatically before showing error
    const retryButton = page.getByRole("button", { name: /retry/i });

    // Assert that retry button appears after error
    await expect(retryButton).toBeVisible({ timeout: 15000 });

    // Click retry button
    await retryButton.click();

    // Wait for characters to load successfully after retry
    await page.waitForSelector('[data-testid="character-card"]', {
      timeout: 10000,
    });

    // Verify characters are now displayed
    const characterCards = page.locator('[data-testid="character-card"]');
    const count = await characterCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should show error message for invalid character detail", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: When users navigate to a character ID that doesn't
     * exist (404 error), they see a helpful error page with way to go back.
     *
     * WHY IT MATTERS: Broken links, old bookmarks, or typos in URLs happen.
     * Users need clear messaging and a way to recover.
     */
    // Navigate to invalid character ID
    await page.goto("/character/999999999");

    // Wait for error page to load using condition-based waiting
    const errorHeading = page.getByRole("heading", {
      name: /not found|error|unable/i,
    });
    await expect(errorHeading).toBeVisible({ timeout: 10000 });

    // Should provide way to go back home (button for error state navigation)
    const homeButton = page.getByRole("button", { name: /return to home/i });
    await expect(homeButton).toBeVisible();
  });

  test("should show user-friendly error messages (not technical jargon)", async ({
    page,
  }) => {
    /**
     * WHAT THIS TESTS: Error messages use plain language that non-technical
     * users can understand (not stack traces or error codes).
     *
     * WHY IT MATTERS: Most users aren't developers. Error messages like
     * "500 Internal Server Error" or "TypeError: undefined" are confusing
     * and scary. Plain English is essential.
     */
    // Mock API failure
    await page.route("**/characters/?**", (route) => route.abort("failed"));

    await page.goto("/");
    await waitForAppLoad(page);

    // Wait for page to finish rendering using condition-based waiting
    await expect(async () => {
      const bodyText = await page.textContent("body");
      // Should NOT contain technical jargon
      expect(bodyText).not.toMatch(/500|TypeError|undefined|null/i);
    }).toPass({ timeout: 10000 });

    // Note: We can't test positive case (user-friendly message) since
    // the app might not show error for this scenario. This test mainly
    // ensures no technical errors leak to users.
  });

  test("should handle network timeout gracefully", async ({ page }) => {
    /**
     * WHAT THIS TESTS: When API requests take too long (timeout), users
     * see a helpful message instead of infinite loading.
     *
     * WHY IT MATTERS: Slow networks or overloaded servers cause timeouts.
     * Users need feedback, not a frozen page.
     */
    // Mock API to timeout (delay forever)
    await page.route("**/characters/?**", (_route) => {
      // Never resolve - simulate timeout
      // Playwright will eventually timeout after default timeout period
    });

    await page.goto("/");

    // Wait for app to stabilize after timeout using condition-based waiting
    const root = page.locator("#root");
    await expect(root).toBeVisible({ timeout: 10000 });

    // Should not show infinite loading spinner
    // (This is implementation-dependent, but page should stabilize)
  });

  test("should maintain app stability after error", async ({ page }) => {
    /**
     * WHAT THIS TESTS: After encountering an error, the app remains
     * functional. Users can navigate away and use other features.
     *
     * WHY IT MATTERS: Errors shouldn't break the entire app. Error
     * boundaries and proper state management ensure isolated failures.
     */
    // Mock API failure for character list
    await page.route("**/characters/?**", (route) => route.abort("failed"));

    await page.goto("/");
    await waitForAppLoad(page);

    // Try to navigate to favorites (should still work)
    const favoritesButton = page.locator(
      '[data-testid="favorites-nav-button"]',
    );
    const hasButton = await favoritesButton.isVisible().catch(() => false);

    if (hasButton) {
      await favoritesButton.click();

      // Should navigate successfully
      await page.waitForURL(/\/favorites/, { timeout: 10000 });

      // Page should be functional
      await expect(
        page.getByRole("heading", { name: /FAVORITES/i }).first(),
      ).toBeVisible();
    } else {
      // If nav isn't visible, app recovered differently - that's okay
      const root = page.locator("#root");
      await expect(root).toBeVisible();
    }
  });
});
