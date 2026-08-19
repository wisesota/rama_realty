import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { within, userEvent, expect } from '@storybook/test';

const meta: Meta<typeof Button> = {
  title: 'UI Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    isDisabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Explore Curated Residences',
    variant: 'default',
    size: 'default',
  },
};

export const Outline: Story = {
  args: {
    children: 'Schedule Private Consultation',
    variant: 'outline',
    size: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Refine Search Criteria',
    variant: 'secondary',
    size: 'default',
  },
};

export const WithIcon: Story = {
  render: () => (
    <Button variant="default" size="default">
      <Sparkles className="size-4" />
      <span>AI Decision Studio</span>
      <ArrowRight className="size-4" />
    </Button>
  ),
};

export const InteractiveStateTest: Story = {
  args: {
    children: 'Click to Verify',
    variant: 'default',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /click to verify/i });
    await expect(button).toBeInTheDocument();
    await userEvent.hover(button);
    await userEvent.click(button);
  },
};
