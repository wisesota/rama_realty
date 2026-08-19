import type { LucideIcon } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action, marker: Marker }: { eyebrow: string; title: string; description: string; action?: React.ReactNode; marker?: LucideIcon }) {
  return <header className="ops-page-header"><div className="ops-page-title">{Marker ? <Marker aria-hidden="true" /> : null}<div><p>{eyebrow}</p><h1>{title}</h1></div></div><div className="ops-page-summary"><p>{description}</p>{action}</div></header>;
}

export function SectionHeader({ id, eyebrow, title, meta, action }: { id?: string; eyebrow: string; title: string; meta?: string; action?: React.ReactNode }) {
  return <header id={id} className="ops-section-header"><div><p>{eyebrow}</p><h2>{title}</h2>{meta ? <span>{meta}</span> : null}</div>{action}</header>;
}
