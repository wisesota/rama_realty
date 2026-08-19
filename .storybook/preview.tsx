import type { Preview } from '@storybook/react';
import React from 'react';
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import '../app/globals.css';

const customViewports = {
  mobile: {
    name: 'Mobile (iPhone 14/15)',
    styles: {
      width: '390px',
      height: '844px',
    },
  },
  tablet: {
    name: 'Tablet (iPad Mini)',
    styles: {
      width: '768px',
      height: '1024px',
    },
  },
  desktop: {
    name: 'Desktop (1280px)',
    styles: {
      width: '1280px',
      height: '800px',
    },
  },
  wide: {
    name: 'Wide Desktop (1440px)',
    styles: {
      width: '1440px',
      height: '900px',
    },
  },
};

const mockRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  push: () => {},
  replace: () => {},
  refresh: () => {},
  prefetch: () => Promise.resolve(),
  bfcacheId: '',
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppRouterContext.Provider value={mockRouter}>
        <Story />
      </AppRouterContext.Provider>
    ),
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: customViewports,
    },
    backgrounds: {
      default: 'gallery',
      values: [
        { name: 'gallery', value: '#fbfbf8' },
        { name: 'paper', value: '#ffffff' },
        { name: 'architecture', value: '#f0f1f1' },
        { name: 'dark', value: '#202321' },
      ],
    },
    chromatic: {
      viewports: [390, 768, 1280],
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
