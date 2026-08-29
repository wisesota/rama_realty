import { afterEach, describe, expect, it, vi } from "vitest";
import { requestMicrophoneStream } from "@/lib/voice/media-lifecycle";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("microphone attempt lifecycle", () => {
  it("times out a stalled browser prompt and stops a stream that resolves later", async () => {
    vi.useFakeTimers();
    let resolveStream!: (stream: MediaStream) => void;
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const pending = new Promise<MediaStream>((resolve) => {
      resolveStream = resolve;
    });

    const request = requestMicrophoneStream({
      constraints: { audio: true },
      signal: new AbortController().signal,
      timeoutMs: 25,
      getUserMedia: () => pending,
    });
    const rejectedRequest = expect(request).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(25);
    await rejectedRequest;

    resolveStream(stream);
    await Promise.resolve();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("stops a microphone stream when its owning attempt is cancelled", async () => {
    let resolveStream!: (stream: MediaStream) => void;
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const controller = new AbortController();
    const request = requestMicrophoneStream({
      constraints: { audio: true },
      signal: controller.signal,
      getUserMedia: () => new Promise((resolve) => { resolveStream = resolve; }),
    });
    const rejectedRequest = expect(request).rejects.toMatchObject({ name: "AbortError" });

    controller.abort();
    await rejectedRequest;
    resolveStream(stream);
    await Promise.resolve();
    expect(stop).toHaveBeenCalledOnce();
  });
});
