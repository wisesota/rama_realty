import { LockKeyhole } from "lucide-react";

export function ConsentHandoff({ eligible, title, body }: { eligible: boolean; title: string; body: string }) {
  return <section className="consent-handoff" data-eligible={eligible}><LockKeyhole aria-hidden="true" /><div><strong>{title}</strong><p>{body}</p></div></section>;
}

