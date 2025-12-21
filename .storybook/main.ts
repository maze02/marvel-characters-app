import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/**/*.mdx'
  ],
  
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  
  docs: {
    autodocs: 'tag',
  },
  
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@domain': path.resolve(__dirname, '../src/domain'),
          '@application': path.resolve(__dirname, '../src/application'),
          '@infrastructure': path.resolve(__dirname, '../src/infrastructure'),
          '@ui': path.resolve(__dirname, '../src/ui'),
          '@config': path.resolve(__dirname, '../src/config'),
        },
      },
    });
  },
};

export default config;