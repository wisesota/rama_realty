"use client";

const maximumRecordingMs = 45_000;
const minimumSpeechRms = 0.008;

export type RecordedVoiceResult = {
  audio: Blob;
  durationMs: number;
  hasSpeech: boolean;
};

type RecordedVoiceSessionOptions = {
  onLimit: () => void;
};

function encodeWave(chunks: Float32Array[], sampleRate: number, frameCount: number) {
  const bytesPerSample = 2;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + frameCount * bytesPerSample);
  const view = new DataView(buffer);

  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, frameCount * bytesPerSample, true);

  let byteOffset = headerSize;
  for (const chunk of chunks) {
    for (let index = 0; index < chunk.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[index]));
      view.setInt16(
        byteOffset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      byteOffset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export class RecordedVoiceSession {
  private readonly options: RecordedVoiceSessionOptions;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private silentGain: GainNode | null = null;
  private chunks: Float32Array[] = [];
  private frameCount = 0;
  private speechFrameCount = 0;
  private startedAt = 0;
  private limitTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(options: RecordedVoiceSessionOptions) {
    this.options = options;
  }

  async start(stream: MediaStream) {
    this.assertActive();
    this.context = new AudioContext();
    await this.context.audioWorklet.addModule("/audio/pcm-processor.js");
    this.assertActive();
    if (this.context.state === "suspended") await this.context.resume();
    this.assertActive();

    this.source = this.context.createMediaStreamSource(stream);
    this.worklet = new AudioWorkletNode(this.context, "rama-pcm-processor");
    this.silentGain = this.context.createGain();
    this.silentGain.gain.value = 0;
    this.worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (this.stopped) return;
      const chunk = event.data;
      this.chunks.push(chunk);
      this.frameCount += chunk.length;

      let energy = 0;
      for (let index = 0; index < chunk.length; index += 1) {
        energy += chunk[index] * chunk[index];
      }
      if (Math.sqrt(energy / chunk.length) >= minimumSpeechRms) {
        this.speechFrameCount += chunk.length;
      }
    };

    this.source.connect(this.worklet);
    this.worklet.connect(this.silentGain);
    this.silentGain.connect(this.context.destination);
    this.startedAt = performance.now();
    this.limitTimer = setTimeout(this.options.onLimit, maximumRecordingMs);
  }

  async stop(): Promise<RecordedVoiceResult> {
    const sampleRate = this.context?.sampleRate ?? 48_000;
    const durationMs = this.startedAt ? performance.now() - this.startedAt : 0;
    await this.closeNodes();

    return {
      audio: encodeWave(this.chunks, sampleRate, this.frameCount),
      durationMs,
      hasSpeech: this.speechFrameCount >= sampleRate * 0.2,
    };
  }

  async dispose() {
    await this.closeNodes();
    this.chunks = [];
    this.frameCount = 0;
    this.speechFrameCount = 0;
  }

  private async closeNodes() {
    if (this.stopped) return;
    this.stopped = true;
    if (this.limitTimer) clearTimeout(this.limitTimer);
    this.limitTimer = null;
    this.worklet?.port.close();
    this.source?.disconnect();
    this.worklet?.disconnect();
    this.silentGain?.disconnect();
    this.source = null;
    this.worklet = null;
    this.silentGain = null;
    if (this.context && this.context.state !== "closed") await this.context.close();
    this.context = null;
  }

  private assertActive() {
    if (this.stopped) throw new DOMException("Recorded voice session was disposed.", "AbortError");
  }
}
