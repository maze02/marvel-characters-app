import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * Button component with multiple variants and sizes.
 * Follows WCAG 2.1 AA accessibility guidelines.
 */
const meta: Meta<typeof Button> = {
  title: 'Design System/Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual style of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button full width',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Primary button for main actions
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Secondary button for less prominent actions
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Ghost button for subtle actions
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Small button
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Medium button (default)
 */
export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

/**
 * Large button
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

/**
 * Button in loading state
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

/**
 * Disabled button
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
};

/**
 * All variants side by side
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

/**
 * All sizes side by side
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
