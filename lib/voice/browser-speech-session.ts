"use client";

type BrowserSpeechAlternative = {
  transcript: string;
};

type BrowserSpeechResult = {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: BrowserSpeechAlternative;
};

type BrowserSpeechResultList = {
  readonly length: number;
  [index: number]: BrowserSpeechResult;
};

type BrowserSpeechResultEvent = Event & {
  readonly resultIndex: number;
  readonly results: BrowserSpeechResultList;
};

type BrowserSpeechErrorEvent = Event & {
  readonly error: string;
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechResultEvent) => void) | null;
  onerror: ((event: BrowserSpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

type BrowserSpeechSessionOptions = {
  onTranscript: (transcript: string) => void;
};

function joinTranscript(current: string, incoming: string) {
  return `${current} ${incoming}`.replace(/\s+/g, " ").trim();
}

export class BrowserSpeechSession {
  private readonly options: BrowserSpeechSessionOptions;
  private recognition: BrowserSpeechRecognition | null = null;
  private finalTranscript = "";
  private interimTranscript = "";
  private stopping = false;
  private stopped = false;
  private stopResolve: ((transcript: string) => void) | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;

  static isSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  constructor(options: BrowserSpeechSessionOptions) {
    this.options = options;
  }

  start() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return false;

    this.recognition = new Recognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = navigator.language || "en-US";
    this.recognition.maxAlternatives = 1;
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      this.finishStop();
    };
    this.recognition.onend = () => {
      if (this.stopping || this.stopped) {
        this.finishStop();
        return;
      }

      try {
        this.recognition?.start();
      } catch {
        this.finishStop();
      }
    };
    this.recognition.start();
    return true;
  }

  stop() {
    if (this.stopped || !this.recognition) {
      return Promise.resolve(this.finalTranscript.trim());
    }

    this.stopping = true;
    return new Promise<string>((resolve) => {
      this.stopResolve = resolve;
      this.stopTimer = setTimeout(() => this.finishStop(), 2_000);
      try {
        this.recognition?.stop();
      } catch {
        this.finishStop();
      }
    });
  }

  dispose() {
    this.stopping = true;
    this.stopped = true;
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    try {
      this.recognition?.abort();
    } catch {
      // The recognition service may already be closed.
    }
    this.recognition = null;
    this.stopResolve?.(this.finalTranscript.trim());
    this.stopResolve = null;
  }

  private handleResult(event: BrowserSpeechResultEvent) {
    let newFinal = "";
    let interim = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0]?.transcript?.trim() || "";
      if (!transcript) continue;
      if (result.isFinal) newFinal = joinTranscript(newFinal, transcript);
      else interim = joinTranscript(interim, transcript);
    }

    if (newFinal) this.finalTranscript = joinTranscript(this.finalTranscript, newFinal);
    this.interimTranscript = interim;
    this.options.onTranscript(
      joinTranscript(this.finalTranscript, this.interimTranscript).slice(0, 500),
    );
  }

  private finishStop() {
    if (this.stopped) return;
    this.stopped = true;
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    this.recognition = null;
    const transcript = joinTranscript(this.finalTranscript, this.interimTranscript).slice(0, 500);
    this.stopResolve?.(transcript);
    this.stopResolve = null;
  }
}
