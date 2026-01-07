import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";

/**
 * Icon component for displaying SVG icons.
 */
const meta: Meta<typeof Icon> = {
  title: "Design System/Atoms/Icon",
  component: Icon,
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "select",
      options: ["heart", "heart-filled", "search"],
      description: "Icon name",
    },
    size: {
      control: "number",
      description: "Icon size in pixels",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/**
 * Heart icon (outline)
 */
export const Heart: Story = {
  args: {
    name: "heart",
    size: 24,
  },
};

/**
 * Heart icon (filled)
 */
export const HeartFilled: Story = {
  args: {
    name: "heart-filled",
    size: 24,
  },
};

/**
 * Search icon
 */
export const Search: Story = {
  args: {
    name: "search",
    size: 24,
  },
};

/**
 * Small icon
 */
export const SmallSize: Story = {
  args: {
    name: "heart",
    size: 16,
  },
};

/**
 * Large icon
 */
export const LargeSize: Story = {
  args: {
    name: "heart",
    size: 48,
  },
};

/**
 * All icons showcase
 */
export const AllIcons: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Icon name="heart" size={32} />
        <div style={{ marginTop: "0.5rem", fontSize: "12px" }}>heart</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <Icon name="heart-filled" size={32} />
        <div style={{ marginTop: "0.5rem", fontSize: "12px" }}>
          heart-filled
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <Icon name="search" size={32} />
        <div style={{ marginTop: "0.5rem", fontSize: "12px" }}>search</div>
      </div>
    </div>
  ),
};
