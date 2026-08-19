import type { Meta, StoryObj } from '@storybook/react';
import { VoiceSignal } from '@/components/voice-signal';

const meta: Meta<typeof VoiceSignal> = {
  title: 'Rama Features/VoiceSignal',
  component: VoiceSignal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VoiceSignal>;

export const Idle: Story = {
  args: {
    state: { phase: 'idle' },
    onPress: () => console.log('Voice signal clicked: idle'),
  },
};

export const Requesting: Story = {
  args: {
    state: { phase: 'requesting', announcement: 'Allow microphone access' },
    onPress: () => console.log('Voice signal clicked: requesting'),
  },
};

export const Listening: Story = {
  args: {
    state: { phase: 'listening', announcement: 'Listening', transcript: 'Looking for a penthouse on Palm Jumeirah' },
    onPress: () => console.log('Voice signal clicked: listening'),
  },
};

export const Thinking: Story = {
  args: {
    state: { phase: 'thinking', announcement: 'Thinking', transcript: 'Looking for a penthouse on Palm Jumeirah' },
    onPress: () => console.log('Voice signal clicked: thinking'),
  },
};

export const Speaking: Story = {
  args: {
    state: {
      phase: 'speaking',
      announcement: 'Speaking',
      transcript: 'Looking for a penthouse on Palm Jumeirah',
      agentTranscript: 'I found three off-market penthouses in Palm Jumeirah with private marina berths.',
    },
    onPress: () => console.log('Voice signal clicked: speaking'),
  },
};

export const ErrorState: Story = {
  args: {
    state: {
      phase: 'error',
      announcement: 'Voice unavailable',
      code: 'permission-denied',
    },
    onPress: () => console.log('Voice signal clicked: error'),
  },
};
