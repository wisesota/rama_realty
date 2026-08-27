import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { VoiceConversation } from "@/components/voice-conversation";
import { landingCopy } from "@/lib/i18n";

const meta = {
  title: "Rama/Voice Conversation",
  component: VoiceConversation,
  parameters: { layout: "centered" },
  args: {
    onStop: fn(),
    onClose: fn(),
    copy: landingCopy.ar.architecture.voice.panel,
  },
} satisfies Meta<typeof VoiceConversation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArabicComplete: Story = {
  args: {
    state: {
      phase: "complete",
      announcement: landingCopy.ar.architecture.voice.announcements.complete,
      transcript: "شقة بغرفتي نوم في دبي مارينا",
      agentTranscript: "تم إعداد موجز القرار للمراجعة.",
    },
  },
};
