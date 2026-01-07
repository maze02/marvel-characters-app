import React, { createContext, useContext, useMemo } from "react";
import { DependencyContainer } from "@infrastructure/dependencies/DependencyContainer";

/**
 * Dependencies Context
 *
 * Provides application dependencies (use cases and repositories) throughout the React component tree.
 * Uses React Context API to implement Dependency Injection pattern.
 *
 * Benefits:
 * - Components don't create their own dependencies
 * - Easy to test - can inject mock dependencies via context
 * - Single instance shared across all components
 *
 * @example
 * ```typescript
 * // In a component:
 * const { listCharacters, searchCharacters } = useDependencies();
 * const result = await listCharacters.execute({ limit: 50 });
 * ```
 */

interface DependenciesContextValue {
  container: DependencyContainer;
}

const DependenciesContext = createContext<DependenciesContextValue | null>(
  null,
);

interface DependenciesProviderProps {
  children: React.ReactNode;
  /**
   * Optional container for testing - if not provided, creates production container
   */
  container?: DependencyContainer;
}

/**
 * Dependencies Provider Component
 *
 * Wrap your app with this provider to enable dependency injection.
 * Creates a single container instance that's shared across all components.
 */
export const DependenciesProvider: React.FC<DependenciesProviderProps> = ({
  children,
  container,
}) => {
  // Create container once and memoize it
  // If a container is provided (e.g., for testing), use that instead
  const memoizedContainer = useMemo(
    () => container || DependencyContainer.create(),
    [container],
  );

  const value = useMemo(
    () => ({ container: memoizedContainer }),
    [memoizedContainer],
  );

  return (
    <DependenciesContext.Provider value={value}>
      {children}
    </DependenciesContext.Provider>
  );
};

/**
 * Hook to access the dependency container
 *
 * @throws Error if used outside of DependenciesProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useDependencyContainer = (): DependencyContainer => {
  const context = useContext(DependenciesContext);

  if (!context) {
    throw new Error(
      "useDependencyContainer must be used within a DependenciesProvider. " +
        "Wrap your app with <DependenciesProvider>.",
    );
  }

  return context.container;
};

/**
 * Hook to access use cases directly (convenience hook)
 *
 * @example
 * ```typescript
 * const { listCharacters, searchCharacters } = useUseCases();
 * const characters = await listCharacters.execute({ limit: 50 });
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useUseCases = () => {
  const container = useDependencyContainer();
  return container.useCases;
};

/**
 * Hook to access services directly (infrastructure services like SEO)
 *
 * @example
 * ```typescript
 * const { seo } = useServices();
 * seo.updateMetadata({ title: "My Page", description: "..." });
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useServices = () => {
  const container = useDependencyContainer();
  return container.services;
};
