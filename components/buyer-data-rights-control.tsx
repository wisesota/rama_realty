"use client";

import { useEffect, useState } from "react";
import {
  buyerDataDeletionConfirmation,
  isBuyerDataDeletionResult,
} from "@/lib/buyer-data-rights";
import { buyerDataRightsCopy, type PublicLocale } from "@/lib/i18n";

type BuyerDataRightsControlProps = {
  authenticated: boolean;
  locale: PublicLocale;
  onDeleted?: () => void;
};

type ApiError = { error?: unknown; applicationDataDeleted?: unknown; requestId?: unknown };

async function responseMessage(response: Response, fallback: string) {
  try {
    const body = await response.json() as ApiError;
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export function BuyerDataRightsControl({ authenticated, locale, onDeleted }: BuyerDataRightsControlProps) {
  const copy = buyerDataRightsCopy[locale];
  const [confirmation, setConfirmation] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [verification, setVerification] = useState<"idle" | "sending" | "sent" | "verified">("idle");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    const timeout = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const deletionStatus = url.searchParams.get("deletion");
      if (deletionStatus === "verified") {
        setVerification("verified");
        setStatus(copy.verificationComplete);
      } else if (deletionStatus === "verification-error") {
        setVerification("idle");
        setStatus(copy.verificationFailed);
      } else {
        return;
      }
      url.searchParams.delete("deletion");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [authenticated, copy.verificationComplete, copy.verificationFailed]);

  async function requestDeletionVerification() {
    setVerification("sending");
    setStatus(null);
    try {
      const current = new URL(window.location.href);
      current.searchParams.delete("deletion");
      const response = await fetch("/api/buyer-data", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          returnPath: `${current.pathname}${current.search}#saved-decisions`,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, copy.verificationFailed));
      setVerification("sent");
      setStatus(copy.verificationSent);
    } catch (error) {
      setVerification("idle");
      setStatus(error instanceof Error ? error.message : copy.verificationFailed);
    }
  }

  async function downloadExport() {
    setExporting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/buyer-data", {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(await responseMessage(response, copy.exportFailed));
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "rama-buyer-data.json";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus(copy.exportComplete);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.exportFailed);
    } finally {
      setExporting(false);
    }
  }

  async function deleteData() {
    if (confirmation !== buyerDataDeletionConfirmation) return;
    setDeleting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/buyer-data", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, copy.deleteFailed));
      const result: unknown = await response.json();
      if (!isBuyerDataDeletionResult(result)) throw new Error(copy.deleteFailed);
      const queued = result.externalDeletionRequired.length > 0 ? ` ${copy.queued}` : "";
      setDeleted(true);
      setConfirmation("");
      setStatus(`${copy.deleted}${queued}`);
      onDeleted?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="buyer-data-rights" aria-labelledby="buyer-data-rights-title">
      <div>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3 id="buyer-data-rights-title">{copy.title}</h3>
        <p>{authenticated ? copy.bodyAuthenticated : copy.bodyAnonymous}</p>
      </div>
      <button
        type="button"
        className="rama-button rama-button--secondary"
        onClick={downloadExport}
        disabled={exporting || deleting || deleted}
      >
        {exporting ? copy.exporting : copy.exportAction}
      </button>
      <details className="buyer-data-rights__danger">
        <summary>{copy.deleteTitle}</summary>
        <p>{authenticated ? copy.deleteAuthenticated : copy.deleteAnonymous}</p>
        {authenticated ? (
          <button
            type="button"
            className="rama-button rama-button--secondary"
            onClick={requestDeletionVerification}
            disabled={verification === "sending" || verification === "sent" || verification === "verified" || deleting || deleted}
          >
            {verification === "sending"
              ? copy.verificationSending
              : verification === "verified"
                ? copy.verificationComplete
                : copy.verificationAction}
          </button>
        ) : null}
        <label htmlFor="buyer-data-deletion-confirmation">{copy.confirmationLabel}</label>
        <input
          id="buyer-data-deletion-confirmation"
          type="text"
          value={confirmation}
          placeholder={copy.confirmationPlaceholder}
          autoComplete="off"
          spellCheck={false}
          disabled={deleting || deleted || (authenticated && verification !== "verified")}
          onChange={(event) => setConfirmation(event.target.value)}
        />
        <button
          type="button"
          className="buyer-data-rights__delete"
          onClick={deleteData}
          disabled={confirmation !== buyerDataDeletionConfirmation || deleting || deleted || (authenticated && verification !== "verified")}
        >
          {deleting ? copy.deleting : copy.deleteAction}
        </button>
      </details>
      {status ? <p className="buyer-data-rights__status" role="status" aria-live="polite">{status}</p> : null}
    </section>
  );
}
