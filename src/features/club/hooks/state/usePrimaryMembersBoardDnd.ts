import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import type {
  BoardMember,
  BoardState,
  DraggingState,
  DropPreview,
} from "../../types/primary-members";
import {
  applyDragEndBoardState,
  arraysEqual,
  getDropTargetFromOver,
  restoreDraggedMember,
  toMemberId,
} from "../../lib/board-utils";
import { getClientYFromDragEvent } from "../../lib/drop-ids.lib";
import { buildPrimaryMembersBoard } from "../../service/primary-members-board-service";

type Args = {
  members?: BoardMember[];
  primaryMembers?: BoardMember[];
  sourceError?: unknown;
};

function readBoardError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "데이터를 불러오지 못했습니다.";
}

export function usePrimaryMembersBoardDnd({
  members,
  primaryMembers,
  sourceError,
}: Args) {
  const [error, setError] = useState<string | null>(null);
  const [memberMap, setMemberMap] = useState<Record<number, BoardMember>>({});
  const [board, setBoard] = useState<BoardState>({ inactive: [], active: [] });
  const [initialActiveIds, setInitialActiveIds] = useState<number[]>([]);
  const [draggingState, setDraggingState] = useState<DraggingState | null>(null);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [pointerClientY, setPointerClientY] = useState<number | null>(null);

  const boardRef = useRef(board);
  const draggingStateRef = useRef<DraggingState | null>(null);
  boardRef.current = board;
  draggingStateRef.current = draggingState;

  useEffect(() => {
    if (!members || !primaryMembers) return;
    try {
      setError(null);
      const next = buildPrimaryMembersBoard({ members, primaryMembers });
      setMemberMap(next.memberMap);
      setBoard(next.board);
      setInitialActiveIds(next.initialActiveIds);
    } catch (e) {
      setError(readBoardError(e));
    }
  }, [members, primaryMembers]);

  useEffect(() => {
    if (!sourceError) {
      setError(null);
      return;
    }
    setError(readBoardError(sourceError));
  }, [sourceError]);

  const hasChanges = useMemo(
    () => !arraysEqual(initialActiveIds, board.active),
    [initialActiveIds, board.active],
  );

  const clearDraggingState = () => {
    draggingStateRef.current = null;
    setDraggingState(null);
    setDropPreview(null);
    setPointerClientY(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const memberId = toMemberId(event.active.id);
    if (!memberId) return;

    const sourceColumn = board.inactive.includes(memberId)
      ? "inactive"
      : board.active.includes(memberId)
        ? "active"
        : null;
    if (!sourceColumn) return;

    const sourceIndex = board[sourceColumn].indexOf(memberId);
    if (sourceIndex < 0) return;

    const nextDragging: DraggingState = {
      memberId,
      sourceColumn,
      sourceIndex,
      overlayWidth: event.active.rect.current.initial?.width ?? 352,
    };
    draggingStateRef.current = nextDragging;
    setDraggingState(nextDragging);
    setDropPreview(null);
    setPointerClientY(getClientYFromDragEvent(event.activatorEvent));

    setBoard((prev) => {
      const next = {
        ...prev,
        [sourceColumn]: prev[sourceColumn].filter((id) => id !== memberId),
      };
      boardRef.current = next;
      return next;
    });
  };

  const updateDropPreview = (event: DragOverEvent) => {
    const drag = draggingStateRef.current;
    if (!drag) return;

    if (!event.over) {
      setDropPreview(null);
      return;
    }

    const nextTarget = getDropTargetFromOver(
      event.over.id,
      event.over.rect
        ? {
            top: event.over.rect.top,
            height: event.over.rect.height,
          }
        : null,
      boardRef.current,
      pointerClientY,
    );
    if (!nextTarget || nextTarget.columnId === drag.sourceColumn) {
      setDropPreview(null);
      return;
    }

    setDropPreview((prev) => {
      if (
        prev?.columnId === nextTarget.columnId &&
        prev.index === nextTarget.index
      ) {
        return prev;
      }
      return nextTarget;
    });
  };

  const handleDragCancel = () => {
    if (draggingState) {
      setBoard((prev) => {
        const next = restoreDraggedMember(prev, draggingState);
        boardRef.current = next;
        return next;
      });
    }
    clearDraggingState();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!draggingState) {
      clearDraggingState();
      return;
    }

    if (!event.over) {
      setBoard((prev) => {
        const next = restoreDraggedMember(prev, draggingState);
        boardRef.current = next;
        return next;
      });
      clearDraggingState();
      return;
    }

    const nextBoard = applyDragEndBoardState(
      boardRef.current,
      draggingState,
      dropPreview,
      {
        id: event.over.id,
        rect: event.over.rect
          ? { top: event.over.rect.top, height: event.over.rect.height }
          : undefined,
      },
      pointerClientY,
    );
    boardRef.current = nextBoard;
    setBoard(nextBoard);
    clearDraggingState();
  };

  useEffect(() => {
    if (!draggingState) return;

    const handlePointerMove = (event: PointerEvent) => {
      setPointerClientY(event.clientY);
    };
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      setPointerClientY(touch.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [draggingState]);

  const markSaved = () => {
    setInitialActiveIds(board.active);
  };

  return {
    board,
    setBoard,
    memberMap,
    error,
    hasChanges,
    draggingState,
    dropPreview,
    handleDragStart,
    updateDropPreview,
    handleDragCancel,
    handleDragEnd,
    markSaved,
  };
}
