import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FavoriteButton } from './FavoriteButton';

/**
 * FavoriteButton component for toggling favorites.
 * Accessible button with heart icon.
 */
const meta: Meta<typeof FavoriteButton> = {
  title: 'Design System/Molecules/FavoriteButton',
  component: FavoriteButton,
  tags: ['autodocs'],
  argTypes: {
    isFavorite: {
      control: 'boolean',
      description: 'Whether item is favorited',
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
      description: 'Button size',
    },
    characterName: {
      control: 'text',
      description: 'Character name for aria-label',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FavoriteButton>;

/**
 * Not favorited state
 */
export const NotFavorited: Story = {
  args: {
    isFavorite: false,
    characterName: 'Spider-Man',
    size: 'medium',
  },
  render: (args) => {
    const [isFavorite, setIsFavorite] = useState(args.isFavorite);
    return (
      <FavoriteButton
        {...args}
        isFavorite={isFavorite}
        onToggle={() => setIsFavorite(!isFavorite)}
      />
    );
  },
};

/**
 * Favorited state
 */
export const Favorited: Story = {
  args: {
    isFavorite: true,
    characterName: 'Spider-Man',
    size: 'medium',
  },
  render: (args) => {
    const [isFavorite, setIsFavorite] = useState(args.isFavorite);
    return (
      <FavoriteButton
        {...args}
        isFavorite={isFavorite}
        onToggle={() => setIsFavorite(!isFavorite)}
      />
    );
  },
};

/**
 * Small size
 */
export const SmallSize: Story = {
  args: {
    isFavorite: false,
    characterName: 'Spider-Man',
    size: 'small',
  },
  render: (args) => {
    const [isFavorite, setIsFavorite] = useState(args.isFavorite);
    return (
      <FavoriteButton
        {...args}
        isFavorite={isFavorite}
        onToggle={() => setIsFavorite(!isFavorite)}
      />
    );
  },
};

/**
 * Interactive toggle example
 */
export const Interactive: Story = {
  render: () => {
    const [isFavorite, setIsFavorite] = useState(false);
    return (
      <div>
        <div style={{ padding: '2rem', background: '#f5f5f5', display: 'inline-block' }}>
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={() => setIsFavorite(!isFavorite)}
            characterName="Spider-Man"
          />
        </div>
        <div style={{ marginTop: '1rem', color: '#666' }}>
          Status: {isFavorite ? 'Favorited ❤️' : 'Not favorited'}
        </div>
      </div>
    );
  },
};

/**
 * Both sizes comparison
 */
export const SizeComparison: Story = {
  render: () => {
    const [smallFav, setSmallFav] = useState(false);
    const [mediumFav, setMediumFav] = useState(false);
    return (
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <FavoriteButton
            isFavorite={smallFav}
            onToggle={() => setSmallFav(!smallFav)}
            size="small"
          />
          <div style={{ marginTop: '0.5rem', fontSize: '12px' }}>Small</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <FavoriteButton
            isFavorite={mediumFav}
            onToggle={() => setMediumFav(!mediumFav)}
            size="medium"
          />
          <div style={{ marginTop: '0.5rem', fontSize: '12px' }}>Medium</div>
        </div>
      </div>
    );
  },
};
