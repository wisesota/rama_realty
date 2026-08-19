"use client";

import { useActionState } from "react";
import { signInWithPasswordAction } from "@/app/auth/actions";
import { initialActionState } from "@/lib/dashboard/validation";

type SignInFormProps = { nextPath: string };

export function SignInForm({ nextPath }: SignInFormProps) {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPasswordAction,
    initialActionState,
  );

  return (
    <div className="auth-panel">
      <form action={passwordAction}>
        <input type="hidden" name="next" value={nextPath} />
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {passwordState.message ? (
          <p
            className={`auth-message auth-message--${passwordState.status}`}
            role="status"
          >
            {passwordState.message}
          </p>
        ) : null}

        <button className="auth-submit" type="submit" disabled={passwordPending}>
          {passwordPending ? "Verifying…" : "Enter CRM"}
        </button>
      </form>
    </div>
  );
}
