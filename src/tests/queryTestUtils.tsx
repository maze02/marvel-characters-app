/**
 * React Query Test Utilities
 *
 * Provides helper functions and components for testing with React Query.
 * Use these utilities when testing components that use React Query hooks.
 *
 * @example
 * ```typescript
 * import { renderWithQueryClient } from '@tests/queryTestUtils';
 *
 * test('my component', () => {
 *   const { getByText } = renderWithQueryClient(<MyComponent />);
 *   // ... test code
 * });
 * ```
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Creates a new QueryClient configured for testing
 *
 * Test configuration:
 * - Disables retries (faster tests, predictable errors)
 * - Disables caching (tests are independent)
 * - Suppresses error logging (cleaner test output)
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests
        retry: false,
        // Disable caching in tests (each test gets fresh data)
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        // Disable retries in tests
        retry: false,
      },
    },
    // Note: logger config was removed in React Query v5
    // Console errors are automatically suppressed in test environments
  });
}

/**
 * Wrapper component that provides QueryClient to children
 * Used by renderWithQueryClient
 */
interface QueryWrapperProps {
  children: React.ReactNode;
  client?: QueryClient;
}

export function QueryWrapper({ children, client }: QueryWrapperProps) {
  const queryClient = client || createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Custom render function that wraps component with QueryClientProvider
 *
 * Use this instead of @testing-library/react's render when testing
 * components that use React Query hooks.
 *
 * @param ui - Component to render
 * @param options - Render options (can include custom queryClient)
 * @returns Render result from @testing-library/react
 *
 * @example
 * ```typescript
 * const { getByText } = renderWithQueryClient(<MyComponent />);
 * ```
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient },
) {
  const { queryClient, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Only pass client prop if it's defined (exactOptionalPropertyTypes compliance)
    const props = queryClient ? { client: queryClient } : {};
    return <QueryWrapper {...props}>{children}</QueryWrapper>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Creates a mock QueryClient with pre-filled cache
 *
 * Useful for testing components that depend on cached data.
 *
 * @example
 * ```typescript
 * const queryClient = createMockQueryClient({
 *   ['characters', 'list']: { pages: [...], pageParams: [...] }
 * });
 * ```
 */
export function createMockQueryClient(
  initialData?: Record<string, unknown>,
): QueryClient {
  const queryClient = createTestQueryClient();

  if (initialData) {
    Object.entries(initialData).forEach(([key, data]) => {
      queryClient.setQueryData([key], data);
    });
  }

  return queryClient;
}
