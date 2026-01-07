import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { Icon } from "../Icon/Icon";

/**
 * Input component
 */
const meta: Meta<typeof Input> = {
  title: "Design System/Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    error: {
      control: "text",
      description: "Shows error state with message",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input",
    },
    fullWidth: {
      control: "boolean",
      description: "Makes input full width",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

/**
 * Default input with Marvel styling
 */
export const Default: Story = {
  args: {
    placeholder: "ENTER TEXT...",
    fullWidth: true,
  },
};

/**
 * Input with value
 */
export const WithValue: Story = {
  args: {
    value: "Spider-Man",
    placeholder: "SEARCH CHARACTERS...",
    fullWidth: true,
  },
};

/**
 * Input with icon (similar to SearchBar but without search icon being mandatory)
 */
export const WithIcon: Story = {
  args: {
    placeholder: "SEARCH CHARACTERS...",
    icon: <Icon name="search" size={16} />,
    fullWidth: true,
  },
};

/**
 * Input with label
 */
export const WithLabel: Story = {
  args: {
    label: "Character Name",
    placeholder: "ENTER CHARACTER NAME...",
    fullWidth: true,
  },
};

/**
 * Input with helper text
 */
export const WithHelperText: Story = {
  args: {
    label: "Search",
    placeholder: "SEARCH CHARACTERS...",
    helperText: "Enter at least 3 characters to search",
    fullWidth: true,
  },
};

/**
 * Input with error state
 */
export const WithError: Story = {
  args: {
    label: "Character Name",
    error: "This field is required",
    value: "",
    placeholder: "SEARCH CHARACTERS...",
    fullWidth: true,
  },
};

/**
 * Disabled input
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Disabled input",
    fullWidth: true,
  },
};

/**
 * Input with type variations
 */
export const TypeEmail: Story = {
  args: {
    type: "email",
    placeholder: "EMAIL@EXAMPLE.COM",
    label: "Email",
    fullWidth: true,
  },
};

export const TypePassword: Story = {
  args: {
    type: "password",
    placeholder: "ENTER PASSWORD...",
    label: "Password",
    fullWidth: true,
  },
};
