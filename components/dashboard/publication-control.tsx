"use client";

import { useActionState } from "react";
import { changePublicationAction } from "@/app/dashboard/actions";
import { initialActionState } from "@/lib/dashboard/validation";

export function PublicationControl({ propertyId, status, canPublish }: { propertyId: string; status: string; canPublish: boolean }) {
  const [state, action, pending] = useActionState(changePublicationAction, initialActionState);
  const target = status === "published" ? "archived" : status === "in_review" ? "published" : status === "archived" ? "draft" : "in_review";
  const requiresPublisher = target === "published" || target === "archived";
  if (requiresPublisher && !canPublish) return <small>Awaiting editor</small>;
  return (
    <div className="publication-control">
      <form action={action}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="target" value={target} />
        <button type="submit" disabled={pending}>{pending ? "Updating…" : target === "in_review" ? "Send to review" : target === "published" ? "Publish" : target === "archived" ? "Archive" : "Restore draft"}</button>
      </form>
      {state.message ? <small data-status={state.status} role="status">{state.message}</small> : null}
    </div>
  );
}
