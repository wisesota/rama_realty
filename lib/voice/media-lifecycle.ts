"use client";

export type MicrophoneStageMetric = {
  stage: "permission";
  durationMs: number;
  outcome: "success" | "denied" | "timeout" | "error";
};

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function abortError(message: string) {
  return new DOMException(message, "AbortError");
}

export async function microphonePermissionIsDenied({
  signal,
  timeoutMs = 3_000,
  onMetric,
}: {
  signal: AbortSignal;
  timeoutMs?: number;
  onMetric?: (metric: MicrophoneStageMetric) => void;
}) {
  const startedAt = now();
  try {
    if (!navigator.permissions?.query) {
      onMetric?.({ stage: "permission", durationMs: now() - startedAt, outcome: "success" });
      return false;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let rejectPermission: ((reason: Error) => void) | undefined;
    const onAbort = () => rejectPermission?.(abortError("Microphone request was cancelled."));
    const permission = navigator.permissions.query({ name: "microphone" as PermissionName });
    const result = await Promise.race([
      permission,
      new Promise<never>((_, reject) => {
        rejectPermission = reject;
        timeout = setTimeout(() => reject(abortError("Microphone permission check timed out.")), timeoutMs);
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    ]).finally(() => {
      if (timeout) clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      rejectPermission = undefined;
    });
    if (signal.aborted) throw abortError("Microphone request was cancelled.");
    const denied = result.state === "denied";
    onMetric?.({
      stage: "permission",
      durationMs: now() - startedAt,
      outcome: denied ? "denied" : "success",
    });
    return denied;
  } catch (error) {
    if (signal.aborted) throw error;
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    onMetric?.({
      stage: "permission",
      durationMs: now() - startedAt,
      outcome: timedOut ? "timeout" : "error",
    });
    // Permissions API failures are not proof of denial. The browser's native
    // getUserMedia prompt remains the source of truth.
    return false;
  }
}

export async function requestMicrophoneStream({
  constraints,
  signal,
  timeoutMs = 12_000,
  getUserMedia = (value) => navigator.mediaDevices.getUserMedia(value),
}: {
  constraints: MediaStreamConstraints;
  signal: AbortSignal;
  timeoutMs?: number;
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
}) {
  let expired = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let rejectAttempt: ((reason: Error) => void) | undefined;
  const onAbort = () => {
    expired = true;
    rejectAttempt?.(abortError("Microphone request was cancelled."));
  };
  const pendingStream = getUserMedia(constraints);

  // getUserMedia has no AbortSignal. If the browser resolves after our attempt
  // ended, immediately stop the late tracks instead of leaking the microphone.
  void pendingStream.then((stream) => {
    if (expired || signal.aborted) stopMediaStream(stream);
  }).catch(() => undefined);

  try {
    const stream = await Promise.race([
      pendingStream,
      new Promise<never>((_, reject) => {
        rejectAttempt = reject;
        timeout = setTimeout(() => {
          expired = true;
          reject(abortError("Microphone access timed out."));
        }, timeoutMs);
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
    if (signal.aborted) {
      stopMediaStream(stream);
      throw abortError("Microphone request was cancelled.");
    }
    return stream;
  } finally {
    if (timeout) clearTimeout(timeout);
    signal.removeEventListener("abort", onAbort);
    rejectAttempt = undefined;
  }
}
