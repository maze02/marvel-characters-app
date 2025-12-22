import { renderHook, waitFor } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } }
    );

    expect(result.current).toBe('first');

    // Change value
    rerender({ value: 'second' });

    // Value should not change immediately
    expect(result.current).toBe('first');

    // Fast-forward time
    jest.advanceTimersByTime(300);

    // Wait for state update
    await waitFor(() => {
      expect(result.current).toBe('second');
    });
  });

  it('should reset timer on rapid value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } }
    );

    // Rapid changes
    rerender({ value: 'second' });
    jest.advanceTimersByTime(100);
    rerender({ value: 'third' });
    jest.advanceTimersByTime(100);
    rerender({ value: 'fourth' });

    // Value should still be 'first' because timer keeps resetting
    expect(result.current).toBe('first');

    // Fast-forward past delay
    jest.advanceTimersByTime(300);

    // Should now have the latest value
    await waitFor(() => {
      expect(result.current).toBe('fourth');
    });
  });

  it('should handle different delay values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // 300ms should not be enough
    jest.advanceTimersByTime(300);
    expect(result.current).toBe('initial');

    // 500ms total should update
    jest.advanceTimersByTime(200);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should work with non-string values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 42 } }
    );

    expect(result.current).toBe(42);

    rerender({ value: 100 });
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('should work with objects', async () => {
    const obj1 = { id: 1, name: 'Test' };
    const obj2 = { id: 2, name: 'Updated' };

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: obj1 } }
    );

    expect(result.current).toBe(obj1);

    rerender({ value: obj2 });
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe(obj2);
    });
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebouncedValue('test', 300));

    // Should not throw or cause memory leaks
    unmount();

    // Advance timers to ensure no pending timeouts
    jest.advanceTimersByTime(300);
  });
});
