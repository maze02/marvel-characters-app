import React, { useRef, useEffect } from 'react';
import { Comic } from '@domain/character/entities/Comic';
import styles from './ComicsHorizontalScroll.module.scss';

interface ComicsHorizontalScrollProps {
  comics: Comic[];
  title?: string;
  showEmptyState?: boolean;
  loading?: boolean;
  /**
   * Whether there are more comics available to load
   */
  hasMore?: boolean;
  /**
   * Whether currently loading more comics
   */
  loadingMore?: boolean;
  /**
   * Callback to load more comics when scrolling to the end
   */
  onLoadMore?: () => void;
}

/**
 * Comics Horizontal Scroll Component
 * 
 * Displays comics in a horizontally scrollable layout with
 * responsive thumbnail sizes optimized for each breakpoint.
 * Includes a custom scroll indicator that's always visible.
 * 
 * @param comics - Array of Comic entities to display
 * @param title - Optional section title (defaults to "COMICS")
 */
export const ComicsHorizontalScroll: React.FC<ComicsHorizontalScrollProps> = ({ 
  comics, 
  title = 'COMICS',
  showEmptyState = false,
  loading = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const indicatorBarRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Infinite scroll detection
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !hasMore || !onLoadMore) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
      
      // Trigger load more when scrolled to 80% (configurable threshold)
      const LOAD_MORE_THRESHOLD = 0.8;
      
      if (scrollPercentage >= LOAD_MORE_THRESHOLD && !loadingMore) {
        onLoadMore();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  // Consolidated scrollbar and drag logic
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const indicatorBar = indicatorBarRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    
    if (!scrollContainer || !indicatorBar || !scrollIndicator) return;

    // ============================================================================
    // STATE: All state variables for the scrollbar and drag functionality
    // ============================================================================
    let isThumbDragging = false;
    let isContentDragging = false;
    let thumbDragStartX = 0;
    let thumbDragStartScroll = 0;
    let thumbDragStartPosition = 0;
    let cachedTrackWidth = 0;
    let cachedThumbWidth = 0;
    let cachedMaxScroll = 0;
    let cachedAvailableSpace = 0;
    
    let contentDragStartX = 0;
    let contentDragStartScroll = 0;
    let rafId: number | null = null;

    // ============================================================================
    // HELPER: Update thumb visual position based on scroll
    // ============================================================================
    const updateThumbPosition = () => {
      // Skip if user is dragging the thumb (we update it directly)
      if (isThumbDragging) return;
      
      const scrollLeft = scrollContainer.scrollLeft;
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      
      // Calculate visible percentage (thumb width)
      const visiblePercentage = (clientWidth / scrollWidth) * 100;
      
      // Calculate scroll position percentage
      const maxScroll = scrollWidth - clientWidth;
      const scrollPercentage = maxScroll > 0 ? (scrollLeft / maxScroll) : 0;
      
      // Calculate thumb position in pixels
      const trackWidth = scrollIndicator.offsetWidth;
      const thumbWidth = (visiblePercentage / 100) * trackWidth;
      const availableSpace = trackWidth - thumbWidth;
      const position = scrollPercentage * availableSpace;
      
      // Update thumb visual position
      indicatorBar.style.width = `${visiblePercentage}%`;
      indicatorBar.style.transform = `translateX(${position}px)`;
    };

    // ============================================================================
    // HANDLER: Thumb drag start
    // ============================================================================
    const handleThumbMouseDown = (e: MouseEvent) => {
      isThumbDragging = true;
      thumbDragStartX = e.clientX;
      thumbDragStartScroll = scrollContainer.scrollLeft;
      
      // Cache dimensions at drag start for consistent calculations
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      cachedMaxScroll = scrollWidth - clientWidth;
      cachedTrackWidth = scrollIndicator.offsetWidth;
      cachedThumbWidth = indicatorBar.offsetWidth;
      cachedAvailableSpace = cachedTrackWidth - cachedThumbWidth;
      
      // Calculate current thumb position in pixels
      const scrollPercentage = cachedMaxScroll > 0 ? thumbDragStartScroll / cachedMaxScroll : 0;
      thumbDragStartPosition = scrollPercentage * cachedAvailableSpace;
      
      e.preventDefault();
      e.stopPropagation();
    };

    // ============================================================================
    // HANDLER: Thumb drag move (with requestAnimationFrame for smooth updates)
    // ============================================================================
    const handleThumbMouseMove = (e: MouseEvent) => {
      if (!isThumbDragging) return;
      e.preventDefault();
      
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Schedule update on next frame for smooth 60fps updates
      rafId = requestAnimationFrame(() => {
        // Calculate mouse movement
        const deltaX = e.clientX - thumbDragStartX;
        
        // Move thumb 1:1 with mouse
        const newThumbPosition = thumbDragStartPosition + deltaX;
        const clampedThumbPosition = Math.max(0, Math.min(cachedAvailableSpace, newThumbPosition));
        
        // Update thumb visual position directly (instant feedback)
        indicatorBar.style.transform = `translateX(${clampedThumbPosition}px)`;
        
        // Calculate corresponding scroll position
        const thumbPercentage = cachedAvailableSpace > 0 ? clampedThumbPosition / cachedAvailableSpace : 0;
        const newScrollLeft = thumbPercentage * cachedMaxScroll;
        
        // Update scroll (but skip updateThumbPosition since we already updated it)
        scrollContainer.scrollLeft = newScrollLeft;
      });
    };

    // ============================================================================
    // HANDLER: Thumb drag end
    // ============================================================================
    const handleThumbMouseUp = () => {
      isThumbDragging = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // ============================================================================
    // HANDLER: Track click to jump
    // ============================================================================
    const handleTrackClick = (e: MouseEvent) => {
      const rect = scrollIndicator.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickPercentage = Math.max(0, Math.min(1, clickX / rect.width));
      
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      
      scrollContainer.scrollTo({
        left: maxScroll * clickPercentage,
        behavior: 'smooth'
      });
    };

    // ============================================================================
    // HANDLER: Content drag start
    // ============================================================================
    const handleContentMouseDown = (e: MouseEvent) => {
      isContentDragging = true;
      contentDragStartX = e.pageX - scrollContainer.offsetLeft;
      contentDragStartScroll = scrollContainer.scrollLeft;
      scrollContainer.style.scrollBehavior = 'auto';
    };

    // ============================================================================
    // HANDLER: Content drag move
    // ============================================================================
    const handleContentMouseMove = (e: MouseEvent) => {
      if (!isContentDragging) return;
      e.preventDefault();
      
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - contentDragStartX) * 2;
      scrollContainer.scrollLeft = contentDragStartScroll - walk;
    };

    // ============================================================================
    // HANDLER: Content drag end
    // ============================================================================
    const handleContentMouseUp = () => {
      isContentDragging = false;
      scrollContainer.style.scrollBehavior = 'smooth';
    };

    // ============================================================================
    // HANDLER: Prevent default drag behavior
    // ============================================================================
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ============================================================================
    // SETUP: Attach all event listeners
    // ============================================================================
    
    // Initial thumb position update
    updateThumbPosition();
    
    // Scroll events
    scrollContainer.addEventListener('scroll', updateThumbPosition);
    window.addEventListener('resize', updateThumbPosition);
    
    // Thumb drag events
    indicatorBar.addEventListener('mousedown', handleThumbMouseDown);
    document.addEventListener('mousemove', handleThumbMouseMove);
    document.addEventListener('mouseup', handleThumbMouseUp);
    
    // Track click event
    scrollIndicator.addEventListener('click', handleTrackClick);
    
    // Content drag events
    scrollContainer.addEventListener('dragstart', handleDragStart);
    scrollContainer.addEventListener('mousedown', handleContentMouseDown);
    scrollContainer.addEventListener('mousemove', handleContentMouseMove);
    scrollContainer.addEventListener('mouseup', handleContentMouseUp);
    scrollContainer.addEventListener('mouseleave', handleContentMouseUp);

    // ============================================================================
    // CLEANUP: Remove all event listeners
    // ============================================================================
    return () => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Remove scroll events
      scrollContainer.removeEventListener('scroll', updateThumbPosition);
      window.removeEventListener('resize', updateThumbPosition);
      
      // Remove thumb drag events
      indicatorBar.removeEventListener('mousedown', handleThumbMouseDown);
      document.removeEventListener('mousemove', handleThumbMouseMove);
      document.removeEventListener('mouseup', handleThumbMouseUp);
      
      // Remove track click event
      scrollIndicator.removeEventListener('click', handleTrackClick);
      
      // Remove content drag events
      scrollContainer.removeEventListener('dragstart', handleDragStart);
      scrollContainer.removeEventListener('mousedown', handleContentMouseDown);
      scrollContainer.removeEventListener('mousemove', handleContentMouseMove);
      scrollContainer.removeEventListener('mouseup', handleContentMouseUp);
      scrollContainer.removeEventListener('mouseleave', handleContentMouseUp);
    };
  }, [comics]);

  // Handle loading state
  if (loading) {
    return (
      <section className={styles.comicsSection}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.emptyMessage}>Loading comics...</p>
      </section>
    );
  }

  // Handle empty state
  if (!comics || comics.length === 0) {
    if (!showEmptyState) {
      return null;
    }
    
    return (
      <section className={styles.comicsSection}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.emptyMessage}>No comics available for this character.</p>
      </section>
    );
  }

  return (
    <section className={styles.comicsSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.scrollWrapper}>
        <div className={styles.scrollContainer} ref={scrollContainerRef}>
          <div className={styles.comicsTrack}>
            {comics.map((comic) => (
              <article 
                key={comic.id} 
                className={styles.comicCard}
                data-testid="comic-item"
              >
                <picture className={styles.comicImageWrapper}>
                  {/* Desktop: Use portrait_xlarge for high-quality display */}
                  <source
                    media="(min-width: 1024px)"
                    srcSet={comic.getThumbnailUrl('portrait_xlarge')}
                  />
                  {/* Tablet: Use portrait_xlarge */}
                  <source
                    media="(min-width: 768px)"
                    srcSet={comic.getThumbnailUrl('portrait_xlarge')}
                  />
                {/* Mobile: Use portrait_xlarge (optimized for smaller screens) */}
                <img
                  src={comic.getThumbnailUrl('portrait_xlarge')}
                  alt={comic.title}
                  loading="lazy"
                  className={styles.comicImage}
                  draggable="false"
                />
                </picture>
                
                <div className={styles.comicInfo}>
                  <h3 className={styles.comicTitle}>{comic.title}</h3>
                  {comic.hasReleaseDate() && (
                    <time className={styles.comicDate}>
                      {comic.onSaleDate?.toDisplayString()}
                    </time>
                  )}
                </div>
              </article>
            ))}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className={styles.loadingMore} data-testid="loading-more">
                <div className={styles.loadingSpinner} aria-label="Loading more comics" />
              </div>
            )}
          </div>
        </div>
        {/* Custom scroll indicator - always visible and clickable */}
        <div 
          className={styles.scrollIndicator} 
          ref={scrollIndicatorRef}
          aria-hidden="true"
          role="scrollbar"
          aria-label="Scroll through comics"
        >
          <div 
            className={styles.scrollIndicatorBar} 
            ref={indicatorBarRef}
          />
        </div>
      </div>
    </section>
  );
};
