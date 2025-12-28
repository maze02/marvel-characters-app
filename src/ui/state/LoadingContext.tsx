import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * LoadingProvider
 *
 * Provides global loading state management for the application.
 * Used to control the navigation loading bar visibility.
 *
 * React 18 Compatibility:
 * - Components should wrap startLoading() calls in flushSync for immediate visibility
 * - This ensures loading bar is immediately visible before async operations
 * - Prevents automatic batching from hiding loading indicators
 *
 * Important: Each component is responsible for calling startLoading() and
 * stopLoading() in balanced pairs (e.g., in try/finally blocks)
 */
export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({ isLoading, startLoading, stopLoading }),
    [isLoading, startLoading, stopLoading],
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

/**
 * Hook to access loading state and controls
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
