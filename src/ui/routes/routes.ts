/**
 * Application Routes
 * 
 * Centralized route definitions for type-safe navigation.
 */

export const routes = {
  home: '/',
  favorites: '/favorites',
  characterDetail: (id: number | string) => `/character/${id}`,
  characterDetailPattern: '/character/:id',
} as const;
