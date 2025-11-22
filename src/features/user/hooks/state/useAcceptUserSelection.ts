import { useCallback, useState } from "react";
import type { SignUpRequestUser } from "../../types";

export function useAcceptUserSelection() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleSelectAll = useCallback(
    (checked: boolean, pagedRows: SignUpRequestUser[]) => {
      if (checked) {
        setSelectedIds((prev) => [
          ...prev,
          ...pagedRows
            .map((row) => row.signupId)
            .filter((id) => !prev.includes(id)),
        ]);
        return;
      }
      setSelectedIds((prev) =>
        prev.filter((id) => !pagedRows.some((row) => row.signupId === id)),
      );
    },
    [],
  );

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id),
    );
  }, []);

  const clearSelected = () => {
    setSelectedIds([]);
  };

  const removeSelected = (signupId: number) => {
    setSelectedIds((prev) => prev.filter((id) => id !== signupId));
  };

  return {
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleSelectOne,
    clearSelected,
    removeSelected,
  };
}
