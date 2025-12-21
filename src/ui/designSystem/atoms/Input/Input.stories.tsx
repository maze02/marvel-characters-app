import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

/**
 * Input component with various states and validation.
 */
const meta: Meta<typeof Input> = {
  title: 'Design System/Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'boolean',
      description: 'Shows error state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes input full width',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

/**
 * Default input
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

/**
 * Input with value
 */
export const WithValue: Story = {
  args: {
    value: 'Spider-Man',
    placeholder: 'Search characters...',
  },
};

/**
 * Input with error state
 */
export const WithError: Story = {
  args: {
    error: 'This field is required',
    value: 'Invalid input',
    placeholder: 'Search characters...',
  },
};

/**
 * Disabled input
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Disabled input',
  },
};

/**
 * Full width input
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    placeholder: 'Full width input...',
  },
};

/**
 * Input with type variations
 */
export const TypeEmail: Story = {
  args: {
    type: 'email',
    placeholder: 'email@example.com',
  },
};

export const TypePassword: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};
