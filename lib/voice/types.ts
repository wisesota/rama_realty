export type VoiceExperienceState =
  | { phase: "idle" }
  | { phase: "requesting"; announcement: string }
  | { phase: "connecting"; announcement: string }
  | {
      phase: "listening";
      announcement: string;
      transcript: string;
      mode?: "live" | "recorded";
    }
  | { phase: "thinking"; announcement: string; transcript: string }
  | {
      phase: "speaking";
      announcement: string;
      transcript: string;
      agentTranscript: string;
    }
  | {
      phase: "complete";
      announcement: string;
      transcript: string;
      agentTranscript?: string;
    }
  | {
      phase: "error";
      announcement: string;
      code: "permission-denied" | "unsupported" | "unavailable" | "connection-failed";
    };
