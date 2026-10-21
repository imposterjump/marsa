"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbContextValue {
  crumbs: Crumb[] | null;
  setCrumbs: (crumbs: Crumb[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  crumbs: null,
  setCrumbs: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null);
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export const useBreadcrumbContext = () => useContext(BreadcrumbContext);

/**
 * Detail pages declare their trail (e.g. Standards › CITS-2026). Cleared on unmount so other
 * pages fall back to the static titles in nav.ts (HANDOFF I-09).
 */
export function SetBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const { setCrumbs } = useContext(BreadcrumbContext);
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    setCrumbs(JSON.parse(key) as Crumb[]);
    return () => setCrumbs(null);
  }, [key, setCrumbs]);
  return null;
}
