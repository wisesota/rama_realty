import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type MediaFrameProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "plain" | "muted";
};

export function MediaFrame({ className, tone = "plain", ...props }: MediaFrameProps) {
  return (
    <div
      data-slot="media-frame"
      data-tone={tone}
      className={cn("media-frame", className)}
      {...props}
    />
  );
}
