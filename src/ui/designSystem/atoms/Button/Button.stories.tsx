import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

/**
 * Button component with multiple variants and sizes.
 * Features Marvel-style design with condensed font, uppercase text, and subtle lift animation.
 * Follows WCAG 2.1 AA accessibility guidelines.
 */
const meta: Meta<typeof Button> = {
  title: "Design System/Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost"],
      description: "Visual style of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the button",
    },
    loading: {
      control: "boolean",
      description: "Shows loading spinner",
    },
    fullWidth: {
      control: "boolean",
      description: "Makes button full width",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Primary button for main actions.
 * Features Marvel red background with condensed uppercase text and lift animation on hover.
 */
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

/**
 * Secondary button for less prominent actions.
 * Features light background with border and subtle hover effect.
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

/**
 * Ghost button for subtle, minimal actions.
 * Transparent background with text-only appearance.
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

/**
 * Small button
 */
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

/**
 * Medium button (default)
 */
export const Medium: Story = {
  args: {
    size: "md",
    children: "Medium Button",
  },
};

/**
 * Large button
 */
export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

/**
 * Button in loading state
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: "Loading...",
  },
};

/**
 * Disabled button
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: "Full Width Button",
  },
};

/**
 * All variants side by side for comparison.
 * Shows primary, secondary, and ghost button styles together.
 */
export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        padding: "1rem",
      }}
    >
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

/**
 * All sizes side by side for comparison.
 * Shows small, medium, and large button sizes with consistent styling.
 */
export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * Real-world example: Action buttons in a 404 page.
 * Shows how primary and secondary buttons work together in context.
 */
export const ActionButtons: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
      }}
    >
      <Button variant="primary" size="lg">
        Go to Home
      </Button>
      <Button variant="secondary" size="lg">
        Go Back
      </Button>
    </div>
  ),
};
