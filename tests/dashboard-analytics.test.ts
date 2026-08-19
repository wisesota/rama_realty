import { describe, expect, it } from "vitest";
import {
  calculateInquiryConversionRate,
  calculateShortlistRate,
  calculateVoiceEngagementRate,
} from "@/lib/posthog/metrics";

describe("Dashboard Analytics metric calculations", () => {
  it("calculates rates correctly with valid traffic figures", () => {
    const voiceRate = calculateVoiceEngagementRate(24, 120);
    expect(voiceRate).toBe("20.0");

    const shortlistRate = calculateShortlistRate(12, 120);
    expect(shortlistRate).toBe("10.0");

    const inquiryRate = calculateInquiryConversionRate(9, 45);
    expect(inquiryRate).toBe("20.0");
  });

  it("handles empty / zero-traffic fallbacks safely without dividing by zero", () => {
    expect(calculateVoiceEngagementRate(0, 0)).toBe("0.0");
    expect(calculateVoiceEngagementRate(10, 0)).toBe("0.0");
    expect(calculateVoiceEngagementRate(0, -5)).toBe("0.0");

    expect(calculateShortlistRate(0, 0)).toBe("0.0");
    expect(calculateShortlistRate(5, 0)).toBe("0.0");

    expect(calculateInquiryConversionRate(0, 0)).toBe("0.0");
    expect(calculateInquiryConversionRate(5, 0)).toBe("0.0");
    expect(calculateInquiryConversionRate(0, -10)).toBe("0.0");
  });
});
