import React from 'react';
import { Icon } from '../../atoms/Icon/Icon';
import styles from './SearchBar.module.scss';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
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
  placeholder = 'SEARCH A CHARACTER...',
  ariaLabel = 'Search Marvel characters',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.searchBar}>
      <Icon name="search" size={16} className={styles.searchIcon} />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={styles.searchInput}
      />
    </div>
  );
};
