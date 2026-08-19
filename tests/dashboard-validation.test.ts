import { describe, expect, it } from "vitest";
import { canTransitionPublication, isAllowedPropertyImageUrl, isHttpUrl, readInteger, readText, slugify } from "@/lib/dashboard/validation";
import { rankDashboardCommands, type DashboardCommand } from "@/lib/dashboard/commands";
import { filterConversationRecords, selectVisibleConversation } from "@/lib/dashboard/filters";

describe("dashboard input boundary", () => {
  it("normalizes stable catalog slugs", () => {
    expect(slugify("  Résidence No. 7 — Dubai Marina ")).toBe("residence-no-7-dubai-marina");
  });

  it("accepts web media URLs and rejects executable protocols", () => {
    expect(isHttpUrl("https://cdn.example.com/floor-plan.png")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,test")).toBe(false);
  });

  it("allows only image hosts configured for the Next image optimizer", () => {
    expect(isAllowedPropertyImageUrl("https://images.unsplash.com/photo-1")).toBe(true);
    expect(isAllowedPropertyImageUrl("https://project.supabase.co/storage/v1/object/public/properties/one.jpg")).toBe(true);
    expect(isAllowedPropertyImageUrl("https://cdn.example.com/floor-plan.png")).toBe(false);
  });

  it("bounds form text and rejects non-integer catalog numbers", () => {
    const data = new FormData();
    data.set("name", "A very long property name");
    data.set("beds", "2.5");
    expect(readText(data, "name", 6)).toBe("A very");
    expect(readInteger(data, "beds")).toBeNull();
  });

  it("enforces the governed publication state machine", () => {
    expect(canTransitionPublication("draft", "in_review")).toBe(true);
    expect(canTransitionPublication("in_review", "published")).toBe(true);
    expect(canTransitionPublication("published", "archived")).toBe(true);
    expect(canTransitionPublication("archived", "draft")).toBe(true);
    expect(canTransitionPublication("draft", "published")).toBe(false);
    expect(canTransitionPublication("archived", "published")).toBe(false);
    expect(canTransitionPublication("unknown", "published")).toBe(false);
  });

  it("routes natural operational questions to a real filtered workspace", () => {
    const commands: DashboardCommand[] = [
      { id: "inventory", label: "Review inventory", detail: "All residences", href: "/dashboard/inventory", terms: "property catalog" },
      { id: "refresh", label: "Find listings needing a refresh", detail: "Stale sources", href: "/dashboard/inventory?health=attention", terms: "source refresh stale missing listings" },
      { id: "reply", label: "Find conversations needing a reply", detail: "New handoffs", href: "/dashboard/inquiries?view=needs_reply", terms: "buyer advisor reply conversation" },
    ];

    expect(rankDashboardCommands(commands, "Which listings need a source refresh?")[0]?.id).toBe("refresh");
    expect(rankDashboardCommands(commands, "Which buyer conversations need a reply?")[0]?.id).toBe("reply");
  });

  it("keeps the conversation dossier inside the active filtered queue", () => {
    const inquiries = [
      { id: "closed", full_name: "Closed Buyer", email: null, phone: null, status: "closed", property: { name: "Marina Home" } },
      { id: "new", full_name: "New Buyer", email: null, phone: null, status: "new", property: { name: "Palm Home" } },
    ];

    const visible = filterConversationRecords(inquiries, "", "needs_reply");
    expect(visible.map((inquiry) => inquiry.id)).toEqual(["new"]);
    expect(selectVisibleConversation(visible, "closed")?.id).toBe("new");
  });
});
