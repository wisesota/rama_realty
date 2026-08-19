"use client";

import { Plus, X } from "lucide-react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { useCallback, useState } from "react";
import { InventoryCreateForm } from "@/components/dashboard/inventory-create-form";

export function InventoryCreateSheet({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const closeAfterSave = useCallback(() => setOpen(false), []);
  return <>
    <button className="ops-primary-action" type="button" onClick={() => setOpen(true)}><Plus aria-hidden="true" />Add residence</button>
    <ModalOverlay isOpen={open} isDismissable onOpenChange={setOpen} className="ops-sheet-overlay">
      <Modal className="ops-sheet-modal"><Dialog aria-label="Add governed residence" className="ops-sheet-dialog">
        <header><div><p>Governed inventory</p><h2>Add a residence</h2><span>Build a complete, source-backed record before publication review.</span></div><button type="button" aria-label="Close residence form" onClick={() => setOpen(false)}><X aria-hidden="true" /></button></header>
        <ol className="ops-step-rail" aria-label="Residence record stages"><li data-active="true"><span>01</span>Identity</li><li><span>02</span>Facts</li><li><span>03</span>Evidence</li><li><span>04</span>Review</li></ol>
        <InventoryCreateForm onSaved={closeAfterSave} />
      </Dialog></Modal>
    </ModalOverlay>
  </>;
}
