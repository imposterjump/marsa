"use client";

import { createContext, useContext } from "react";

export interface ShellContextValue {
  /** Open the profile dialog (name + organization) in edit mode. */
  openProfile: () => void;
}

export const ShellContext = createContext<ShellContextValue>({ openProfile: () => {} });

export const useShell = () => useContext(ShellContext);
