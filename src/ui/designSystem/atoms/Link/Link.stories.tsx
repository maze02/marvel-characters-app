import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router-dom";
import { Link } from "./Link";

/**
 * Link component with animated underline effect.
 * Supports both internal (React Router) and external links.
 */
const meta: Meta<typeof Link> = {
  title: "Design System/Atoms/Link",
  component: Link,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary"],
      description: "Visual style of the link",
    },
    external: {
      control: "boolean",
      description: "Whether the link is external (opens in new tab)",
    },
    to: {
      control: "text",
      description: "Link destination (path or URL)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

/**
 * Primary link (default) - Marvel red color with underline animation
 */
export const Primary: Story = {
  args: {
    to: "/characters",
    variant: "primary",
    children: "Browse All Characters",
  },
};

/**
 * Secondary link - Subtle gray color
 */
export const Secondary: Story = {
  args: {
    to: "/favorites",
    variant: "secondary",
    children: "View Your Favorites",
  },
};

/**
 * Internal navigation link (uses React Router)
 */
export const Internal: Story = {
  args: {
    to: "/characters/1011334",
    children: "View Character Details",
  },
};

/**
 * External link (opens in new tab)
 */
export const External: Story = {
  args: {
    to: "https://www.marvel.com",
    external: true,
    children: "Visit Marvel.com",
  },
};

/**
 * All link variants side by side
 */
export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        flexWrap: "wrap",
        padding: "1rem",
      }}
    >
      <Link to="/characters" variant="primary">
        Primary Link
      </Link>
      <Link to="/favorites" variant="secondary">
        Secondary Link
      </Link>
    </div>
  ),
};

/**
 * Links in a navigation context
 */
export const NavigationExample: Story = {
  render: () => (
    <nav
      style={{
        display: "flex",
        gap: "1.5rem",
        justifyContent: "center",
        padding: "2rem",
        borderTop: "1px solid #e0e0e0",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Link to="/">Home</Link>
      <Link to="/characters">Characters</Link>
      <Link to="/favorites">Favorites</Link>
      <Link to="https://marvel.com" external>
        Marvel.com
      </Link>
    </nav>
  ),
};
