import type { Meta, StoryObj } from '@storybook/react';
import { OpsCommandCenter } from '@/components/dashboard/ops-command-center';

const meta: Meta<typeof OpsCommandCenter> = {
  title: 'Dashboard/OpsCommandCenter',
  component: OpsCommandCenter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OpsCommandCenter>;

export const Open: Story = {
  args: {
    isOpen: true,
    onOpenChange: (open) => console.log('Command center open changed:', open),
  },
};
