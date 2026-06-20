"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFabDock } from "./FabDockContext";

type FabDockPortalProps = {
  assistantSlot: ReactNode;
};

export function FabDockPortal({ assistantSlot }: FabDockPortalProps) {
  const { pageFab } = useFabDock();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {pageFab?.menu ? (
        <div className="pointer-events-auto mb-1">{pageFab.menu}</div>
      ) : null}
      <div className="pointer-events-auto flex flex-row items-center justify-end gap-2">
        {pageFab?.button}
        {assistantSlot}
      </div>
    </div>,
    document.body,
  );
}
