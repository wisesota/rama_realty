"use client";

import {
  EndSensitivity,
  GoogleGenAI,
  Modality,
  StartSensitivity,
  ThinkingLevel,
  type LiveServerMessage,
  type Session,
} from "@google/genai";
import {
  geminiLiveApiVersion,
  type GeminiLiveTokenError,
  type GeminiLiveTokenResponse,
  type GeminiVoiceName,
} from "@/lib/voice/gemini-live-contracts";
import {
  geminiLiveTools,
  isAgentToolResponse,
  type AgentToolResponse,
} from "@/lib/agent/contracts";

export type GeminiVoiceStatus = "connecting" | "listening" | "thinking" | "speaking";

export type GeminiLiveSessionCallbacks = {
  onStatus: (status: GeminiVoiceStatus) => void;
  onTranscript: (transcript: string) => void;
  onAgentTranscript: (transcript: string) => void;
  onFinalTranscript: (transcript: string) => void;
  onToolResult: (result: AgentToolResponse) => void;
  onError: (message: string) => void;
  onComplete: () => void;
  onMetric?: (metric: GeminiVoiceStageMetric) => void;
};

export type GeminiVoiceStage =
  | "token"
  | "socket"
  | "first_server_event"
  | "first_audio"
  | "tool"
  | "reconnect";

export type GeminiVoiceStageMetric = {
  stage: GeminiVoiceStage;
  durationMs: number;
  outcome: "success" | "timeout" | "error";
  reconnectCount?: 0 | 1 | 2;
};

type GeminiLiveClient = Pick<GoogleGenAI, "live">;

export type GeminiLiveSessionOptions = {
  tokenTimeoutMs?: number;
  connectTimeoutMs?: number;
  firstResponseTimeoutMs?: number;
  firstAudioTimeoutMs?: number;
  toolTimeoutMs?: number;
  audioActivationTimeoutMs?: number;
  createClient?: (token: string) => GeminiLiveClient;
};

const defaultSessionOptions = {
  tokenTimeoutMs: 12_000,
  connectTimeoutMs: 12_000,
  firstResponseTimeoutMs: 15_000,
  firstAudioTimeoutMs: 20_000,
  toolTimeoutMs: 12_000,
  audioActivationTimeoutMs: 8_000,
} as const;

function monotonicNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function durationToMilliseconds(value: string | undefined) {
  if (!value) return 0;
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)s$/);
  return match ? Number(match[1]) * 1_000 : 0;
}

async function withDeadline<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function isTokenResponse(value: unknown): value is GeminiLiveTokenResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GeminiLiveTokenResponse>;
  return (
    typeof candidate.token === "string" &&
    typeof candidate.model === "string" &&
    typeof candidate.expiresAt === "string" &&
    typeof candidate.sessionResumptionEnabled === "boolean"
  );
}

function mergeTranscript(current: string, incoming: string) {
  const next = incoming.trim();
  if (!next) return current;
  if (!current) return next;
  if (next.startsWith(current)) return next;
  if (current.endsWith(next)) return current;
  return `${current} ${next}`.replace(/\s+/g, " ").trim();
}

function floatToPcmBase64(samples: Float32Array) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  let binary = "";
  const batchSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += batchSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + batchSize));
  }
  return btoa(binary);
}

function describeClose(event: CloseEvent) {
  const reason = event.reason.trim();
  return reason
    ? `Gemini Live closed (${event.code}): ${reason}`
    : `Gemini Live closed unexpectedly (${event.code}).`;
}

class PcmAudioPlayer {
  private context: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  async prepare(timeoutMs: number) {
    if (!this.context) this.context = new AudioContext({ sampleRate: 24_000 });
    const context = this.context;
    try {
      if (context.state === "suspended") {
        await withDeadline(context.resume(), timeoutMs, "Audio output activation took too long.");
      }
    } catch (error) {
      if (this.context === context) this.context = null;
      if (context.state !== "closed") void context.close().catch(() => undefined);
      throw error;
    }
  }

