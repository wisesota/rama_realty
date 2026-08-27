import type { Meta, StoryObj } from "@storybook/react";
import { SavedBriefControl } from "@/components/saved-brief-control";
import type { BuyerDecisionEnvelope } from "@/lib/agent/buyer-contracts";
import { sampleProperties } from "@/lib/sample-properties";

const envelope: BuyerDecisionEnvelope = {
  schemaVersion: "1",
  correlationId: "story-correlation",
  searchRunId: "story-run-current",
  conversationId: "story-conversation",
  status: "empty",
  brief: {
    original: "Two-bedroom apartment in Dubai Marina under AED 3M with a balcony",
    normalized: "Dubai Marina · AED 3M · 2 bedrooms · balcony",
    source: "text",
    criteria: [
      { key: "location", label: "Dubai Marina", value: "Dubai Marina", kind: "hard" },
      { key: "bedrooms", label: "2 bedrooms", value: "2", kind: "hard" },
      { key: "balcony", label: "Balcony", value: "Balcony", kind: "preference" },
    ],
  },
  entities: { properties: {} },
  blocks: [{ type: "no_results", title: "Story fixture", suggestions: [] }],
  sourceSummary: { publishedCount: 0, illustrativeCount: 0, staleCount: 0, label: "Story fixture" },
  suggestedActions: [{ id: "refine", label: "Refine one criterion" }],
};

const history = {
  authenticated: true,
  briefs: [
    {
      id: "saved-run-1",
      brief: "Two-bedroom apartment in Dubai Marina under AED 3M",
      criteria: ["Dubai Marina", "2 bedrooms", "Under AED 3M"],
      source: "text",
      resultIds: [sampleProperties[0].id, sampleProperties[1].id],
      createdAt: "2026-08-20T12:00:00.000Z",
    },
    {
      id: "saved-run-2",
      brief: "Quieter waterfront home with a terrace",
      criteria: ["Waterfront", "Quieter setting", "Terrace"],
      source: "voice",
      resultIds: [sampleProperties[0].id, sampleProperties[2].id],
      createdAt: "2026-08-21T12:00:00.000Z",
    },
  ],
};

const meta: Meta<typeof SavedBriefControl> = {
  title: "Rama/SavedBriefControl",
  component: SavedBriefControl,
  tags: ["autodocs"],
  args: { envelope, locale: "en" },
  beforeEach: () => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url, window.location.origin);
      if (url.pathname === "/api/search-briefs" && request.method === "GET") {
        return Response.json(history);
      }
      if (url.pathname === "/api/search-briefs" && request.method === "POST") {
        return Response.json({ saved: true }, { status: 201 });
      }
      if (url.pathname === "/api/buyer-data" && request.method === "POST") {
        return Response.json({ verificationSent: true }, { status: 202 });
      }
      if (url.pathname === "/api/buyer-data" && request.method === "DELETE") {
        return Response.json({
          requestId: "story-deletion-request",
          applicationDataDeleted: true,
          authUserDeletionRequired: true,
          authUserDeleted: true,
          processorDeletionQueued: false,
          deleted: { savedBriefs: 2 },
          externalDeletionRequired: [],
          retainedExceptions: [{
            category: "privacy_request_audit",
            count: 1,
            reason: "Pseudonymized proof.",
            expiresAt: "2028-08-22T12:00:00.000Z",
          }],
        });
      }
      if (url.pathname === "/api/agent/tools" && request.method === "POST") {
        return Response.json({
          ok: true,
          tool: "compare_properties",
          correlationId: "story-comparison",
          summary: "Three illustrative residences are compared across the same governed fields.",
          blocks: [{
            type: "comparison",
            title: "Cross-run comparison",
            properties: sampleProperties.slice(0, 3),
          }],
        });
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  },
};

export default meta;
type Story = StoryObj<typeof SavedBriefControl>;

export const English: Story = {};

export const Arabic: Story = {
  args: { locale: "ar" },
  decorators: [(Story) => <div dir="rtl"><Story /></div>],
};
