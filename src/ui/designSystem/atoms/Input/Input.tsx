import React, { forwardRef, useId } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

/**
 * Input Component
 * 
 * Accessible input field with label, error, and helper text support.
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Search"
 *   placeholder="Enter character name..."
 *   onChange={handleChange}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      icon,
      id,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const containerClasses = [
      styles.inputContainer,
      fullWidth && styles['inputContainer--fullWidth'],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      styles.input,
      error && styles['input--error'],
      icon && styles['input--with-icon'],
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ')}
            {...props}
          />
        </div>
        {error && (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
