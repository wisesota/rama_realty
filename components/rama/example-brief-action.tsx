"use client";

import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExampleBriefAction({
  brief,
  label,
  title,
}: {
  brief: string;
  label: string;
  title: string;
}) {
  function choose() {
    window.dispatchEvent(new CustomEvent("rama:open-discovery", {
      detail: { mode: "text", brief },
    }));
  }

  return (
    <Button variant="ghost" aria-label={`${label}: ${title}`} onPress={choose}>
      {label}
      <ArrowDown aria-hidden="true" />
    </Button>
  );
}
