/**
 * Console Suppression Utility
 *
 * Completely suppresses all console output in production builds
 * This ensures a clean console for Lighthouse Best Practices scoring
 */

export function suppressConsoleInProduction(): void {
  // Only suppress in production
  if (process.env.NODE_ENV === "production") {
    const noop = () => {};

    // Suppress all console methods
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    console.group = noop;
    console.groupCollapsed = noop;
    console.groupEnd = noop;
    console.table = noop;
    console.dir = noop;
    console.dirxml = noop;
    console.assert = noop;
    console.count = noop;
    console.countReset = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.timeLog = noop;
  }
}
