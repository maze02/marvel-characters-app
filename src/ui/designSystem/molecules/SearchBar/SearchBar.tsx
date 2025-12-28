import React from "react";
import { Icon } from "../../atoms/Icon/Icon";
import styles from "./SearchBar.module.scss";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  testId?: string;
}

/**
 * SearchBar Component
 *
 * Search input matching Figma mockup with icon.
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="SEARCH A CHARACTER..."
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "SEARCH A CHARACTER...",
  ariaLabel = "Search Marvel characters",
  testId = "search-input",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.searchBar}>
      <Icon name="search" size={16} className={styles.searchBar__icon} />
      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        data-testid={testId}
        className={styles.searchBar__input}
      />
    </div>
  );
};
