import { useEffect, useState } from "react";

/**
 * Waits for user to stop typing before updating the value
 *
 * This prevents making too many API calls while the user is still typing.
 * For example, typing "Spider-Man" won't make 10 API calls - just 1 after you stop typing.
 *
 * @param value - The value to wait for (like search text)
 * @param delay - How long to wait in milliseconds (400ms = 0.4 seconds)
 * @returns The value after the waiting period
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(searchQuery, 400);
 *
 * // debouncedQuery only updates 400ms after user stops typing
 * useEffect(() => {
 *   // Make API call with debouncedQuery
 * }, [debouncedQuery]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timer if value changes before delay completes
    // This ensures we only update after user stops typing
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
