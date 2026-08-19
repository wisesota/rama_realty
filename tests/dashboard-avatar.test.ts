import { describe, expect, it } from "vitest";
import {
  avatarExtension,
  isAllowedAvatarType,
  maximumAvatarBytes,
} from "@/lib/dashboard/avatar";

describe("dashboard avatar validation", () => {
  it("accepts supported image signatures only when MIME and content agree", () => {
    expect(avatarExtension("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe("jpg");
    expect(avatarExtension("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(avatarExtension("image/webp", new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("webp");
  });

  it("rejects spoofed or unsupported image content", () => {
    expect(avatarExtension("image/png", new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
    expect(avatarExtension("image/svg+xml", new Uint8Array([0x3c, 0x73, 0x76, 0x67]))).toBeNull();
    expect(isAllowedAvatarType("image/svg+xml")).toBe(false);
  });

  it("keeps the application limit aligned with the private bucket", () => {
    expect(maximumAvatarBytes).toBe(2_097_152);
  });
});
