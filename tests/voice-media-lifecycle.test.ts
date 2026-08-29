import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
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
    const onMetric = vi.fn();

    const request = requestMicrophoneStream({
      constraints: { audio: true },
      signal: new AbortController().signal,
      timeoutMs: 25,
      getUserMedia: () => pending,
      onMetric,
    });
    const rejectedRequest = expect(request).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(25);
    await rejectedRequest;
    expect(onMetric).toHaveBeenCalledWith(expect.objectContaining({
      stage: "microphone",
      outcome: "timeout",
    }));

    resolveStream(stream);
    await Promise.resolve();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("records successful and denied microphone acquisition without raw media data", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const successMetric = vi.fn();
    await expect(requestMicrophoneStream({
      constraints: { audio: true },
      signal: new AbortController().signal,
      getUserMedia: () => Promise.resolve(stream),
      onMetric: successMetric,
    })).resolves.toBe(stream);
    expect(successMetric).toHaveBeenCalledWith(expect.objectContaining({ stage: "microphone", outcome: "success" }));

    const deniedMetric = vi.fn();
    await expect(requestMicrophoneStream({
      constraints: { audio: true },
      signal: new AbortController().signal,
      getUserMedia: () => Promise.reject(new DOMException("Denied", "NotAllowedError")),
      onMetric: deniedMetric,
    })).rejects.toMatchObject({ name: "NotAllowedError" });
    expect(deniedMetric).toHaveBeenCalledWith(expect.objectContaining({ stage: "microphone", outcome: "denied" }));
  });

  it("routes Decision Room capture through the bounded microphone owner", () => {
    const source = readFileSync("components/decision-room-voice-composer.tsx", "utf8");
    expect(source).toContain("requestMicrophoneStream({");
    expect(source).toContain("requestAbortRef.current?.abort()");
    expect(source).not.toContain("navigator.mediaDevices.getUserMedia({");
  });

  it("stops a microphone stream when its owning attempt is cancelled", async () => {
    let resolveStream!: (stream: MediaStream) => void;
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const controller = new AbortController();
    const onMetric = vi.fn();
    const request = requestMicrophoneStream({
      constraints: { audio: true },
      signal: controller.signal,
      getUserMedia: () => new Promise((resolve) => { resolveStream = resolve; }),
      onMetric,
    });
    const rejectedRequest = expect(request).rejects.toMatchObject({ name: "AbortError" });

    controller.abort();
    await rejectedRequest;
    resolveStream(stream);
    await Promise.resolve();
    expect(stop).toHaveBeenCalledOnce();
    expect(onMetric).not.toHaveBeenCalled();
  });
});
