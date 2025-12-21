import { renderHook } from '@testing-library/react';
import { useAdaptiveLineClamp } from './useAdaptiveLineClamp';
import { useRef } from 'react';

describe('useAdaptiveLineClamp', () => {
  // Mock window methods that are not available in jsdom
  beforeEach(() => {
    // Mock getComputedStyle
    window.getComputedStyle = jest.fn().mockReturnValue({
      lineHeight: '24px',
      fontSize: '16px',
    });

    // Mock scrollTo
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return minimum lines when refs are not set', () => {
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(null);
      const textRef = useRef<HTMLParagraphElement>(null);
      
      return useAdaptiveLineClamp({
        containerRef,
        textRef,
        minLines: 3,
      });
    });
    
    // Should return minLines when refs aren't populated
    expect(result.current).toBe(3);
  });

  it('should handle maxLines constraint', () => {
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(null);
      const textRef = useRef<HTMLParagraphElement>(null);
      
      return useAdaptiveLineClamp({
        containerRef,
        textRef,
        minLines: 1,
        maxLines: 5,
      });
    });
    
    expect(typeof result.current).toBe('number');
    expect(result.current).toBeGreaterThanOrEqual(1);
    expect(result.current).toBeLessThanOrEqual(5);
  });

  it('should use default values', () => {
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(null);
      const textRef = useRef<HTMLParagraphElement>(null);
      
      return useAdaptiveLineClamp({
        containerRef,
        textRef,
      });
    });
    
    expect(typeof result.current).toBe('number');
    expect(result.current).toBeGreaterThanOrEqual(1);
  });

  it('should respect minLines default', () => {
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(null);
      const textRef = useRef<HTMLParagraphElement>(null);
      
      return useAdaptiveLineClamp({
        containerRef,
        textRef,
        minLines: 2,
      });
    });
    
    // Should return at least minLines
    expect(result.current).toBeGreaterThanOrEqual(2);
  });
});
