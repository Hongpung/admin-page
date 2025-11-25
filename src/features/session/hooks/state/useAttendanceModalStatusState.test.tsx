import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAttendanceModalStatusState } from "./useAttendanceModalStatusState";
import type { SessionAttendanceEntry, SessionAttendanceStatusLabel } from "../../types";

function renderState(args: {
  open: boolean;
  availableChips: SessionAttendanceStatusLabel[];
  byStatus: Record<string, SessionAttendanceEntry[]>;
}) {
  return renderHook((props: typeof args) => useAttendanceModalStatusState(props), {
    initialProps: args,
  });
}

describe("출석 모달 상태 훅", () => {
  const byStatus: Record<string, SessionAttendanceEntry[]> = {
    출석: [
      {
        status: "출석",
        timeStamp: "10:00",
        member: { memberId: 1, name: "홍길동", nickname: null },
      },
    ],
    지각: [
      {
        status: "지각",
        timeStamp: "10:10",
        member: { memberId: 2, name: "김철수", nickname: null },
      },
    ],
  };

  it("열릴 때 기본 선택을 첫 칩으로 맞춘다", () => {
    const { result } = renderState({
      open: true,
      availableChips: ["출석", "지각"],
      byStatus,
    });

    expect(result.current.selectedStatus).toBe("출석");
  });

  it("닫히면 선택 상태를 초기화한다", () => {
    const { result, rerender } = renderState({
      open: true,
      availableChips: ["출석", "지각"],
      byStatus,
    });

    expect(result.current.selectedStatus).toBe("출석");

    rerender({ open: false, availableChips: ["출석", "지각"], byStatus });

    expect(result.current.selectedStatus).toBeNull();
  });

  it("선택 상태가 비게 되면 첫 칩으로 재선택한다", () => {
    const { result, rerender } = renderState({
      open: true,
      availableChips: ["출석", "지각"],
      byStatus,
    });

    act(() => {
      result.current.setSelectedStatus("지각");
    });

    rerender({
      open: true,
      availableChips: ["출석"],
      byStatus: { 출석: byStatus["출석"] ?? [] },
    });

    expect(result.current.selectedStatus).toBe("출석");
  });
});