  enqueue(base64Audio: string) {
    if (!this.context) return;

    // Keep a slow device or transient main-thread stall from accumulating an
    // ever-growing spoken-response queue. Prefer the newest answer audio.
    if (this.nextStartTime - this.context.currentTime > 8) this.interrupt();

    const binary = atob(base64Audio);
    const byteLength = binary.length - (binary.length % 2);
    const samples = new Float32Array(byteLength / 2);
    const bytes = new Uint8Array(byteLength);
    for (let index = 0; index < byteLength; index += 1) bytes[index] = binary.charCodeAt(index);

    const view = new DataView(bytes.buffer);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = view.getInt16(index * 2, true) / 0x8000;
    }

    const buffer = this.context.createBuffer(1, samples.length, 24_000);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);

    const startTime = Math.max(this.context.currentTime + 0.02, this.nextStartTime);
    this.nextStartTime = startTime + buffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
    source.start(startTime);
  }

  interrupt() {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // The source may already have ended between iteration and stop.
      }
    }
    this.sources.clear();
    this.nextStartTime = this.context?.currentTime ?? 0;
  }

  async close() {
    this.interrupt();
    if (this.context && this.context.state !== "closed") await this.context.close();
    this.context = null;
  }
}

export class GeminiLiveVoiceSession {
  private callbacks: GeminiLiveSessionCallbacks;
  private options: Required<Omit<GeminiLiveSessionOptions, "createClient">> &
    Pick<GeminiLiveSessionOptions, "createClient">;
  private session: Session | null = null;
  private inputContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private inputWorklet: AudioWorkletNode | null = null;
  private silentGain: GainNode | null = null;
  private inputStream: MediaStream | null = null;
  private player = new PcmAudioPlayer();
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private currentTranscript = "";
  private agentTranscript = "";
  private lastFinalTranscript = "";
  private intentionalClose = false;
  private inputEnded = false;
  private token = "";
  private model = "";
  private voiceName: GeminiVoiceName | null = null;
  private resumptionHandle = "";
  private sessionResumptionEnabled = false;
  private reconnectAttempts = 0;
  private reconnecting = false;
  private connectionGeneration = 0;
  private disposed = false;
  private startAbort: AbortController | null = null;
  private toolRequests = new Map<string, AbortController>();
  private responseTimer: ReturnType<typeof setTimeout> | null = null;
  private audioTimer: ReturnType<typeof setTimeout> | null = null;
  private goAwayTimer: ReturnType<typeof setTimeout> | null = null;
  private startedAt = 0;
  private turnStartedAt = 0;
  private firstServerEventSeen = false;
  private firstAudioSeen = false;

  constructor(callbacks: GeminiLiveSessionCallbacks, options: GeminiLiveSessionOptions = {}) {
    this.callbacks = callbacks;
    this.options = { ...defaultSessionOptions, ...options };
  }

  async start(stream: MediaStream, voiceName: GeminiVoiceName, initialContext?: string) {
    this.assertActive();
    this.startedAt = monotonicNow();
    this.inputStream = stream;
    this.callbacks.onStatus("connecting");
    await this.player.prepare(this.options.audioActivationTimeoutMs);
    this.assertActive();

    const controller = new AbortController();
    this.startAbort = controller;
    let timedOut = false;
    const tokenStartedAt = monotonicNow();
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.options.tokenTimeoutMs);

