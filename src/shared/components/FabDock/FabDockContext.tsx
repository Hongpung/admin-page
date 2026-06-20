"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PageFabState = {
  button: ReactNode;
  menu: ReactNode | null;
};

type FabDockContextValue = {
  pageFab: PageFabState | null;
  setPageFab: (fab: PageFabState | null) => void;
};

const FabDockContext = createContext<FabDockContextValue | null>(null);

export function FabDockProvider({ children }: { children: ReactNode }) {
  const [pageFab, setPageFabState] = useState<PageFabState | null>(null);

  const setPageFab = useCallback((fab: PageFabState | null) => {
    setPageFabState(fab);
  }, []);

  const value = useMemo(
    () => ({
      pageFab,
      setPageFab,
    }),
    [pageFab, setPageFab],
  );

  return (
    <FabDockContext.Provider value={value}>{children}</FabDockContext.Provider>
  );
}

export function useFabDock() {
  const context = useContext(FabDockContext);
  if (!context) {
    throw new Error("useFabDock must be used within FabDockProvider");
  }
  return context;
}

export function useOptionalFabDock() {
  return useContext(FabDockContext);
}
