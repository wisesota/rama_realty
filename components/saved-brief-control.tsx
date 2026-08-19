"use client";

import { Bookmark, LogOut, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useLandingStore } from "@/components/providers/landing-store-provider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SavedBriefControl() {
  const [emailOpen, setEmailOpen] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);
  const [signInSubmitting, setSignInSubmitting] = useState(false);
  const accountPhase = useLandingStore((state) => state.accountPhase);
  const accountStatus = useLandingStore((state) => state.accountStatus);
  const setAccountPhase = useLandingStore((state) => state.setAccountPhase);
  const setAccountStatus = useLandingStore((state) => state.setAccountStatus);
  const hydrateAccount = useLandingStore((state) => state.hydrateAccount);
  const saveCurrentBrief = useLandingStore((state) => state.saveCurrentBrief);

  async function requestSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signInSubmitting) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setAccountStatus("Enter a valid email address.");
      return;
    }

    setSignInSubmitting(true);
    setAccountStatus("Sending a secure sign-in link…");
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/#current-brief");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString() },
    });

    if (error) {
      setAccountPhase("error");
      setAccountStatus("The sign-in link could not be sent.");
      setSignInSubmitting(false);
      return;
    }

    setEmailOpen(false);
    setAccountPhase("link-sent");
    setAccountStatus("Check your email to finish signing in.");
    setSignInSubmitting(false);
  }

  async function signOut() {
    setAccountStatus("Signing out…");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
    } catch {
      setAccountStatus("Could not sign out. Please try again.");
      return;
    }
    await hydrateAccount();
  }

  async function saveBrief() {
    if (savingBrief) return;
    setSavingBrief(true);
    try {
      await saveCurrentBrief();
    } finally {
      setSavingBrief(false);
    }
  }

  return (
    <div className="saved-brief-control">
      <div className="saved-brief-control__actions">
        {accountPhase === "authenticated" ? (
          <>
            <Button
              size="sm"
              className="saved-brief-button"
              isDisabled={savingBrief}
              onPress={() => void saveBrief()}
            >
              <Bookmark aria-hidden="true" />
              {savingBrief ? "Saving…" : "Save brief"}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Sign out of saved searches"
              onPress={() => void signOut()}
            >
              <LogOut aria-hidden="true" />
            </Button>
          </>
        ) : accountPhase === "guest" && !emailOpen ? (
          <Button size="sm" variant="outline" onPress={() => setEmailOpen(true)}>
            <Bookmark aria-hidden="true" />
            Save this brief
          </Button>
        ) : accountPhase === "error" ? (
          <Button size="sm" variant="outline" onPress={() => void hydrateAccount()}>
            Retry saved searches
          </Button>
        ) : null}
      </div>

      {emailOpen ? (
        <form className="saved-brief-control__form" onSubmit={requestSignIn}>
          <label className="sr-only" htmlFor="saved-search-email">
            Email for a secure sign-in link
          </label>
          <Mail aria-hidden="true" />
          <input
            id="saved-search-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <Button size="sm" type="submit">
            Send link
          </Button>
        </form>
      ) : null}

      <p aria-live="polite">{accountStatus}</p>
    </div>
  );
}
