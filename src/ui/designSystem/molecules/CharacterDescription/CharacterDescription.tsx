import React, { useState, useRef, useEffect } from "react";
import styles from "./CharacterDescription.module.scss";

interface CharacterDescriptionProps {
  description: string;
  characterName: string;
}

/**
 * CharacterDescription Component
 *
 * Displays character description with text truncation and expand/collapse functionality.
 */
export const CharacterDescription: React.FC<CharacterDescriptionProps> = ({
  description,
  characterName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Check if text is truncated
    const element = descriptionRef.current;
    if (element) {
      const isTruncated = element.scrollHeight > element.clientHeight;
      setShowButton(isTruncated);
    }
  }, [description]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.characterDescription}>
      <p
        ref={descriptionRef}
        className={`${styles.characterDescription__text} ${isExpanded ? styles["characterDescription__text--expanded"] : styles["characterDescription__text--collapsed"]}`}
      >
        {description}
      </p>
      {showButton && (
        <button
          type="button"
          onClick={toggleExpanded}
          className={styles.characterDescription__button}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded
              ? `Show less about ${characterName}`
              : `Read more about ${characterName}`
          }
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};
