import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "start" | "center";
  measure?: "compact" | "standard" | "wide";
  id?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  measure = "standard",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("editorial-heading", `editorial-heading--${align}`, `editorial-heading--${measure}`, className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {description ? <p className="editorial-heading__description">{description}</p> : null}
    </div>
  );
}
