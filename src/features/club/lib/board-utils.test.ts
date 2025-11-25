import { describe, expect, it } from "vitest";
import {
  applyDragEndBoardState,
  getDropTargetFromOver,
  restoreDraggedMember,
} from "./board-utils";
import type { BoardState, DraggingState } from "../types/primary-members";
import { createMemberDropId, createSlotDropId } from "./drop-ids.lib";

const baseBoard: BoardState = {
  inactive: [1, 2, 3],
  active: [10, 20],
};

const draggingState: DraggingState = {
  memberId: 2,
  sourceColumn: "inactive",
  sourceIndex: 1,
  overlayWidth: 100,
};

describe("보드 유틸", () => {
  it("드래그한 멤버를 원래 인덱스에 삽입한다", () => {
    const prev: BoardState = { inactive: [1, 3], active: [10, 20] };
    expect(restoreDraggedMember(prev, draggingState)).toEqual(baseBoard);
  });

  it("슬롯 드롭 타겟을 파싱하고 인덱스를 범위 안으로 보정한다", () => {
    const overId = createSlotDropId("active", 999);
    expect(getDropTargetFromOver(overId, null, baseBoard, null)).toEqual({
      columnId: "active",
      index: 2,
    });
  });

  it("포인터 중간 지점 기준으로 멤버 드롭 타겟을 계산한다", () => {
    const overId = createMemberDropId(20);
    const topHalf = getDropTargetFromOver(overId, { top: 100, height: 40 }, baseBoard, 110);
    const bottomHalf = getDropTargetFromOver(
      overId,
      { top: 100, height: 40 },
      baseBoard,
      130,
    );

    expect(topHalf).toEqual({ columnId: "active", index: 1 });
    expect(bottomHalf).toEqual({ columnId: "active", index: 2 });
  });

  it("드롭 타겟이 없으면 원래 상태로 복원한다", () => {
    const prev: BoardState = { inactive: [1, 3], active: [10, 20] };

    const next = applyDragEndBoardState(
      prev,
      draggingState,
      null,
      { id: "unknown" },
      null,
    );

    expect(next).toEqual(baseBoard);
  });

  it("드래그한 멤버를 다른 컬럼으로 이동한다", () => {
    const prev: BoardState = { inactive: [1, 3], active: [10, 20] };

    const next = applyDragEndBoardState(
      prev,
      draggingState,
      null,
      { id: createSlotDropId("active", 1) },
      null,
    );

    expect(next).toEqual({
      inactive: [1, 3],
      active: [10, 2, 20],
    });
  });
});
