import { AppRouter } from "./ui/routes/AppRouter";
import { FavoritesProvider } from "./ui/state/FavoritesContext";
import { DependenciesProvider } from "./ui/state/DependenciesContext";
import { QueryProvider } from "./ui/providers/QueryProvider";
import "./App.scss";

/**
 * Root Application Component
 *
 * Provides global context providers and routing.
 *
 * Context hierarchy:
 * 1. DependenciesProvider - Injects use cases and repositories (hexagonal architecture)
 * 2. QueryProvider - React Query for server state caching and loading management
 * 3. FavoritesProvider - Manages favorites state (client state - localStorage)

 */
function App() {
  return (
    <DependenciesProvider>
      <QueryProvider>
        <FavoritesProvider>
          <AppRouter />
        </FavoritesProvider>
      </QueryProvider>
    </DependenciesProvider>
  );
}

export default App;
