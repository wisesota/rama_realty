"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPropertyAction } from "@/app/dashboard/actions";
import { initialActionState } from "@/lib/dashboard/validation";

export function InventoryCreateForm({ onSaved }: { onSaved?: () => void }) {
  const [state, action, pending] = useActionState(createPropertyAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const error = (name: string) => state.fieldErrors?.[name];
  const errorId = (name: string) => error(name) ? `inventory-${name}-error` : undefined;

  useEffect(() => {
    if (state.status !== "error") return;
    formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [state]);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    onSaved?.();
  }, [onSaved, state.status]);

  return (
    <form ref={formRef} action={action} className="ops-form ops-property-form">
      <fieldset><legend><span>01</span><strong>Residence identity</strong><small>Name the asset and place it in the catalog.</small></legend><div className="ops-form-grid">
        <label>Name<input name="name" required aria-invalid={Boolean(error("name"))} aria-describedby={errorId("name")} />{error("name") && <small id={errorId("name")} role="alert">{error("name")}</small>}</label>
        <label>Community<input name="location" required placeholder="Dubai Marina" aria-invalid={Boolean(error("location"))} aria-describedby={errorId("location")} />{error("location") && <small id={errorId("location")} role="alert">{error("location")}</small>}</label>
        <label>Property type<select name="propertyType" defaultValue="apartment"><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="townhouse">Townhouse</option><option value="penthouse">Penthouse</option><option value="duplex">Duplex</option><option value="plot">Plot</option></select></label>
      </div></fieldset>
      <fieldset><legend><span>02</span><strong>Property facts</strong><small>Commercial and physical facts Rama may compare.</small></legend><div className="ops-form-grid">
        <label>Price (AED)<input name="priceAed" type="number" min="1" required aria-invalid={Boolean(error("priceAed"))} aria-describedby={errorId("priceAed")} />{error("priceAed") && <small id={errorId("priceAed")} role="alert">{error("priceAed")}</small>}</label>
        <label>Bedrooms<input name="beds" type="number" min="0" max="30" required aria-invalid={Boolean(error("beds"))} aria-describedby={errorId("beds")} />{error("beds") && <small id={errorId("beds")} role="alert">{error("beds")}</small>}</label>
        <label>Bathrooms<input name="baths" type="number" min="0" max="30" required aria-invalid={Boolean(error("baths"))} aria-describedby={errorId("baths")} />{error("baths") && <small id={errorId("baths")} role="alert">{error("baths")}</small>}</label>
        <label>Area (sq ft)<input name="areaSqFt" type="number" min="1" required aria-invalid={Boolean(error("areaSqFt"))} aria-describedby={errorId("areaSqFt")} />{error("areaSqFt") && <small id={errorId("areaSqFt")} role="alert">{error("areaSqFt")}</small>}</label>
      </div></fieldset>
      <fieldset><legend><span>03</span><strong>Evidence and media</strong><small>Keep every public description traceable and accessible.</small></legend><div className="ops-form-grid">
        <label className="ops-form-wide">Evidence-led feature<input name="feature" required placeholder="Balcony · Marina walk" aria-invalid={Boolean(error("feature"))} aria-describedby={errorId("feature")} />{error("feature") && <small id={errorId("feature")} role="alert">{error("feature")}</small>}</label>
        <label className="ops-form-wide">Factual description<textarea name="description" rows={4} required aria-invalid={Boolean(error("description"))} aria-describedby={errorId("description")} />{error("description") && <small id={errorId("description")} role="alert">{error("description")}</small>}</label>
        <label className="ops-form-wide">Image URL<input name="imageUrl" type="url" required aria-invalid={Boolean(error("imageUrl"))} aria-describedby={errorId("imageUrl")} />{error("imageUrl") && <small id={errorId("imageUrl")} role="alert">{error("imageUrl")}</small>}</label>
        <label className="ops-form-wide">Image description<input name="imageAlt" required aria-invalid={Boolean(error("imageAlt"))} aria-describedby={errorId("imageAlt")} />{error("imageAlt") && <small id={errorId("imageAlt")} role="alert">{error("imageAlt")}</small>}</label>
        <label className="ops-form-wide">Inventory source<input name="sourceName" required placeholder="Licensed provider or verified internal feed" aria-invalid={Boolean(error("sourceName"))} aria-describedby={errorId("sourceName")} />{error("sourceName") && <small id={errorId("sourceName")} role="alert">{error("sourceName")}</small>}</label>
      </div></fieldset>
      {state.message ? <p className="ops-form-message ops-form-wide" data-status={state.status} role="status">{state.message}</p> : null}
      <div className="ops-form-actions ops-form-wide"><span>Saved records stay private until review and publication.</span><button type="submit" disabled={pending}>{pending ? "Saving draft…" : "Save governed draft"}</button></div>
    </form>
  );
}
