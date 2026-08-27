import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(tsconfigPaths());
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      'motion/react',
      'next/dist/shared/lib/app-router-context.shared-runtime',
    ];
    
    config.server = config.server || {};
    config.server.watch = config.server.watch || {};
    
    const existingIgnored = config.server.watch.ignored;
    const wellKnownRegex = /[\/\\]\.well-known[\/\\]/;
    
    config.server.watch.ignored = existingIgnored
      ? Array.isArray(existingIgnored)
        ? [...existingIgnored, wellKnownRegex]
        : [existingIgnored, wellKnownRegex]
      : [wellKnownRegex];

    return config;
  },
};

export default config;
