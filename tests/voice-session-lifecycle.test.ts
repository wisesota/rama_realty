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
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("voice session lifecycle", () => {
  function callbacks() {
    return {
      onStatus: vi.fn(),
      onTranscript: vi.fn(),
      onAgentTranscript: vi.fn(),
      onFinalTranscript: vi.fn(),
      onToolResult: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
      onMetric: vi.fn(),
    };
  }

  it("aborts an in-flight Gemini token request when the session is disposed", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    }));

    const session = new GeminiLiveVoiceSession(callbacks());
    const start = session.start({} as MediaStream, "Aoede");
    await vi.waitFor(() => expect(requestSignal).toBeDefined());

    await session.dispose();

    expect(requestSignal?.aborted).toBe(true);
    await expect(start).rejects.toMatchObject({ name: "AbortError" });
  });

  it("keeps the token deadline active while the response body is being read", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeAudioContext);
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined;
      return Promise.resolve({
        ok: true,
        json: () => new Promise((_resolve, reject) => {
          requestSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
      } as Response);
    }));
    const handlers = callbacks();
    const session = new GeminiLiveVoiceSession(handlers, { tokenTimeoutMs: 25 });

    const start = session.start({} as MediaStream, "Aoede");
    const rejectedStart = expect(start).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(requestSignal).toBeDefined());
    await vi.advanceTimersByTimeAsync(25);

    await rejectedStart;
    expect(handlers.onMetric).toHaveBeenCalledWith(expect.objectContaining({
      stage: "token",
      outcome: "timeout",
    }));
  });

  it("closes a Gemini socket that resolves after the connection deadline", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      token: "ephemeral-token",
      model: "gemini-live-test",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      sessionResumptionEnabled: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    let resolveConnection!: (value: { close: () => void }) => void;
    const close = vi.fn();
    const connect = vi.fn(() => new Promise<{ close: () => void }>((resolve) => {
      resolveConnection = resolve;
    }));
    const handlers = callbacks();
    const session = new GeminiLiveVoiceSession(handlers, {
      connectTimeoutMs: 25,
      createClient: () => ({ live: { connect } } as never),
    });

    const start = session.start({} as MediaStream, "Kore");
    const rejectedStart = expect(start).rejects.toThrow("too long to connect");
    await vi.waitFor(() => expect(connect).toHaveBeenCalledOnce());
    await vi.advanceTimersByTimeAsync(25);
    await rejectedStart;

    resolveConnection({ close });
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
    expect(handlers.onMetric).toHaveBeenCalledWith(expect.objectContaining({
      stage: "socket",
      outcome: "timeout",
    }));
  });

  it("keeps an accepted Gemini socket open until the session is disposed", async () => {
    const close = vi.fn();
    const connect = vi.fn().mockResolvedValue({ close });
    const session = new GeminiLiveVoiceSession(callbacks(), {
      createClient: () => ({ live: { connect } } as never),
    });
    const internals = session as unknown as {
      token: string;
      model: string;
      voiceName: "Kore";
      connectSession: () => Promise<void>;
    };
    internals.token = "ephemeral-token";
    internals.model = "gemini-live-test";
    internals.voiceName = "Kore";

    await internals.connectSession();
    await Promise.resolve();

    expect(connect).toHaveBeenCalledOnce();
    expect(connect.mock.calls[0]?.[0]?.config).not.toHaveProperty("sessionResumption");
    expect(close).not.toHaveBeenCalled();
    await session.dispose();
    expect(close).toHaveBeenCalledOnce();
  });

  it("adds the resumption contract only after the server explicitly enables it", async () => {
    const close = vi.fn();
    const connect = vi.fn().mockResolvedValue({ close });
    const session = new GeminiLiveVoiceSession(callbacks(), {
      createClient: () => ({ live: { connect } } as never),
    });
    const internals = session as unknown as {
      token: string;
      model: string;
      voiceName: "Kore";
      sessionResumptionEnabled: boolean;
      connectSession: () => Promise<void>;
    };
    internals.token = "ephemeral-token";
    internals.model = "gemini-live-test";
    internals.voiceName = "Kore";
    internals.sessionResumptionEnabled = true;

    await internals.connectSession();

    expect(connect.mock.calls[0]?.[0]?.config).toHaveProperty("sessionResumption");
    await session.dispose();
  });

  it("closes a socket that resolves after an early SDK connection error", async () => {
    let rejectHandshake!: (event: { message: string }) => void;
    let resolveConnection!: (value: { close: () => void }) => void;
    const close = vi.fn();
    const connect = vi.fn((parameters: { callbacks: { onerror: (event: { message: string }) => void } }) => {
      rejectHandshake = parameters.callbacks.onerror;
      return new Promise<{ close: () => void }>((resolve) => {
        resolveConnection = resolve;
      });
    });
    const session = new GeminiLiveVoiceSession(callbacks(), {
      createClient: () => ({ live: { connect } } as never),
    });
    const internals = session as unknown as {
      token: string;
      model: string;
      voiceName: "Kore";
      connectSession: () => Promise<void>;
    };
    internals.token = "ephemeral-token";
    internals.model = "gemini-live-test";
    internals.voiceName = "Kore";

    const connection = internals.connectSession();
    await vi.waitFor(() => expect(connect).toHaveBeenCalledOnce());
    rejectHandshake({ message: "handshake rejected" });
    await expect(connection).rejects.toThrow("handshake rejected");

    resolveConnection({ close });
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
  });

  it("fails a completed input turn when no server event arrives by the deadline", async () => {
    vi.useFakeTimers();
    const handlers = callbacks();
    const close = vi.fn();
    const session = new GeminiLiveVoiceSession(handlers, {
      firstResponseTimeoutMs: 25,
      firstAudioTimeoutMs: 50,
    });
    const internals = session as unknown as {
      session: { sendRealtimeInput: (input: unknown) => void; close: () => void };
    };
    internals.session = { sendRealtimeInput: vi.fn(), close };

    await session.endInput();
    await vi.advanceTimersByTimeAsync(25);

    expect(handlers.onError).toHaveBeenCalledWith("Gemini Live did not respond in time.");
    expect(handlers.onMetric).toHaveBeenCalledWith(expect.objectContaining({
      stage: "first_server_event",
      outcome: "timeout",
    }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("counts successful reconnects across the session and fails after the second recovery", async () => {
    const close = vi.fn();
    const connect = vi.fn().mockResolvedValue({ close });
    const handlers = callbacks();
    const session = new GeminiLiveVoiceSession(handlers, {
      createClient: () => ({ live: { connect } } as never),
    });
    const internals = session as unknown as {
      token: string;
      model: string;
      voiceName: "Kore";
      resumptionHandle: string;
      reconnectAttempts: number;
      session: { close: () => void } | null;
      resumeOrFail: (message: string) => Promise<void>;
    };
    internals.token = "ephemeral-token";
    internals.model = "gemini-live-test";
    internals.voiceName = "Kore";
    internals.resumptionHandle = "resume-handle";
    internals.session = { close };

    await internals.resumeOrFail("closed once");
    expect(internals.reconnectAttempts).toBe(1);
    await internals.resumeOrFail("closed twice");
    expect(internals.reconnectAttempts).toBe(2);
    await internals.resumeOrFail("closed three times");

    expect(connect).toHaveBeenCalledTimes(2);
    expect(handlers.onMetric).toHaveBeenCalledWith(expect.objectContaining({
      stage: "reconnect",
      outcome: "success",
      reconnectCount: 2,
    }));
    expect(handlers.onError).toHaveBeenCalledWith("closed three times");
  });

  it("cancels a pending GoAway reconnect when a socket close recovers first", async () => {
    vi.useFakeTimers();
    const close = vi.fn();
    const connect = vi.fn().mockResolvedValue({ close });
    const session = new GeminiLiveVoiceSession(callbacks(), {
      createClient: () => ({ live: { connect } } as never),
    });
    const internals = session as unknown as {
      token: string;
      model: string;
      voiceName: "Kore";
      resumptionHandle: string;
      session: { close: () => void } | null;
      handleMessage: (message: { goAway: { timeLeft: string } }) => void;
      resumeOrFail: (message: string) => Promise<void>;
    };
    internals.token = "ephemeral-token";
    internals.model = "gemini-live-test";
    internals.voiceName = "Kore";
    internals.resumptionHandle = "resume-handle";
    internals.session = { close };

    internals.handleMessage({ goAway: { timeLeft: "3s" } });
    await internals.resumeOrFail("socket closed before GoAway deadline");
    expect(connect).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(2_000);

    expect(connect).toHaveBeenCalledOnce();
    await session.dispose();
  });

  it("records the first server event only for actionable turn content", async () => {
    let onmessage!: (message: unknown) => void;
    const close = vi.fn();
    const connect = vi.fn((parameters: { callbacks: { onmessage: (message: unknown) => void } }) => {
      onmessage = parameters.callbacks.onmessage;
      return Promise.resolve({ close });
    });
    const handlers = callbacks();
    const session = new GeminiLiveVoiceSession(handlers, {
      createClient: () => ({ live: { connect } } as never),
    });
    const internals = session as unknown as {
      token: string;
      model: string;
      voiceName: "Kore";
      sessionResumptionEnabled: boolean;
      inputEnded: boolean;
      turnStartedAt: number;
      connectSession: () => Promise<void>;
    };
    internals.token = "ephemeral-token";
    internals.model = "gemini-live-test";
    internals.voiceName = "Kore";
    internals.sessionResumptionEnabled = true;
    internals.inputEnded = true;
    internals.turnStartedAt = performance.now();
    await internals.connectSession();

    onmessage({ sessionResumptionUpdate: { resumable: true, newHandle: "handle" } });
    expect(handlers.onMetric).not.toHaveBeenCalledWith(expect.objectContaining({ stage: "first_server_event" }));

    onmessage({ serverContent: {} });
    expect(handlers.onMetric).toHaveBeenCalledWith(expect.objectContaining({
      stage: "first_server_event",
      outcome: "success",
    }));
    await session.dispose();
  });

  it("clears a pending GoAway timer when the completed turn closes intentionally", async () => {
    vi.useFakeTimers();
    const close = vi.fn();
    const handlers = callbacks();
    const session = new GeminiLiveVoiceSession(handlers);
    const internals = session as unknown as {
      inputEnded: boolean;
      firstAudioSeen: boolean;
      resumptionHandle: string;
      goAwayTimer: ReturnType<typeof setTimeout> | null;
      session: { close: () => void } | null;
      handleMessage: (message: {
        goAway?: { timeLeft: string };
        serverContent?: { turnComplete?: boolean };
      }) => void;
    };
    internals.inputEnded = true;
    internals.firstAudioSeen = true;
    internals.resumptionHandle = "resume-handle";
    internals.session = { close };

    internals.handleMessage({ goAway: { timeLeft: "3s" } });
    expect(internals.goAwayTimer).not.toBeNull();
    internals.handleMessage({ serverContent: { turnComplete: true } });

    expect(internals.goAwayTimer).toBeNull();
    expect(close).toHaveBeenCalledOnce();
    expect(handlers.onComplete).toHaveBeenCalledOnce();
  });

  it("fails a completed input turn that returns no audio", async () => {
    const close = vi.fn();
    const handlers = callbacks();
    const session = new GeminiLiveVoiceSession(handlers);
    const internals = session as unknown as {
      inputEnded: boolean;
      firstAudioSeen: boolean;
      session: { close: () => void } | null;
      handleMessage: (message: { serverContent: { turnComplete: boolean } }) => void;
    };
    internals.inputEnded = true;
    internals.firstAudioSeen = false;
    internals.session = { close };

    internals.handleMessage({ serverContent: { turnComplete: true } });

    expect(handlers.onError).toHaveBeenCalledWith("Gemini Live completed the turn without returning audio.");
    expect(handlers.onComplete).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(close).toHaveBeenCalledOnce());
  });

  it("bounds output audio activation when AudioContext.resume stalls", async () => {
    vi.useFakeTimers();
    const close = vi.fn().mockResolvedValue(undefined);
    class SuspendedAudioContext extends FakeAudioContext {
      state: AudioContextState = "suspended";
      resume = vi.fn(() => new Promise<void>(() => undefined));
      close = close;
    }
    vi.stubGlobal("AudioContext", SuspendedAudioContext);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const session = new GeminiLiveVoiceSession(callbacks(), { audioActivationTimeoutMs: 25 });

    const start = session.start({} as MediaStream, "Kore");
    const rejectedStart = expect(start).rejects.toThrow("Audio output activation took too long.");
    await vi.advanceTimersByTimeAsync(25);
    await rejectedStart;

    expect(fetchMock).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });

  it("bounds microphone worklet loading and closes the late audio context", async () => {
    vi.useFakeTimers();
    const close = vi.fn().mockResolvedValue(undefined);
    class StalledWorkletAudioContext extends FakeAudioContext {
      audioWorklet = { addModule: vi.fn(() => new Promise<void>(() => undefined)) };
      close = close;
    }
    vi.stubGlobal("AudioContext", StalledWorkletAudioContext);
    const session = new GeminiLiveVoiceSession(callbacks(), { audioActivationTimeoutMs: 25 });
    const internals = session as unknown as {
      startAudioCapture: (stream: MediaStream) => Promise<void>;
    };

    const capture = internals.startAudioCapture({} as MediaStream);
    const rejectedCapture = expect(capture).rejects.toThrow("Microphone audio processing took too long to initialize.");
    await vi.advanceTimersByTimeAsync(25);
    await rejectedCapture;

    expect(close).toHaveBeenCalledOnce();
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
