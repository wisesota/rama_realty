"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { useStore } from "zustand";
import {
  createLandingStore,
  type LandingStore,
  type LandingStoreApi,
} from "@/stores/landing-store";
import type { PublicLocale } from "@/lib/i18n";

const LandingStoreContext = createContext<LandingStoreApi | null>(null);

export function LandingStoreProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: PublicLocale;
}) {
  const [store] = useState(() => createLandingStore(locale));

  return <LandingStoreContext.Provider value={store}>{children}</LandingStoreContext.Provider>;
}

export function useLandingStore<T>(selector: (state: LandingStore) => T) {
  const store = useContext(LandingStoreContext);
  if (!store) throw new Error("useLandingStore must be used within LandingStoreProvider.");
  return useStore(store, selector);
}