    let tokenResponse: Response;
    let tokenPayload: unknown;
    try {
      tokenResponse = await fetch("/api/voice/token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName }),
        cache: "no-store",
        signal: controller.signal,
      });
      // The deadline covers the complete response, not only receipt of headers.
      tokenPayload = await tokenResponse.json();
    } catch (error) {
      this.metric("token", tokenStartedAt, timedOut ? "timeout" : "error");
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (this.startAbort === controller) this.startAbort = null;
    }
    this.assertActive();

    if (!tokenResponse.ok) {
      this.metric("token", tokenStartedAt, "error");
      const message = (tokenPayload as Partial<GeminiLiveTokenError>).error;
      throw new Error(message || "Gemini Live could not create a session.");
    }
    if (!isTokenResponse(tokenPayload)) {
      this.metric("token", tokenStartedAt, "error");
      throw new Error("Gemini returned an invalid session token.");
    }
    this.metric("token", tokenStartedAt, "success");

    this.token = tokenPayload.token;
    this.model = tokenPayload.model;
    this.sessionResumptionEnabled = tokenPayload.sessionResumptionEnabled;
    this.voiceName = voiceName;
    await this.connectSession();
    this.assertActive();

    if (initialContext?.trim()) {
      this.session?.sendClientContent({
        turns: [{ role: "user", parts: [{ text: initialContext.trim() }] }],
        turnComplete: false,
      });
    }

    await this.startAudioCapture(stream);
    this.assertActive();
    this.callbacks.onStatus("listening");
    this.sessionTimer = setTimeout(
      () => this.fail("The eight-minute voice-session limit was reached."),
      8 * 60_000,
    );
  }

  async endInput() {
    if (this.disposed || this.inputEnded) return;
    this.inputEnded = true;
    await this.stopAudioCapture();
    this.session?.sendRealtimeInput({ audioStreamEnd: true });
    this.turnStartedAt = monotonicNow();
    this.firstServerEventSeen = false;
    this.firstAudioSeen = false;
    this.armFirstResponseWatchdog();
    this.armFirstAudioWatchdog();
    this.callbacks.onStatus("thinking");
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.intentionalClose = true;
    this.connectionGeneration += 1;
    this.startAbort?.abort();
    this.startAbort = null;
    for (const controller of this.toolRequests.values()) controller.abort();
    this.toolRequests.clear();
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    this.sessionTimer = null;
    this.clearResponseWatchdogs();
    if (this.goAwayTimer) clearTimeout(this.goAwayTimer);
    this.goAwayTimer = null;
    await this.stopAudioCapture();
    this.session?.close();
    this.session = null;
    await this.player.close();
  }

  private async connectSession() {
    this.assertActive();
    const generation = ++this.connectionGeneration;
    let configured = false;
    let rejectEarly!: (reason: Error) => void;
    const earlyFailure = new Promise<never>((_, reject) => {
      rejectEarly = reject;
    });
    let timedOut = false;
    const connectStartedAt = monotonicNow();
    const timeout = setTimeout(() => {
      timedOut = true;
      rejectEarly(new Error("Gemini Live took too long to connect."));
    }, this.options.connectTimeoutMs);
    const client = this.options.createClient?.(this.token) ?? new GoogleGenAI({
      apiKey: this.token,
      httpOptions: { apiVersion: geminiLiveApiVersion },
    });

    const connecting = client.live.connect({
      model: this.model,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voiceName ?? undefined } },
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            prefixPaddingMs: 120,
            silenceDurationMs: 700,
          },
        },
        ...(this.sessionResumptionEnabled
          ? { sessionResumption: this.resumptionHandle ? { handle: this.resumptionHandle } : {} }
          : {}),
        contextWindowCompression: {
          triggerTokens: "25000",
          slidingWindow: { targetTokens: "8000" },
        },
        tools: geminiLiveTools,
      },
      callbacks: {
        onmessage: (message) => {
          if (generation !== this.connectionGeneration) return;
          this.handleMessage(message);
        },
        onerror: (event) => {
          if (generation !== this.connectionGeneration) return;
          const error = new Error(event.message || "The Gemini voice connection encountered an error.");
          if (!configured) rejectEarly(error);
          else this.fail(error.message);
        },
        onclose: (event) => {
          if (generation !== this.connectionGeneration) return;
          this.session = null;
          const message = describeClose(event);
          if (!configured) rejectEarly(new Error(message));
          else if (!this.intentionalClose && !this.reconnecting) void this.resumeOrFail(message);
        },
      },
    });

    try {
      const session = await Promise.race([connecting, earlyFailure]);
      if (this.disposed || generation !== this.connectionGeneration) {
        session.close();
        throw new Error("Gemini Live connection was superseded.");
      }
      configured = true;
      this.session = session;
      this.metric("socket", connectStartedAt, "success");
    } catch (error) {
      // Promise.race cannot cancel the SDK handshake. Only after this attempt
      // has actually failed do we arrange to close a socket that resolves late.
      // Registering this before acceptance races the await continuation and can
      // close every healthy connection.
      void connecting.then((lateSession) => lateSession.close()).catch(() => undefined);
      this.metric("socket", connectStartedAt, timedOut ? "timeout" : "error");
      if (generation === this.connectionGeneration) this.connectionGeneration += 1;
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async resumeOrFail(closeMessage?: string) {
    if (
      this.intentionalClose ||
      this.reconnecting ||
      !this.resumptionHandle ||
      this.reconnectAttempts >= 2
    ) {
      this.fail(closeMessage || "The Gemini voice connection closed unexpectedly.");
      return;
    }

    if (this.goAwayTimer) clearTimeout(this.goAwayTimer);
    this.goAwayTimer = null;
    this.reconnecting = true;
    this.reconnectAttempts += 1;
    const reconnectStartedAt = monotonicNow();
    this.callbacks.onStatus("connecting");
    const previousSession = this.session;
    this.session = null;
    previousSession?.close();

    try {
      await this.connectSession();
      this.callbacks.onMetric?.({
        stage: "reconnect",
        durationMs: Math.max(0, monotonicNow() - reconnectStartedAt),
        outcome: "success",
        reconnectCount: this.reconnectAttempts as 1 | 2,
      });
      this.callbacks.onStatus(this.inputEnded ? "thinking" : "listening");
    } catch {
      this.callbacks.onMetric?.({
        stage: "reconnect",
        durationMs: Math.max(0, monotonicNow() - reconnectStartedAt),
        outcome: "error",
        reconnectCount: this.reconnectAttempts as 1 | 2,
      });
      this.reconnecting = false;
      await this.resumeOrFail(closeMessage);
      return;
    }
    this.reconnecting = false;
  }

  private async startAudioCapture(stream: MediaStream) {
    this.assertActive();
    const context = new AudioContext();
    this.inputContext = context;
    try {
      await withDeadline(
        context.audioWorklet.addModule("/audio/pcm-processor.js"),
        this.options.audioActivationTimeoutMs,
        "Microphone audio processing took too long to initialize.",
      );
      this.assertActive();
      if (context.state === "suspended") {
        await withDeadline(
          context.resume(),
          this.options.audioActivationTimeoutMs,
          "Microphone audio activation took too long.",
        );
      }
      this.assertActive();
    } catch (error) {
      if (this.inputContext === context) this.inputContext = null;
      if (context.state !== "closed") void context.close().catch(() => undefined);
      throw error;
    }

    this.inputSource = context.createMediaStreamSource(stream);
    this.inputWorklet = new AudioWorkletNode(context, "rama-pcm-processor", {
      processorOptions: { targetSampleRate: 16_000, chunkDurationMs: 80 },
    });
    this.silentGain = context.createGain();
    this.silentGain.gain.value = 0;
    this.inputWorklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (!this.session || this.inputEnded) return;
      this.session.sendRealtimeInput({
        audio: {
          data: floatToPcmBase64(event.data),
          mimeType: "audio/pcm;rate=16000",
        },
      });
    };

    this.inputSource.connect(this.inputWorklet);
    this.inputWorklet.connect(this.silentGain);
    this.silentGain.connect(context.destination);
  }

  private assertActive() {
    if (this.disposed) throw new DOMException("Gemini Live session was disposed.", "AbortError");
  }

  private async stopAudioCapture() {
    this.inputWorklet?.port.close();
    this.inputSource?.disconnect();
    this.inputWorklet?.disconnect();
    this.silentGain?.disconnect();
    this.inputSource = null;
    this.inputWorklet = null;
    this.silentGain = null;

    this.inputStream = null;
    if (this.inputContext && this.inputContext.state !== "closed") await this.inputContext.close();
    this.inputContext = null;
  }

  private handleMessage(message: LiveServerMessage) {
    const isTurnEvent = Boolean(message.serverContent || message.toolCall);
    if (isTurnEvent && this.inputEnded && !this.firstServerEventSeen) {
      this.firstServerEventSeen = true;
      this.metric("first_server_event", this.turnStartedAt, "success");
    }
    if (isTurnEvent && this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }
    const resumption = this.sessionResumptionEnabled ? message.sessionResumptionUpdate : undefined;
    if (resumption?.resumable && resumption.newHandle) {
      this.resumptionHandle = resumption.newHandle;
    }
    if (message.goAway && this.resumptionHandle && !this.reconnecting) {
      const remainingMs = durationToMilliseconds(message.goAway.timeLeft);
      const reconnectDelay = Math.max(0, remainingMs - 1_000);
      if (this.goAwayTimer) clearTimeout(this.goAwayTimer);
      this.goAwayTimer = setTimeout(() => {
        this.goAwayTimer = null;
        void this.resumeOrFail("Gemini Live requested a session reconnect.");
      }, reconnectDelay);
    }
    for (const id of message.toolCallCancellation?.ids ?? []) {
      this.toolRequests.get(id)?.abort();
      this.toolRequests.delete(id);
    }
    if (message.toolCall?.functionCalls?.length) {
      void this.handleToolCalls(message.toolCall.functionCalls);
    }

    const content = message.serverContent;
    if (!content) return;

    if (content.interrupted) {
      this.player.interrupt();
      this.agentTranscript = "";
      this.callbacks.onStatus(this.inputEnded ? "thinking" : "listening");
    }

    const inputText = content.inputTranscription?.text;
    // Gemini's v2 preview briefly exposed interim transcription separately.
    // Keep the runtime fallback while compiling against the PostHog-supported v1 SDK.
    const interimInput = (
      content as typeof content & {
        interimInputTranscription?: { text?: string };
      }
    ).interimInputTranscription?.text;
    if (inputText) {
      this.currentTranscript = mergeTranscript(this.currentTranscript, inputText);
      this.callbacks.onTranscript(this.currentTranscript);
      if (content.inputTranscription?.finished) this.finalizeTranscript();
    } else if (interimInput) {
      this.callbacks.onTranscript(
        mergeTranscript(this.currentTranscript, interimInput),
      );
    }

    if (content.outputTranscription?.text) {
      this.agentTranscript = mergeTranscript(
        this.agentTranscript,
        content.outputTranscription.text,
      );
      this.callbacks.onAgentTranscript(this.agentTranscript);
    }

    for (const part of content.modelTurn?.parts ?? []) {
      const audioData = part.inlineData?.data;
      if (!audioData) continue;
      if (!this.firstAudioSeen) {
        this.firstAudioSeen = true;
        if (this.audioTimer) clearTimeout(this.audioTimer);
        this.audioTimer = null;
        this.metric("first_audio", this.turnStartedAt || this.startedAt, "success");
      }
      this.callbacks.onStatus("speaking");
      this.player.enqueue(audioData);
    }

    if (content.generationComplete && !this.firstAudioSeen && this.inputEnded) {
      this.armFirstAudioWatchdog();
    }

    if (content.turnComplete) {
      if (this.inputEnded && !this.firstAudioSeen) {
        this.fail("Gemini Live completed the turn without returning audio.");
        return;
      }
      this.clearResponseWatchdogs();
      this.finalizeTranscript();
      this.agentTranscript = "";
      if (this.inputEnded) {
        this.intentionalClose = true;
        if (this.goAwayTimer) clearTimeout(this.goAwayTimer);
        this.goAwayTimer = null;
        this.session?.close();
        this.callbacks.onComplete();
      } else {
        this.callbacks.onStatus("listening");
      }
    } else if (content.waitingForInput && !this.inputEnded) {
      this.callbacks.onStatus("listening");
    }
  }

  private async handleToolCalls(
    functionCalls: NonNullable<NonNullable<LiveServerMessage["toolCall"]>["functionCalls"]>,
  ) {
    await Promise.all(functionCalls.map(async (call) => {
      const id = call.id || crypto.randomUUID();
      const name = call.name || "unknown_tool";
      const controller = new AbortController();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.options.toolTimeoutMs);
      const toolStartedAt = monotonicNow();
      this.toolRequests.set(id, controller);
      this.callbacks.onStatus("thinking");

      try {
        const response = await fetch("/api/agent/tools", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ tool: name, args: call.args ?? {} }),
          signal: controller.signal,
          cache: "no-store",
        });
        const payload: unknown = await response.json();
        if (!isAgentToolResponse(payload)) throw new Error("The property tool returned an invalid response.");
        this.callbacks.onToolResult(payload);
        this.session?.sendToolResponse({
          functionResponses: {
            id,
            name,
            response: payload.ok ? { output: payload } : { error: payload.error || payload.summary },
          },
        });
        this.metric("tool", toolStartedAt, response.ok && payload.ok ? "success" : "error");
        if (this.inputEnded && !this.firstAudioSeen) this.armFirstAudioWatchdog();
      } catch (error) {
        this.metric("tool", toolStartedAt, timedOut ? "timeout" : "error");
        if (controller.signal.aborted && !timedOut) return;
        this.session?.sendToolResponse({
          functionResponses: {
            id,
            name,
            response: {
              error: timedOut
                ? "The property tool timed out. Ask the buyer to retry or refine the request."
                : error instanceof Error
                  ? error.message
                  : "The property tool failed.",
            },
          },
        });
      } finally {
        clearTimeout(timeout);
        this.toolRequests.delete(id);
      }
    }));
  }

  private finalizeTranscript() {
    const transcript = this.currentTranscript.trim();
    if (transcript && transcript !== this.lastFinalTranscript) {
      this.lastFinalTranscript = transcript;
      this.callbacks.onFinalTranscript(transcript);
    }
    this.currentTranscript = "";
  }

  private armFirstResponseWatchdog() {
    if (this.responseTimer) clearTimeout(this.responseTimer);
    this.responseTimer = setTimeout(() => {
      this.responseTimer = null;
      this.metric("first_server_event", this.turnStartedAt, "timeout");
      this.fail("Gemini Live did not respond in time.");
    }, this.options.firstResponseTimeoutMs);
  }

  private armFirstAudioWatchdog() {
    if (this.firstAudioSeen || this.audioTimer) return;
    this.audioTimer = setTimeout(() => {
      this.audioTimer = null;
      this.metric("first_audio", this.turnStartedAt, "timeout");
      this.fail("Gemini Live did not return audio in time.");
    }, this.options.firstAudioTimeoutMs);
  }

  private clearResponseWatchdogs() {
    if (this.responseTimer) clearTimeout(this.responseTimer);
    if (this.audioTimer) clearTimeout(this.audioTimer);
    this.responseTimer = null;
    this.audioTimer = null;
  }

  private metric(
    stage: GeminiVoiceStage,
    startedAt: number,
    outcome: GeminiVoiceStageMetric["outcome"],
  ) {
    this.callbacks.onMetric?.({
      stage,
      durationMs: Math.max(0, monotonicNow() - startedAt),
      outcome,
    });
  }

  private fail(message: string) {
    if (this.intentionalClose) return;
    this.callbacks.onError(message);
    void this.dispose();
  }
}
