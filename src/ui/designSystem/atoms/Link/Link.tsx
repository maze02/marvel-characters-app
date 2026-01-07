import React from "react";
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom";
import styles from "./Link.module.scss";

// =============================================================================
// Types
// =============================================================================

type LinkVariant = "primary" | "secondary";

interface BaseLinkProps {
  to: string;
  variant?: LinkVariant;
  children: React.ReactNode;
  className?: string;
}

// Internal link props (React Router)
interface InternalLinkProps
  extends
    BaseLinkProps,
    Omit<RouterLinkProps, "to" | "children" | "className"> {
  external?: false;
}

// External link props (native anchor)
interface ExternalLinkProps
  extends
    BaseLinkProps,
    Omit<
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
      "href" | "children" | "className"
    > {
  external: true;
}

export type LinkProps = InternalLinkProps | ExternalLinkProps;

// =============================================================================
// Component
// =============================================================================

/**
 * Link Component
 *
 * Accessible link component with animated underline effect.
 * Supports both internal (React Router) and external links.
 * Uses shared link mixins for consistent styling across the application.
 *
 * Features:
 * - Animated underline on hover
 * - Two variants: primary (red) and secondary (gray)
 * - Keyboard accessible with focus outline
 * - Automatic handling of internal vs external links
 *
 * @example
 * ```tsx
 * // Internal link (React Router)
 * <Link to="/characters">Browse Characters</Link>
 *
 * // External link (opens in new tab)
 * <Link to="https://marvel.com" external>Visit Marvel</Link>
 *
 * // Secondary variant
 * <Link to="/about" variant="secondary">About</Link>
 * ```
 */
export const Link: React.FC<LinkProps> = ({
  to,
  variant = "primary",
  external = false,
  className,
  children,
  ...restProps
}) => {
  // Build CSS class names
  const combinedClassName = [
    styles["link"],
    styles[`link--${variant}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // External links use native <a> tag with security attributes
  if (external) {
    return (
      <a
        href={to}
        className={combinedClassName}
        target="_blank"
        rel="noopener noreferrer"
        {...(restProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  // Internal links use React Router Link for SPA navigation
  return (
    <RouterLink to={to} className={combinedClassName} {...restProps}>
      {children}
    </RouterLink>
  );
};
