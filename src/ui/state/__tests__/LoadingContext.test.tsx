/**
 * LoadingContext Tests
 * 
 * Tests global loading state management for loading bar display.
 */

import { renderHook, act } from '@testing-library/react';
import { LoadingProvider, useLoading } from '../LoadingContext';

describe('LoadingContext', () => {
  /**
   * Helper: Render hook with provider wrapper
   */
  const renderWithProvider = () => {
    return renderHook(() => useLoading(), {
      wrapper: LoadingProvider,
    });
  };

  describe('Provider initialization', () => {
    it('should initialize with loading false', () => {
      const { result } = renderWithProvider();

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useLoading hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useLoading());
      }).toThrow('useLoading must be used within a LoadingProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should provide loading state and control methods', () => {
      const { result } = renderWithProvider();

      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('startLoading');
      expect(result.current).toHaveProperty('stopLoading');
      expect(typeof result.current.startLoading).toBe('function');
      expect(typeof result.current.stopLoading).toBe('function');
    });
  });

  describe('Loading state management', () => {
    it('should start loading', () => {
      const { result } = renderWithProvider();

      act(() => {
        result.current.startLoading();
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should stop loading', () => {
      const { result } = renderWithProvider();

      act(() => {
        result.current.startLoading();
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.stopLoading();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle multiple start/stop cycles', () => {
      const { result } = renderWithProvider();

      act(() => {
        result.current.startLoading();
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.stopLoading();
      });
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.startLoading();
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.stopLoading();
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle stop when not loading', () => {
      const { result } = renderWithProvider();

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.stopLoading();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
