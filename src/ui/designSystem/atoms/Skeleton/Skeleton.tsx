import React from 'react';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Skeleton Component
 * 
 * Loading placeholder with shimmer animation.
 * Prevents layout shift during content loading.
 * 
 * @example
 * ```tsx
 * <Skeleton variant="rectangular" width="100%" height="200px" />
 * <Skeleton variant="text" width="80%" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
}) => {
  const classNames = [
    styles.skeleton,
    styles[`skeleton--${variant}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = {
    width,
    height,
  };

  return <div className={classNames} style={style} aria-busy="true" aria-live="polite" />;
};
