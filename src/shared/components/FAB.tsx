"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";

interface FabAction {
  label: string;
  onClick: () => void;
}

interface FABProps {
  color?: "gray" | "blue" | "black";
  label?: string;
  onClick?: () => void;
  actions?: FabAction[];
}

const colorClassMap: Record<NonNullable<FABProps["color"]>, string> = {
  gray: "bg-gray-400",
  blue: "bg-blue-400",
  black: "bg-black",
};

export default function FAB({
  color = "gray",
  label = "+",
  onClick,
  actions,
}: FABProps) {
  const [isClient, setIsClient] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasActions = useMemo(
    () => Boolean(actions && actions.length > 0),
    [actions]
  );

  useEffect(() => {
    if (!hasActions) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasActions]);

  if (!isClient || typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {hasActions && panelVisible ? (
        <div
          className="mb-1 flex w-56 flex-col rounded-md border border-gray-100 bg-white px-4 py-2 shadow-xl"
          role="menu"
        >
          {actions!.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className="w-full cursor-pointer rounded py-2 text-left font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => {
                action.onClick();
                setPanelVisible(false);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-3xl text-white shadow-lg transition-transform duration-300 ease-in-out ${colorClassMap[color]} ${hasActions && panelVisible ? "rotate-45" : "rotate-0"}`}
        onClick={() => {
          if (hasActions) {
            setPanelVisible((prev) => !prev);
            return;
          }
          onClick?.();
        }}
        aria-expanded={hasActions ? panelVisible : undefined}
        aria-haspopup={hasActions ? "menu" : undefined}
        title={hasActions ? "예약 메뉴" : undefined}
      >
        {label}
      </button>
    </div>,
    document.body
  );
}
