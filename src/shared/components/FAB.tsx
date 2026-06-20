"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOptionalFabDock } from "@admin/shared/components/FabDock";

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

function FabButton({
  color,
  label,
  hasActions,
  panelVisible,
  onClick,
}: {
  color: NonNullable<FABProps["color"]>;
  label: string;
  hasActions: boolean;
  panelVisible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-3xl text-white shadow-lg transition-transform duration-300 ease-in-out ${colorClassMap[color]} ${hasActions && panelVisible ? "rotate-45" : "rotate-0"}`}
      onClick={onClick}
      aria-expanded={hasActions ? panelVisible : undefined}
      aria-haspopup={hasActions ? "menu" : undefined}
      title={hasActions ? "예약 메뉴" : undefined}
    >
      {label}
    </button>
  );
}

function FabMenu({
  actions,
  onSelect,
}: {
  actions: FabAction[];
  onSelect: (action: FabAction) => void;
}) {
  return (
    <div
      className="flex w-56 flex-col rounded-md border border-gray-100 bg-white px-4 py-2 shadow-xl"
      role="menu"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          role="menuitem"
          className="w-full cursor-pointer rounded py-2 text-left font-semibold text-gray-800 hover:bg-gray-50"
          onClick={() => onSelect(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default function FAB({
  color = "gray",
  label = "+",
  onClick,
  actions,
}: FABProps) {
  const fabDock = useOptionalFabDock();
  const [panelVisible, setPanelVisible] = useState(false);

  const hasActions = useMemo(
    () => Boolean(actions && actions.length > 0),
    [actions],
  );

  useEffect(() => {
    if (!hasActions) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasActions]);

  const handleClick = useCallback(() => {
    if (hasActions) {
      setPanelVisible((prev) => !prev);
      return;
    }
    onClick?.();
  }, [hasActions, onClick]);

  const handleSelect = useCallback((action: FabAction) => {
    action.onClick();
    setPanelVisible(false);
  }, []);

  useEffect(() => {
    if (!fabDock) return;

    fabDock.setPageFab({
      button: (
        <FabButton
          color={color}
          label={label}
          hasActions={hasActions}
          panelVisible={panelVisible}
          onClick={handleClick}
        />
      ),
      menu:
        hasActions && panelVisible && actions ? (
          <FabMenu actions={actions} onSelect={handleSelect} />
        ) : null,
    });

    return () => {
      fabDock.setPageFab(null);
    };
  }, [
    actions,
    color,
    fabDock,
    handleClick,
    handleSelect,
    hasActions,
    label,
    panelVisible,
  ]);

  if (fabDock) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {hasActions && panelVisible && actions ? (
        <FabMenu actions={actions} onSelect={handleSelect} />
      ) : null}
      <FabButton
        color={color}
        label={label}
        hasActions={hasActions}
        panelVisible={panelVisible}
        onClick={handleClick}
      />
    </div>
  );
}
