import type { UniqueIdentifier } from "@dnd-kit/core";
import type {
  BoardState,
  ColumnId,
  DraggingState,
  DropPreview,
} from "../types/primary-members";
import { parseMemberDropId, parseSlotDropId } from "./drop-ids.lib";

export function toMemberId(id: UniqueIdentifier): number | null {
  if (typeof id === "number" && Number.isInteger(id)) return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return null;
}

export function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export function formatUpdatedAt(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function findColumnByMemberId(
  memberId: number,
  currentBoard: BoardState,
): ColumnId | null {
  if (currentBoard.inactive.includes(memberId)) return "inactive";
  if (currentBoard.active.includes(memberId)) return "active";
  return null;
}

export function restoreDraggedMember(
  prev: BoardState,
  state: DraggingState,
): BoardState {
  const sourceItems = [...prev[state.sourceColumn]];
  const insertIndex = Math.max(
    0,
    Math.min(state.sourceIndex, sourceItems.length),
  );
  sourceItems.splice(insertIndex, 0, state.memberId);

  return {
    ...prev,
    [state.sourceColumn]: sourceItems,
  };
}

export function applyDragEndBoardState(
  prev: BoardState,
  draggingState: DraggingState,
  dropPreview: DropPreview | null,
  over: {
    id: UniqueIdentifier;
    rect?: { top: number; height: number };
  },
  pointerClientY: number | null,
): BoardState {
  const target =
    dropPreview && dropPreview.columnId !== draggingState.sourceColumn
      ? dropPreview
      : getDropTargetFromOver(
          over.id,
          over.rect ? { top: over.rect.top, height: over.rect.height } : null,
          prev,
          pointerClientY,
        );

  if (!target || target.columnId === draggingState.sourceColumn) {
    return restoreDraggedMember(prev, draggingState);
  }

  if (prev[target.columnId].includes(draggingState.memberId)) {
    return prev;
  }

  const nextTargetItems = [...prev[target.columnId]];
  const insertIndex = Math.max(
    0,
    Math.min(target.index, nextTargetItems.length),
  );
  nextTargetItems.splice(insertIndex, 0, draggingState.memberId);

  return {
    ...prev,
    [target.columnId]: nextTargetItems,
  };
}

export function getDropTargetFromOver(
  overId: UniqueIdentifier,
  overRect: { top: number; height: number } | null,
  currentBoard: BoardState,
  pointerClientY: number | null,
): DropPreview | null {
  const slotTarget = parseSlotDropId(overId);
  if (slotTarget) {
    return {
      columnId: slotTarget.columnId,
      index: Math.max(
        0,
        Math.min(slotTarget.index, currentBoard[slotTarget.columnId].length),
      ),
    };
  }

  if (overId === "inactive" || overId === "active") {
    return {
      columnId: overId,
      index:
        pointerClientY !== null && overRect
          ? pointerClientY <= overRect.top + overRect.height / 2
            ? 0
            : currentBoard[overId].length
          : currentBoard[overId].length,
    };
  }

  const overMemberId = parseMemberDropId(overId);
  if (!overMemberId) return null;

  const overColumn = findColumnByMemberId(overMemberId, currentBoard);
  if (!overColumn) return null;

  const overIndex = currentBoard[overColumn].indexOf(overMemberId);
  if (overIndex < 0) return null;

  if (pointerClientY === null || !overRect) {
    return {
      columnId: overColumn,
      index: overIndex,
    };
  }

  const midpointY = overRect.top + overRect.height / 2;
  return {
    columnId: overColumn,
    index: pointerClientY > midpointY ? overIndex + 1 : overIndex,
  };
}
