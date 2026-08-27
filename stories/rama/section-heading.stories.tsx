import type { Meta, StoryObj } from '@storybook/react';
import { SectionHeading } from '@/components/rama/section-heading';

const meta: Meta<typeof SectionHeading> = {
  title: 'Rama Primitives/SectionHeading',
  component: SectionHeading,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'center'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionHeading>;

export const StartAligned: Story = {
  args: {
    title: 'Keep evidence and open questions aligned for inspection.',
    description: 'Operational decision content follows the logical reading edge.',
    align: 'start',
  },
};

export const CenterAligned: Story = {
  args: {
    title: 'Say what matters.',
    description: 'Rama turns your voice into a clear Dubai home brief.',
    align: 'center',
  },
};
