import { AppRouter } from "./ui/routes/AppRouter";
import { FavoritesProvider } from "./ui/state/FavoritesContext";
import { DependenciesProvider } from "./ui/state/DependenciesContext";
import "./App.scss";
import { LoadingProvider } from "./ui/state/LoadingContext";

/**
 * Root Application Component
 *
 * Provides global context providers and routing.
 *
 * Context hierarchy:
 * 1. DependenciesProvider - Injects use cases and repositories
 * 2. FavoritesProvider - Manages favorites state
 * 3. LoadingProvider - Manages loading state
 */
function App() {
  return (
    <DependenciesProvider>
      <FavoritesProvider>
        <LoadingProvider>
          <AppRouter />
        </LoadingProvider>
      </FavoritesProvider>
    </DependenciesProvider>
  );
}

export default App;
