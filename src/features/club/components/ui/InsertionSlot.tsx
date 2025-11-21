"use client";

import { useDroppable } from "@dnd-kit/core";
import { createSlotDropId } from "../../lib/drop-ids.lib";
import type { ColumnId } from "../../types/primary-members";

export function InsertionSlot({
  columnId,
  index,
  isPreview,
  disableHighlight,
  fillEmptyColumn = false,
}: {
  columnId: ColumnId;
  index: number;
  isPreview: boolean;
  disableHighlight: boolean;
  /** 빈 컬럼: 숨김(display:none) 대신 실제 히트 영역을 유지해 드래그 오버가 안정적으로 잡히게 함 */
  fillEmptyColumn?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: createSlotDropId(columnId, index),
    disabled: disableHighlight,
  });

  if (disableHighlight) {
    return null;
  }

  if (isPreview) {
    return (
      <li
        ref={setNodeRef}
        className={fillEmptyColumn ? "flex min-h-[20rem] flex-1 flex-col py-1" : "py-1"}>
        <div
          className={
            fillEmptyColumn
              ? "min-h-[20rem] flex-1 rounded-lg border border-dashed border-blue-300 bg-blue-100/40 p-4"
              : "min-h-[148px] rounded-lg border border-dashed border-blue-300 bg-blue-100/40 p-4"
          }
        />
      </li>
    );
  }

  if (fillEmptyColumn) {
    return (
      <li
        ref={setNodeRef}
        className="flex min-h-[20rem] flex-1 flex-col py-1">
        <div
          className={`min-h-[20rem] flex-1 rounded-lg border border-dashed p-4 transition-colors ${isOver
            ? "border-blue-300 bg-blue-100/70"
            : "border-transparent bg-transparent"
            }`}
        />
      </li>
    );
  }

  return (
    <li ref={setNodeRef}>
      <div
        className={`min-h-[148px] rounded-lg border border-dashed border-blue-300 bg-blue-100/40 p-4 ${isOver ? "block bg-blue-100/70 py-1" : "hidden"
          }`}
      />
    </li>
  );
}
