import React from "react";

export interface IconProps {
  name: "heart" | "heart-filled" | "search";
  size?: number | undefined;
  className?: string | undefined;
  "aria-hidden"?: boolean | undefined;
}

/**
 * Icon Component
 *
 * SVG icon library.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className = "",
  "aria-hidden": ariaHidden = true,
}) => {
  // Both hearts use 24:22 ratio from Heart icon.svg
  const heartHeight =
    name === "heart" || name === "heart-filled"
      ? Math.round(size * (22 / 24))
      : size;

  const icons = {
    heart: (
      <svg
        width={size}
        height={heartHeight}
        viewBox="0 0 24 22"
        fill="none"
        className={className}
        aria-hidden={ariaHidden}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 3.64162L6 0L0 3.64162V11.4451L12 21.6763L24 11.4451V3.64162L18 0L12 3.64162Z"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
      </svg>
    ),
    "heart-filled": (
      <svg
        width={size}
        height={heartHeight}
        viewBox="0 0 24 22"
        fill="none"
        className={className}
        aria-hidden={ariaHidden}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 3.64162L6 0L0 3.64162V11.4451L12 21.6763L24 11.4451V3.64162L18 0L12 3.64162Z"
          fill="currentColor"
        />
      </svg>
    ),
    search: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden={ariaHidden}
      >
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
        <path
          d="m21 21-4.35-4.35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  return icons[name] || null;
};
