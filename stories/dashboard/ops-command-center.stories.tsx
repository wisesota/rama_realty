import type { Meta, StoryObj } from '@storybook/react';
import { OpsCommandCenter } from '@/components/dashboard/ops-command-center';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof OpsCommandCenter> = {
  title: 'Dashboard/OpsCommandCenter',
  component: OpsCommandCenter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OpsCommandCenter>;

function StatefulOpsCommandCenter({ initialOpen = true }: { initialOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="p-4">
      <Button variant="outline" onPress={() => setIsOpen(true)}>
        Open Command Center (Cmd+K)
      </Button>
      <OpsCommandCenter isOpen={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}

export const Open: Story = {
  render: () => <StatefulOpsCommandCenter initialOpen={true} />,
};

export const ClosedWithTrigger: Story = {
  render: () => <StatefulOpsCommandCenter initialOpen={false} />,
};
