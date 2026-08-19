/* eslint-disable @next/next/no-img-element */
import type { Meta, StoryObj } from '@storybook/react';
import { MediaFrame } from '@/components/rama/media-frame';

const meta: Meta<typeof MediaFrame> = {
  title: 'Rama Primitives/MediaFrame',
  component: MediaFrame,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['plain', 'muted'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MediaFrame>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '400px', height: '260px' }}>
      <MediaFrame tone="plain" className="w-full h-full">
        <img
          src="/images/rama-hero-editorial-daylight.png"
          alt="Rama Editorial Residence"
          className="w-full h-full object-cover"
        />
      </MediaFrame>
    </div>
  ),
};

export const MutedTone: Story = {
  render: () => (
    <div style={{ width: '400px', height: '260px' }}>
      <MediaFrame tone="muted" className="w-full h-full flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-quiet">Architectural Blueprint</span>
      </MediaFrame>
    </div>
  ),
};
