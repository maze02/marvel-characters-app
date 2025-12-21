import { renderHook } from '@testing-library/react';
import { DependenciesProvider, useUseCases, useDependencyContainer } from '../DependenciesContext';
import { DependencyContainer } from '@infrastructure/dependencies/DependencyContainer';

describe('DependenciesContext', () => {
  describe('useDependencyContainer', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useDependencyContainer());
      }).toThrow('useDependencyContainer must be used within a DependenciesProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return container when used inside provider', () => {
      const { result } = renderHook(() => useDependencyContainer(), {
        wrapper: DependenciesProvider,
      });

      expect(result.current).toBeInstanceOf(DependencyContainer);
    });
  });

  describe('useUseCases', () => {
    it('should return all use cases', () => {
      const { result } = renderHook(() => useUseCases(), {
        wrapper: DependenciesProvider,
      });

      expect(result.current).toHaveProperty('listCharacters');
      expect(result.current).toHaveProperty('searchCharacters');
      expect(result.current).toHaveProperty('getCharacterDetail');
      expect(result.current).toHaveProperty('listCharacterComics');
      expect(result.current).toHaveProperty('toggleFavorite');
      expect(result.current).toHaveProperty('listFavorites');
    });

    it('should return same instance on multiple renders', () => {
      const { result, rerender } = renderHook(() => useUseCases(), {
        wrapper: DependenciesProvider,
      });

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Same instance should be returned (referential equality)
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Custom container for testing', () => {
    it('should accept custom container for testing', () => {
      // Create a mock container (you would typically use mock repositories here)
      const mockContainer = DependencyContainer.create();

      const { result } = renderHook(() => useDependencyContainer(), {
        wrapper: ({ children }) => (
          <DependenciesProvider container={mockContainer}>
            {children}
          </DependenciesProvider>
        ),
      });

      expect(result.current).toBe(mockContainer);
    });
  });
});
