import { useEffect, useState, RefObject } from 'react';

interface UseAdaptiveLineClampConfig {
  /**
   * Reference to the container element that defines the available space
   */
  containerRef: RefObject<HTMLElement>;
  
  /**
   * Reference to the text element that will be clamped
   */
  textRef: RefObject<HTMLElement>;
  
  /**
   * Height reserved by other elements (header, padding, gaps, etc.)
   * Can be a function that calculates dynamically based on container
   */
  reservedHeight?: number | ((containerHeight: number) => number);
  
  /**
   * Safety margin in lines to prevent overflow (default: 1)
   */
  safetyMargin?: number;
  
  /**
   * Minimum number of lines to show (default: 1)
   */
  minLines?: number;
  
  /**
   * Maximum number of lines to show (optional)
   */
  maxLines?: number;
}

/**
 * Hook that calculates optimal line clamp based on available container space
 * 
 * Features:
 * - Automatically recalculates on container resize
 * - Accounts for reserved space (headers, padding, etc.)
 * - Respects min/max constraints
 * - Uses ResizeObserver for efficient updates
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const textRef = useRef<HTMLParagraphElement>(null);
 * 
 * const lineClamp = useAdaptiveLineClamp({
 *   containerRef,
 *   textRef,
 *   reservedHeight: 120,
 *   safetyMargin: 1
 * });
 * 
 * <p ref={textRef} style={{ WebkitLineClamp: lineClamp }}>...</p>
 * ```
 */
export const useAdaptiveLineClamp = ({
  containerRef,
  textRef,
  reservedHeight = 0,
  safetyMargin = 1,
  minLines = 1,
  maxLines,
}: UseAdaptiveLineClampConfig): number => {
  const [lineClamp, setLineClamp] = useState<number>(minLines);

  useEffect(() => {
    const calculateLineClamp = () => {
      if (!containerRef.current || !textRef.current) {
        return;
      }

      // Get computed styles of the text element
      const textStyle = window.getComputedStyle(textRef.current);
      const lineHeight = parseFloat(textStyle.lineHeight);
      const fontSize = parseFloat(textStyle.fontSize);
      
      // If line-height is not set or is 'normal', calculate it
      const actualLineHeight = isNaN(lineHeight) 
        ? fontSize * 1.2 // Default line-height multiplier
        : lineHeight;

      // Get container height
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate reserved height
      const reserved = typeof reservedHeight === 'function'
        ? reservedHeight(containerHeight)
        : reservedHeight;

      // Calculate available height for text
      const availableHeight = containerHeight - reserved;

      // Calculate maximum number of lines that fit
      let calculatedLines = Math.floor(availableHeight / actualLineHeight);
      
      // Apply safety margin
      calculatedLines = Math.max(minLines, calculatedLines - safetyMargin);
      
      // Apply max lines constraint if provided
      if (maxLines !== undefined) {
        calculatedLines = Math.min(maxLines, calculatedLines);
      }

      setLineClamp(calculatedLines);
    };

    // Initial calculation
    calculateLineClamp();

    // Create ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateLineClamp();
    });

    // Observe container
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Recalculate on window resize (for vh units)
    window.addEventListener('resize', calculateLineClamp);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateLineClamp);
    };
  }, [containerRef, textRef, reservedHeight, safetyMargin, minLines, maxLines]);

  return lineClamp;
};
