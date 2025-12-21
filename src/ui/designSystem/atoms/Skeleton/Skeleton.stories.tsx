import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

/**
 * Skeleton loading component for content placeholders.
 */
const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
      description: 'Skeleton variant',
    },
    width: {
      control: 'text',
      description: 'Width of skeleton',
    },
    height: {
      control: 'text',
      description: 'Height of skeleton',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/**
 * Text skeleton
 */
export const Text: Story = {
  args: {
    variant: 'text',
    width: '200px',
  },
};

/**
 * Circular skeleton (for avatars)
 */
export const Circular: Story = {
  args: {
    variant: 'circular',
    width: '64px',
    height: '64px',
  },
};

/**
 * Rectangular skeleton
 */
export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: '300px',
    height: '200px',
  },
};

/**
 * Card skeleton example
 */
export const CardSkeleton: Story = {
  render: () => (
    <div style={{ width: '300px', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
      <Skeleton variant="rectangular" width="100%" height="200px" />
      <div style={{ marginTop: '1rem' }}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </div>
    </div>
  ),
};

/**
 * Profile skeleton example
 */
export const ProfileSkeleton: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Skeleton variant="circular" width="64px" height="64px" />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="150px" />
        <Skeleton variant="text" width="100px" />
      </div>
    </div>
  ),
};
