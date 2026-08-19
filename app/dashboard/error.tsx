"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ops-dashboard-error">
      <ShieldAlert aria-hidden="true" />
      <p>Governed workspace unavailable</p>
      <h1>Rama could not load this dashboard view.</h1>
      <span>
        Your session may have expired, or a protected data request may have failed.
        No empty catalog or conversation state has been assumed.
        {error.digest ? ` (Error ID: ${error.digest})` : ""}
      </span>
      <button type="button" onClick={reset}>
        <RefreshCw aria-hidden="true" />Retry workspace
      </button>
      <Link href="/auth/sign-in?next=/dashboard">Return to administrator sign in</Link>
    </main>
  );
}
