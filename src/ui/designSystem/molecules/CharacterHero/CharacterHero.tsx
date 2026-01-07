import React, { useState, useRef, useEffect } from "react";
import { FavoriteButton } from "@ui/designSystem/molecules/FavoriteButton/FavoriteButton";
import { useAdaptiveLineClamp } from "@ui/hooks/useAdaptiveLineClamp";
import styles from "./CharacterHero.module.scss";

interface CharacterHeroProps {
  imageUrl: string;
  characterName: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  description?: string;
}

/**
 * CharacterHero Component
 *
 * Displays character image with overlay containing name, description, and favorite button.
 * Features a clipped triangle design on the bottom-right corner of the overlay.
 * Description can be expanded/collapsed with smooth animation.
 * Uses adaptive line clamping to fit description text within available space.
 *
 */
export const CharacterHero: React.FC<CharacterHeroProps> = ({
  imageUrl,
  characterName,
  isFavorite,
  onToggleFavorite,
  description,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const textBoxRef = useRef<HTMLDivElement>(null);

  // Calculate adaptive line clamp based on available space
  const lineClamp = useAdaptiveLineClamp({
    containerRef: textBoxRef,
    textRef: descriptionRef,
    // Reserve space for header, gaps, and padding
    // This calculation accounts for the layout elements
    reservedHeight: (_containerHeight) => {
      // Approximate calculation based on layout:
      // - Header height (name + favorite button): ~40-60px
      // - Gaps between elements: ~16-35px (varies by breakpoint)
      // - Padding: included in container measurement
      // - Toggle button: ~20px when visible
      const headerHeight = 60;
      const gapsAndButton = 50;
      return headerHeight + gapsAndButton;
    },
    safetyMargin: 1,
    minLines: 2,
    maxLines: 4, // Limit initial collapsed view to 5 lines maximum
  });

  useEffect(() => {
    // Only check for truncation when text is collapsed
    // When expanded, button should remain visible to allow collapsing
    if (isExpanded) return;

    // Check if text is truncated
    const element = descriptionRef.current;
    if (element && description) {
      const isTruncated = element.scrollHeight > element.clientHeight;
      setShowButton(isTruncated);
    }
  }, [description, lineClamp, isExpanded]); // Re-check when lineClamp or isExpanded changes

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.characterHero}>
      <div className={styles.characterHero__imageSection}>
        <img
          src={imageUrl}
          alt={characterName}
          className={styles.characterHero__image}
        />
      </div>
      <div
        ref={textBoxRef}
        className={`${styles.characterHero__textBox} ${isExpanded ? styles["characterHero__textBox--expanded"] : ""}`}
      >
        <div className={styles.characterHero__content}>
          <div className={styles.characterHero__header}>
            <h1 className={styles.characterHero__name}>{characterName}</h1>
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
              characterName={characterName}
              size="medium"
            />
          </div>
          {description && (
            <div className={styles.characterHero__descriptionWrapper}>
              <p
                ref={descriptionRef}
                style={{
                  WebkitLineClamp: isExpanded ? "unset" : lineClamp,
                }}
                className={`${styles.characterHero__description} ${isExpanded ? styles["characterHero__description--expanded"] : ""}`}
              >
                {description}
              </p>
              {showButton && (
                <button
                  type="button"
                  onClick={toggleExpanded}
                  className={styles.characterHero__button}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? `Hide ${characterName}'s description`
                      : `Read more about ${characterName}`
                  }
                  data-testid={
                    isExpanded
                      ? "collapse-description-button"
                      : "expand-description-button"
                  }
                >
                  {isExpanded ? "HIDE" : "READ MORE"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
