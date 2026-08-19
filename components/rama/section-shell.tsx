import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

type SectionShellProps<T extends ElementType = "div"> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export function SectionShell<T extends ElementType = "div">({
  as,
  className,
  ...props
}: SectionShellProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn("section-shell px-4 md:px-8 xl:px-10", className)}
      {...props}
    />
  );
}
