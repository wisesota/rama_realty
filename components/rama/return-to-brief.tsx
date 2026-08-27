"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReturnToBrief({ label }: { label: string }) {
  function returnToBrief() {
    window.dispatchEvent(new CustomEvent("rama:open-discovery", { detail: { mode: "voice" } }));
  }

  return <Button size="lg" onPress={returnToBrief}>{label}<Mic aria-hidden="true" /></Button>;
}
