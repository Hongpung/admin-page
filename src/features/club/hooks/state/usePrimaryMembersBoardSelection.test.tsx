import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { usePrimaryMembersBoardSelection } from "./usePrimaryMembersBoardSelection";
import type { BoardState } from "../../types/primary-members";

function setup(initialBoard: BoardState) {
  return renderHook(() => {
    const [board, setBoard] = useState<BoardState>(initialBoard);
    const selection = usePrimaryMembersBoardSelection({ board, setBoard });
    return { board, ...selection };
  });
}

describe("주요 멤버 보드 선택 훅", () => {
  it("각 컬럼에서 선택 토글과 전체 선택을 처리한다", () => {
    const { result } = setup({ inactive: [1, 2], active: [10] });

    act(() => {
      result.current.toggleMemberSelect(1, "inactive");
      result.current.toggleMemberSelect(10, "active");
    });

    expect(result.current.selectedInactiveIds.has(1)).toBe(true);
    expect(result.current.selectedActiveIds.has(10)).toBe(true);

    act(() => {
      result.current.toggleSelectAllInColumn("inactive");
    });
    expect(result.current.selectedInactiveIds.size).toBe(2);
  });

  it("컬럼 간 선택 항목을 교환하고 선택 상태를 초기화한다", () => {
    const { result } = setup({ inactive: [1, 2], active: [10, 20] });

    act(() => {
      result.current.toggleMemberSelect(1, "inactive");
      result.current.toggleMemberSelect(20, "active");
    });

    act(() => {
      result.current.swapSelectionsBetweenColumns();
    });

    expect(result.current.board).toEqual({ inactive: [2, 20], active: [10, 1] });
    expect(result.current.selectedInactiveIds.size).toBe(0);
    expect(result.current.selectedActiveIds.size).toBe(0);
  });

  it("선택 항목을 활성 또는 비활성 컬럼으로 이동하고 초기화한다", () => {
    const { result } = setup({ inactive: [1, 2], active: [10] });

    act(() => {
      result.current.toggleMemberSelect(2, "inactive");
    });

    act(() => {
      result.current.moveSelectedToActive();
    });

    expect(result.current.board).toEqual({ inactive: [1], active: [10, 2] });
    expect(result.current.selectedInactiveIds.size).toBe(0);

    act(() => {
      result.current.toggleMemberSelect(10, "active");
    });

    act(() => {
      result.current.moveSelectedToInactive();
    });

    expect(result.current.board).toEqual({ inactive: [1, 10], active: [2] });
    expect(result.current.selectedActiveIds.size).toBe(0);
  });
});
