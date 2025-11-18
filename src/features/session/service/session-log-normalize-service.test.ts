import { describe, expect, it } from "vitest";
import {
  mapSessionMonthCalendar,
  normalizeAttendanceList,
  normalizeSession,
} from "./session-log-normalize-service";

describe("session log normalize service", () => {
  it("normalizeAttendanceList는 유효 멤버만 남기고 status fallback을 적용한다", () => {
    const result = normalizeAttendanceList([
      {
        status: "출석",
        timeStamp: "10:00",
        member: { memberId: 1, name: "홍길동", nickname: "" },
      },
      {
        status: "UNKNOWN",
        timeStamp: null,
        member: { memberId: "2", name: "김철수", nickname: "철수" },
      },
      {
        status: "결석",
      },
    ]);

    expect(result).toEqual([
      {
        status: "출석",
        timeStamp: "10:00",
        member: { memberId: 1, name: "홍길동", nickname: null },
      },
      {
        status: "참가",
        timeStamp: null,
        member: { memberId: "2", name: "김철수", nickname: "철수" },
      },
    ]);
  });

  it("normalizeSession은 기본 필드와 attendance/returnImage를 정규화한다", () => {
    const result = normalizeSession({
      sessionId: "10",
      date: "2026-04-29",
      title: "테스트 세션",
      reservationType: null,
      sessionType: "RESERVED",
      participationAvailable: 1,
      creatorName: "관리자",
      creatorNickname: "",
      startTime: "10:00",
      endTime: "12:00",
      forceEnd: 0,
      extendCount: "2",
      borrowInstruments: [{ name: "튜너", instrumentType: "ETC" }],
      returnImageUrl: "https://example.com/a.png",
      attendanceList: [
        {
          status: "지각",
          timeStamp: "",
          member: { memberId: 1, name: "홍길동", nickname: null },
        },
      ],
    });

    expect(result.sessionId).toBe(10);
    expect(result.creatorNickname).toBeNull();
    expect(result.extendCount).toBe(2);
    expect(result.returnImageUrl).toEqual(["https://example.com/a.png"]);
    expect(result.attendanceList).toEqual([
      {
        status: "지각",
        timeStamp: null,
        member: { memberId: 1, name: "홍길동", nickname: null },
      },
    ]);
  });

  it("mapSessionMonthCalendar는 date를 key로 count를 매핑한다", () => {
    const mapped = mapSessionMonthCalendar([
      { date: "2026-04-28", sessionCount: 2 },
      { date: "2026-04-29", sessionCount: 1 },
    ]);

    expect(mapped).toEqual({
      "2026-04-28": 2,
      "2026-04-29": 1,
    });
  });
});
