import React from "react";
import { Decorator } from "@storybook/react";

/**
 * Mock Favorites Context for Storybook
 *
 * Provides a mock implementation of the FavoritesContext for stories that need it.
 * Allows stories to control the favorites count via parameters.
 *
 * Usage in stories:
 * ```tsx
 * export const MyStory: Story = {
 *   parameters: {
 *     favoritesCount: 5, // Set the mock favorites count
 *   },
 * };
 * ```
 */

// Create a mock context
const MockFavoritesContext = React.createContext({
  favoritesCount: 0,
  isFavorite: () => false,
  toggleFavorite: () => {},
  favorites: [],
});

/**
 * Mock Favorites Provider
 * Provides mock favorites context data to child components
 */
const MockFavoritesProvider: React.FC<{
  children: React.ReactNode;
  favoritesCount?: number;
}> = ({ children, favoritesCount = 0 }) => {
  const mockValue = React.useMemo(
    () => ({
      favoritesCount,
      isFavorite: () => false,
      toggleFavorite: () => {
        console.log("Toggle favorite (mock)");
      },
      favorites: [],
    }),
    [favoritesCount],
  );

  return (
    <MockFavoritesContext.Provider value={mockValue}>
      {children}
    </MockFavoritesContext.Provider>
  );
};

/**
 * Storybook Decorator for Favorites Context
 *
 * Wraps stories with a mock FavoritesProvider.
 * Reads favoritesCount from story parameters.
 */
export const withFavoritesContext: Decorator = (Story, context) => {
  const favoritesCount = context.parameters?.favoritesCount ?? 0;

  return (
    <MockFavoritesProvider favoritesCount={favoritesCount}>
      <Story />
    </MockFavoritesProvider>
  );
};
