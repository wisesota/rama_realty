import { cn } from "@/lib/utils";

/** A one-pixel, direction-aware adaptation of Magic UI's Scroll Progress. */
export function ScrollProgress({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rama-scroll-progress", className)}
    />
  );
}
