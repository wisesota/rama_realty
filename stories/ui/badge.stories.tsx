import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Sparkles } from 'lucide-react';

const meta: Meta<typeof Badge> = {
  title: 'UI Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Palm Jumeirah',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Off-Market Exclusive',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Verified Luxury Title',
    variant: 'outline',
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="outline">
        <ShieldCheck className="size-3" />
        <span>RERA Registered</span>
      </Badge>
      <Badge variant="secondary">
        <Sparkles className="size-3" />
        <span>AI Match 98%</span>
      </Badge>
    </div>
  ),
};
