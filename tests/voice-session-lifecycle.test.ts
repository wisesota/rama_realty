import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiLiveVoiceSession } from "@/lib/voice/gemini-live-session";
import { RecordedVoiceSession } from "@/lib/voice/recorded-voice-session";

class FakeAudioContext {
  state: AudioContextState = "running";
  sampleRate = 48_000;
  audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockImplementation(async () => {
    this.state = "closed";
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("voice session lifecycle", () => {
  it("aborts an in-flight Gemini token request when the session is disposed", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    }));

    const session = new GeminiLiveVoiceSession({
      onStatus: vi.fn(),
      onTranscript: vi.fn(),
      onAgentTranscript: vi.fn(),
      onFinalTranscript: vi.fn(),
      onToolResult: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    });
    const start = session.start({} as MediaStream, "Aoede");
    await vi.waitFor(() => expect(requestSignal).toBeDefined());

    await session.dispose();

    expect(requestSignal?.aborted).toBe(true);
    await expect(start).rejects.toMatchObject({ name: "AbortError" });
  });

  it("cannot resume recorded capture after disposal wins an audio-worklet race", async () => {
    let releaseModule!: () => void;
    const moduleReady = new Promise<void>((resolve) => {
      releaseModule = resolve;
    });
    const addModule = vi.fn(() => moduleReady);
    class DelayedAudioContext extends FakeAudioContext {
      audioWorklet = { addModule };
    }
    vi.stubGlobal("AudioContext", DelayedAudioContext);

    const session = new RecordedVoiceSession({ onLimit: vi.fn() });
    const start = session.start({} as MediaStream);
    await vi.waitFor(() => expect(addModule).toHaveBeenCalledOnce());
    const dispose = session.dispose();
    releaseModule();

    await dispose;
    await expect(start).rejects.toMatchObject({ name: "AbortError" });
  });
});
