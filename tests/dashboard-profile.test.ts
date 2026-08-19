import { describe, expect, it } from "vitest";
import {
  profileDisplayName,
  profileInitials,
  safeExternalAvatarUrl,
} from "@/lib/dashboard/profile";

describe("dashboard profile presentation", () => {
  it("prefers the stored full name for identity", () => {
    expect(profileDisplayName("Rama Administrator", "admin@ramarealty.app")).toBe("Rama Administrator");
    expect(profileInitials("Rama Administrator", "admin@ramarealty.app")).toBe("RA");
  });

  it("creates a readable fallback from email without exposing the full address", () => {
    expect(profileDisplayName(null, "inventory.manager@ramarealty.app")).toBe("Inventory Manager");
    expect(profileInitials(null, "inventory.manager@ramarealty.app")).toBe("IM");
  });

  it("accepts only HTTPS external avatar URLs", () => {
    expect(safeExternalAvatarUrl("https://images.example.com/avatar.png")).toBe("https://images.example.com/avatar.png");
    expect(safeExternalAvatarUrl("http://images.example.com/avatar.png")).toBeNull();
    expect(safeExternalAvatarUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalAvatarUrl(null)).toBeNull();
  });
});
