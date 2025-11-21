import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  BoardState,
  ColumnId,
} from "../../types/primary-members";

export function usePrimaryMembersBoardSelection({
  board,
  setBoard,
}: {
  board: BoardState;
  setBoard: Dispatch<SetStateAction<BoardState>>;
}) {
  const [selectedInactiveIds, setSelectedInactiveIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedActiveIds, setSelectedActiveIds] = useState<Set<number>>(
    () => new Set(),
  );

  const selectedInInactive = useMemo(
    () => board.inactive.filter((id) => selectedInactiveIds.has(id)),
    [board.inactive, selectedInactiveIds],
  );
  const selectedInActive = useMemo(
    () => board.active.filter((id) => selectedActiveIds.has(id)),
    [board.active, selectedActiveIds],
  );

  const toggleMemberSelect = (memberId: number, columnId: ColumnId) => {
    if (columnId === "inactive") {
      setSelectedInactiveIds((prev) => {
        const next = new Set(prev);
        if (next.has(memberId)) {
          next.delete(memberId);
        } else {
          next.add(memberId);
        }
        return next;
      });
      return;
    }

    setSelectedActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const toggleSelectAllInColumn = (columnId: ColumnId) => {
    const ids = board[columnId];
    if (ids.length === 0) return;

    if (columnId === "inactive") {
      setSelectedInactiveIds((prev) => {
        const allSelected = ids.every((id) => prev.has(id));
        return allSelected ? new Set() : new Set(ids);
      });
      return;
    }

    setSelectedActiveIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(ids);
    });
  };

  const canSwapSelections =
    selectedInInactive.length > 0 && selectedInActive.length > 0;
  const canMoveToActive =
    selectedInInactive.length > 0 && selectedInActive.length === 0;
  const canMoveToInactive =
    selectedInActive.length > 0 && selectedInInactive.length === 0;

  const swapSelectionsBetweenColumns = () => {
    if (!canSwapSelections) return;

    const inactiveSet = new Set(selectedInactiveIds);
    const activeSet = new Set(selectedActiveIds);

    setBoard((prev) => {
      const fromInactive = prev.inactive.filter((id) => inactiveSet.has(id));
      const fromActive = prev.active.filter((id) => activeSet.has(id));

      return {
        inactive: [
          ...prev.inactive.filter((id) => !inactiveSet.has(id)),
          ...fromActive,
        ],
        active: [
          ...prev.active.filter((id) => !activeSet.has(id)),
          ...fromInactive,
        ],
      };
    });

    setSelectedInactiveIds(new Set());
    setSelectedActiveIds(new Set());
  };

  const moveSelectedToActive = () => {
    if (!canMoveToActive) return;
    const inactiveSet = new Set(selectedInactiveIds);

    setBoard((prev) => {
      const toMove = prev.inactive.filter((id) => inactiveSet.has(id));
      return {
        inactive: prev.inactive.filter((id) => !inactiveSet.has(id)),
        active: [...prev.active, ...toMove],
      };
    });
    setSelectedInactiveIds(new Set());
  };

  const moveSelectedToInactive = () => {
    if (!canMoveToInactive) return;
    const activeSet = new Set(selectedActiveIds);

    setBoard((prev) => {
      const toMove = prev.active.filter((id) => activeSet.has(id));
      return {
        active: prev.active.filter((id) => !activeSet.has(id)),
        inactive: [...prev.inactive, ...toMove],
      };
    });
    setSelectedActiveIds(new Set());
  };

  return {
    selectedInactiveIds,
    selectedActiveIds,
    canSwapSelections,
    canMoveToActive,
    canMoveToInactive,
    toggleMemberSelect,
    toggleSelectAllInColumn,
    swapSelectionsBetweenColumns,
    moveSelectedToActive,
    moveSelectedToInactive,
  };
}
