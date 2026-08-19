import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  id?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("editorial-heading", `editorial-heading--${align}`, className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {description ? <p className="editorial-heading__description">{description}</p> : null}
    </div>
  );
}
