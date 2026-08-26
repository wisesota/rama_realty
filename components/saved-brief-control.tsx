"use client";

import { Bookmark, GitCompareArrows, LoaderCircle, LogOut, Mail } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BuyerDataRightsControl } from "@/components/buyer-data-rights-control";
import { Button } from "@/components/ui/button";
import type { BuyerDecisionEnvelope } from "@/lib/agent/buyer-contracts";
import { isAgentToolResponse, type ComparisonBlock } from "@/lib/agent/contracts";
import { decisionHistoryCopy, type PublicLocale } from "@/lib/i18n";
import {
  comparisonPropertyIds,
  isSavedBriefHistoryResponse,
  type SavedBriefHistoryItem,
} from "@/lib/saved-briefs";

type AccountPhase = "checking" | "guest" | "authenticated" | "link-sent" | "error";

type SavedBriefControlProps = {
  envelope: BuyerDecisionEnvelope;
  locale: PublicLocale;
};

async function fetchSavedBriefHistory(signal?: AbortSignal) {
  const response = await fetch("/api/search-briefs", {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (response.status === 401) {
    return { authenticated: false, briefs: [] } as const;
  }
  const payload: unknown = await response.json();
  if (!response.ok || !isSavedBriefHistoryResponse(payload) || !payload.authenticated) {
    throw new Error("SavedBriefHistoryUnavailable");
  }
  return payload;
}

export function SavedBriefControl({ envelope, locale }: SavedBriefControlProps) {
  const copy = decisionHistoryCopy[locale];
  const [phase, setPhase] = useState<AccountPhase>("checking");
  const [briefs, setBriefs] = useState<SavedBriefHistoryItem[]>([]);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<ComparisonBlock | null>(null);
  const [comparisonStatus, setComparisonStatus] = useState("");
  const [signInSubmitting, setSignInSubmitting] = useState(false);
  const [status, setStatus] = useState<string>(copy.loading);
  const comparisonIds = useMemo(
    () => comparisonPropertyIds(briefs, selectedRunIds),
    [briefs, selectedRunIds],
  );

  const applyHistory = useCallback((payload: Awaited<ReturnType<typeof fetchSavedBriefHistory>>) => {
    if (!payload.authenticated) {
      setBriefs([]);
      setSelectedRunIds([]);
      setPhase("guest");
      setStatus("");
      return;
    }
    setBriefs(payload.briefs);
    setSelectedRunIds((current) => current.filter((id) => payload.briefs.some((brief) => brief.id === id)));
    setPhase("authenticated");
    setStatus("");
  }, []);

  const loadHistory = useCallback(async (signal?: AbortSignal) => {
    try {
      applyHistory(await fetchSavedBriefHistory(signal));
    } catch {
      if (signal?.aborted) return;
      setPhase("error");
      setStatus(copy.unavailable);
    }
  }, [applyHistory, copy.unavailable]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchSavedBriefHistory(controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) applyHistory(payload);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setPhase("error");
        setStatus(copy.unavailable);
      });
    return () => controller.abort();
  }, [applyHistory, copy.unavailable]);

  async function requestSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signInSubmitting) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus(copy.invalidEmail);
      return;
    }

    setSignInSubmitting(true);
    setStatus(copy.sendingLink);
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("purpose", "saved-brief");
    callback.searchParams.set("next", `${window.location.pathname}${window.location.search}#saved-decisions`);
    const { createClient } = await import("@/lib/supabase/client");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString() },
    });

    if (error) {
      setPhase("error");
      setStatus(copy.signInFailed);
      setSignInSubmitting(false);
      return;
    }

    setEmailOpen(false);
    setPhase("link-sent");
    setStatus(copy.checkEmail);
    setSignInSubmitting(false);
  }

  async function signOut() {
    setStatus(copy.loading);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      setBriefs([]);
      setSelectedRunIds([]);
      setPhase("guest");
      setStatus(copy.signedOut);
    } catch {
      setPhase("error");
      setStatus(copy.unavailable);
    }
  }

  async function saveCurrentBrief() {
    if (saving) return;
    setSaving(true);
    setStatus(copy.savingCurrent);
    try {
      const response = await fetch("/api/search-briefs", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: envelope.brief.original,
          criteria: envelope.brief.criteria.map((criterion) => criterion.label),
          source: envelope.brief.source ?? "text",
          resultIds: Object.keys(envelope.entities.properties),
        }),
      });
      if (response.status === 401) {
        setPhase("guest");
        throw new Error(copy.signIn);
      }
      if (!response.ok) throw new Error(copy.unavailable);
      await loadHistory();
      setStatus(copy.savedCurrent);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.unavailable);
    } finally {
      setSaving(false);
    }
  }

  function toggleRun(briefId: string) {
    setSelectedRunIds((current) => current.includes(briefId)
      ? current.filter((id) => id !== briefId)
      : current.length < 3 ? [...current, briefId] : current);
  }

  function retryHistory() {
    setPhase("checking");
    setStatus(copy.loading);
    void loadHistory();
  }

  async function compareRuns() {
    if (comparing || comparisonIds.length < 2) return;
    setComparing(true);
    setComparison(null);
    setComparisonStatus("");
    try {
      const response = await fetch("/api/agent/tools", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "compare_properties", args: { propertyIds: comparisonIds } }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isAgentToolResponse(payload)) throw new Error(copy.unavailable);
      const comparisonBlock = payload.blocks.find((block): block is ComparisonBlock => block.type === "comparison");
      if (!comparisonBlock) throw new Error(copy.unavailable);
      setComparison(comparisonBlock);
      setComparisonStatus(payload.summary);
    } catch (error) {
      setComparisonStatus(error instanceof Error ? error.message : copy.unavailable);
    } finally {
      setComparing(false);
    }
  }

  return (
    <section id="saved-decisions" className="saved-decisions" aria-labelledby="saved-decisions-title">
      <div className="saved-decisions__heading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="saved-decisions-title">{copy.title}</h2>
        </div>
        <p>{copy.body}</p>
      </div>

      {phase === "authenticated" ? (
        <>
          <div className="saved-decisions__actions">
            <Button size="sm" isDisabled={saving} onPress={() => void saveCurrentBrief()}>
              {saving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Bookmark aria-hidden="true" />}
              {saving ? copy.savingCurrent : copy.saveCurrent}
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label={copy.signOut} onPress={() => void signOut()}>
              <LogOut aria-hidden="true" />
            </Button>
          </div>

          {briefs.length ? (
            <div className="saved-decisions__history">
              <ol>
                {briefs.map((brief) => (
                  <li key={brief.id} data-selected={selectedRunIds.includes(brief.id)}>
                    <label>
                      <input
                        type="checkbox"
                        aria-label={`${copy.selectRun}: ${brief.brief}`}
                        checked={selectedRunIds.includes(brief.id)}
                        disabled={!selectedRunIds.includes(brief.id) && selectedRunIds.length >= 3}
                        onChange={() => toggleRun(brief.id)}
                      />
                      <span>
                        <strong>{brief.brief}</strong>
                        <small>
                          {brief.source === "voice" ? copy.sourceVoice : copy.sourceText}
                        </small>
                        <em>{brief.criteria.join(" · ")}</em>
                        <dl className="saved-decisions__metadata">
                          <div>
                            <dt>{copy.lastChange}</dt>
                            <dd><time dateTime={brief.createdAt}>{new Date(brief.createdAt).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE")}</time></dd>
                          </div>
                          <div>
                            <dt>{copy.unresolved}</dt>
                            <dd>{copy.unresolvedValue}</dd>
                          </div>
                          <div>
                            <dt>{copy.freshness}</dt>
                            <dd>{copy.freshnessValue}</dd>
                          </div>
                        </dl>
                      </span>
                    </label>
                  </li>
                ))}
              </ol>
              <div className="saved-decisions__compare">
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={selectedRunIds.length < 2 || comparisonIds.length < 2 || comparing}
                  onPress={() => void compareRuns()}
                >
                  {comparing ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <GitCompareArrows aria-hidden="true" />}
                  {copy.compare}
                </Button>
                <p>{copy.compareHint}</p>
              </div>
              {comparisonStatus ? <p className="saved-decisions__status" role="status">{comparisonStatus}</p> : null}
              {comparison ? (
                <article className="agent-block agent-block--comparison saved-decisions__comparison">
                  <GitCompareArrows aria-hidden="true" />
                  <div>
                    <span>{copy.compare}</span>
                    <h3>{comparison.title}</h3>
                    <div className="agent-compare-grid">
                      {comparison.properties.map((property) => (
                        <section key={property.id}>
                          <strong>{property.name}</strong>
                          <p>{property.price}</p>
                          <small>{property.beds} bed · {property.area}</small>
                        </section>
                      ))}
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
          ) : <p className="saved-decisions__empty">{copy.empty}</p>}
        </>
      ) : phase === "guest" || phase === "link-sent" ? (
        <div className="saved-decisions__guest">
          {phase === "guest" && !emailOpen ? (
            <Button variant="outline" size="sm" onPress={() => setEmailOpen(true)}>
              <Bookmark aria-hidden="true" />{copy.signIn}
            </Button>
          ) : null}
          {emailOpen ? (
            <form onSubmit={requestSignIn}>
              <label className="sr-only" htmlFor="saved-search-email">{copy.emailLabel}</label>
              <Mail aria-hidden="true" />
              <input id="saved-search-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder={copy.emailPlaceholder} required />
              <Button size="sm" type="submit" isDisabled={signInSubmitting}>{signInSubmitting ? copy.sendingLink : copy.sendLink}</Button>
            </form>
          ) : null}
        </div>
      ) : phase === "error" ? (
        <Button variant="outline" size="sm" onPress={retryHistory}>{copy.retry}</Button>
      ) : null}

      {status ? <p className="saved-decisions__status" role="status" aria-live="polite">{status}</p> : null}
      {phase !== "checking" ? (
        <BuyerDataRightsControl
          authenticated={phase === "authenticated"}
          locale={locale}
          onDeleted={() => {
            setBriefs([]);
            setSelectedRunIds([]);
            setComparison(null);
            setPhase("guest");
            setStatus("");
          }}
        />
      ) : null}
    </section>
  );
}
