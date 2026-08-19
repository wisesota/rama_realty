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
};

function isTokenResponse(value: unknown): value is GeminiLiveTokenResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GeminiLiveTokenResponse>;
  return (
    typeof candidate.token === "string" &&
    typeof candidate.model === "string" &&
    typeof candidate.expiresAt === "string"
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

  async prepare() {
    if (!this.context) this.context = new AudioContext({ sampleRate: 24_000 });
    if (this.context.state === "suspended") await this.context.resume();
  }

  enqueue(base64Audio: string) {
    if (!this.context) return;

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
  private reconnectAttempts = 0;
  private reconnecting = false;
  private connectionGeneration = 0;
  private toolRequests = new Map<string, AbortController>();

  constructor(callbacks: GeminiLiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  async start(stream: MediaStream, voiceName: GeminiVoiceName, initialContext?: string) {
    this.inputStream = stream;
    this.callbacks.onStatus("connecting");
    await this.player.prepare();

    const tokenResponse = await fetch("/api/voice/token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ voiceName }),
      cache: "no-store",
    });
    const tokenPayload: unknown = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const message = (tokenPayload as Partial<GeminiLiveTokenError>).error;
      throw new Error(message || "Gemini Live could not create a session.");
    }
    if (!isTokenResponse(tokenPayload)) throw new Error("Gemini returned an invalid session token.");

    this.token = tokenPayload.token;
    this.model = tokenPayload.model;
    this.voiceName = voiceName;
    await this.connectSession();

    if (initialContext?.trim()) {
      this.session?.sendClientContent({
        turns: [{ role: "user", parts: [{ text: initialContext.trim() }] }],
        turnComplete: false,
      });
    }

    await this.startAudioCapture(stream);
    this.callbacks.onStatus("listening");
    this.sessionTimer = setTimeout(
      () => this.fail("The eight-minute voice-session limit was reached."),
      8 * 60_000,
    );
  }

  async endInput() {
    if (this.inputEnded) return;
    this.inputEnded = true;
    await this.stopAudioCapture();
    this.session?.sendRealtimeInput({ audioStreamEnd: true });
    this.callbacks.onStatus("thinking");
  }

  async dispose() {
    this.intentionalClose = true;
    this.connectionGeneration += 1;
    for (const controller of this.toolRequests.values()) controller.abort();
    this.toolRequests.clear();
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    this.sessionTimer = null;
    await this.stopAudioCapture();
    this.session?.close();
    this.session = null;
    await this.player.close();
  }

  private async connectSession() {
    const generation = ++this.connectionGeneration;
    let configured = false;
    let rejectEarly!: (reason: Error) => void;
    const earlyFailure = new Promise<never>((_, reject) => {
      rejectEarly = reject;
    });
    const timeout = setTimeout(
      () => rejectEarly(new Error("Gemini Live took too long to connect.")),
      12_000,
    );
    const client = new GoogleGenAI({
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
        sessionResumption: this.resumptionHandle ? { handle: this.resumptionHandle } : {},
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
      if (generation !== this.connectionGeneration) {
        session.close();
        throw new Error("Gemini Live connection was superseded.");
      }
      configured = true;
      this.reconnectAttempts = 0;
      this.session = session;
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

    this.reconnecting = true;
    this.reconnectAttempts += 1;
    this.callbacks.onStatus("connecting");
    const previousSession = this.session;
    this.session = null;
    previousSession?.close();

    try {
      await this.connectSession();
      this.callbacks.onStatus(this.inputEnded ? "thinking" : "listening");
    } catch {
      this.reconnecting = false;
      await this.resumeOrFail(closeMessage);
      return;
    }
    this.reconnecting = false;
  }

  private async startAudioCapture(stream: MediaStream) {
    this.inputContext = new AudioContext();
    await this.inputContext.audioWorklet.addModule("/audio/pcm-processor.js");
    if (this.inputContext.state === "suspended") await this.inputContext.resume();

    this.inputSource = this.inputContext.createMediaStreamSource(stream);
    this.inputWorklet = new AudioWorkletNode(this.inputContext, "rama-pcm-processor", {
      processorOptions: { targetSampleRate: 16_000, chunkDurationMs: 80 },
    });
    this.silentGain = this.inputContext.createGain();
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
    this.silentGain.connect(this.inputContext.destination);
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
    const resumption = message.sessionResumptionUpdate;
    if (resumption?.resumable && resumption.newHandle) {
      this.resumptionHandle = resumption.newHandle;
    }
    if (message.goAway && this.resumptionHandle && !this.reconnecting) {
      void this.resumeOrFail("Gemini Live requested a session reconnect.");
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

    const finalInput = content.inputTranscription?.text;
    if (finalInput) {
      this.currentTranscript = mergeTranscript(this.currentTranscript, finalInput);
      this.callbacks.onTranscript(this.currentTranscript);
      if (content.inputTranscription?.finished) this.finalizeTranscript();
    } else if (content.interimInputTranscription?.text) {
      this.callbacks.onTranscript(
        mergeTranscript(this.currentTranscript, content.interimInputTranscription.text),
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
      this.callbacks.onStatus("speaking");
      this.player.enqueue(audioData);
    }

    if (content.turnComplete) {
      this.finalizeTranscript();
      this.agentTranscript = "";
      if (this.inputEnded) {
        this.intentionalClose = true;
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
      }, 12_000);
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
      } catch (error) {
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

  private fail(message: string) {
    if (this.intentionalClose) return;
    this.callbacks.onError(message);
    void this.dispose();
  }
}
