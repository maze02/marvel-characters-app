import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SearchBar } from "./SearchBar";

/**
 * SearchBar component for searching characters.
 * Features search icon and accessible input.
 */
const meta: Meta<typeof SearchBar> = {
  title: "Design System/Molecules/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "Current search value",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

// Wrapper components for stories with state
const StatefulSearchBar: React.FC<{
  value: string;
  placeholder?: string;
}> = (args) => {
  const [value, setValue] = useState(args.value);
  return <SearchBar {...args} value={value} onChange={setValue} />;
};

const InteractiveExample: React.FC = () => {
  const [value, setValue] = useState("");
  return (
    <div>
      <SearchBar value={value} onChange={setValue} />
      <div style={{ marginTop: "1rem", color: "#666" }}>
        Current value: "{value}"
      </div>
    </div>
  );
};

/**
 * Default search bar
 */
export const Default: Story = {
  args: {
    value: "",
    placeholder: "SEARCH A CHARACTER...",
  },
  render: (args) => <StatefulSearchBar {...args} />,
};

/**
 * Search bar with value
 */
export const WithValue: Story = {
  args: {
    value: "Spider-Man",
    placeholder: "SEARCH A CHARACTER...",
  },
  render: (args) => <StatefulSearchBar {...args} />,
};

/**
 * Interactive search bar
 */
export const Interactive: Story = {
  render: () => <InteractiveExample />,
};
