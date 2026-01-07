import { AppRouter } from "./ui/routes/AppRouter";
import { FavoritesProvider } from "./ui/state/FavoritesContext";
import { DependenciesProvider } from "./ui/state/DependenciesContext";
import { QueryProvider } from "./ui/providers/QueryProvider";
import { ErrorBoundary } from "./ui/components/ErrorBoundary/ErrorBoundary";
import "./App.scss";

/**
 * Root Application Component
 *
 * Provides global context providers and routing.
 *
 * Context hierarchy:
 * 1. ErrorBoundary - Catches React errors and prevents console spam in production
 * 2. DependenciesProvider - Injects use cases and repositories (hexagonal architecture)
 * 3. QueryProvider - React Query for server state caching and loading management
 * 4. FavoritesProvider - Manages favorites state (client state - localStorage)

 */
function App() {
  return (
    <ErrorBoundary>
      <DependenciesProvider>
        <QueryProvider>
          <FavoritesProvider>
            <AppRouter />
          </FavoritesProvider>
        </QueryProvider>
      </DependenciesProvider>
    </ErrorBoundary>
  );
}

export default App;
