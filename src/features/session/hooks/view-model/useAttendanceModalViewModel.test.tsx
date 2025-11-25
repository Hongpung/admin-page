import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAttendanceModalViewModel } from "./useAttendanceModalViewModel";
import type { SessionAttendanceEntry } from "../../types";

const byStatus: Record<string, SessionAttendanceEntry[]> = {
  출석: [
    {
      status: "출석",
      timeStamp: "10:00",
      member: { memberId: 1, name: "홍길동", nickname: null },
    },
    {
      status: "출석",
      timeStamp: null,
      member: { memberId: 2, name: "김철수", nickname: null },
    },
  ],
  결석: [
    {
      status: "결석",
      timeStamp: null,
      member: { memberId: 3, name: "이영희", nickname: null },
    },
  ],
};

describe("출석 모달 뷰모델 훅", () => {
  it("예약 세션에서 존재하는 상태 칩만 순서대로 노출한다", () => {
    const { result } = renderHook(() =>
      useAttendanceModalViewModel({ byStatus, sessionType: "RESERVED" }),
    );

    expect(result.current.availableChips).toEqual(["출석", "결석"]);
  });

  it("시간 기반/평면 콘텐츠를 상태별로 생성한다", () => {
    const { result } = renderHook(() =>
      useAttendanceModalViewModel({ byStatus, sessionType: "RESERVED" }),
    );

    const attendContent = result.current.sectionContentByStatus["출석"];
    const absentContent = result.current.sectionContentByStatus["결석"];

    expect(attendContent?.type).toBe("byTime");
    expect(absentContent?.type).toBe("flat");

    if (attendContent?.type === "byTime") {
      expect(attendContent.groups.map((group) => group.timeLabel)).toEqual([
        "10:00",
        "시간 없음",
      ]);
    }
  });
});
