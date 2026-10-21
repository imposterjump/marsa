"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useHydrated } from "./use-client-store";

/**
 * Hide query data until hydration has finished (HANDOFF G-34).
 * The server never has client-fetched data, so it renders loading states. If a query resolves
 * while React is still hydrating a later part of the tree, TanStack would hand that subtree real
 * data and React reports "Hydration failed". Until hydrated, report "pending, no data".
 */
export function useHydrationSafe<T>(query: UseQueryResult<T>): UseQueryResult<T> {
  const hydrated = useHydrated();
  if (hydrated) return query;
  return {
    ...query,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isPending: true,
    isLoading: true,
    status: "pending",
  } as UseQueryResult<T>;
}
