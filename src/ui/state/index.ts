/**
 * State Management - Public API
 *
 * Centralized exports for all context providers and hooks.
 */

export { FavoritesProvider, useFavorites } from "./FavoritesContext";
export { LoadingProvider, useLoading } from "./LoadingContext";
export {
  DependenciesProvider,
  useDependencyContainer,
  useUseCases,
  useServices,
} from "./DependenciesContext";
