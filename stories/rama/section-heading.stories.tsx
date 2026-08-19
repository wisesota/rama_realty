import type { Meta, StoryObj } from '@storybook/react';
import { SectionHeading } from '@/components/rama/section-heading';

const meta: Meta<typeof SectionHeading> = {
  title: 'Rama Primitives/SectionHeading',
  component: SectionHeading,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['left', 'center'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionHeading>;

export const LeftAligned: Story = {
  args: {
    eyebrow: 'Private Catalog',
    title: 'Curated architectural residences across prime Dubai districts.',
    description: 'Each property is verified for title deeds, private amenities, and architectural provenance.',
    align: 'left',
  },
};

export const CenterAligned: Story = {
  args: {
    eyebrow: 'Client Methodology',
    title: 'Precision discovery through spoken intent and verified records.',
    description: 'Direct speech-to-speech interaction without intermediary forms or inaccurate MLS listings.',
    align: 'center',
  },
};
