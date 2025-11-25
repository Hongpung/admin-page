import { describe, expect, it } from "vitest";
import { splitNoticeUpdatedAt } from "./notice-datetime";

describe("splitNoticeUpdatedAt", () => {
  it("ISO 문자열을 날짜와 시간으로 분리한다", () => {
    expect(splitNoticeUpdatedAt("2026-04-27T12:34:56.000Z")).toEqual({
      datePart: "2026-04-27",
      timePart: "12:34:56",
    });
  });

  it("시간 영역이 없으면 빈 문자열을 반환한다", () => {
    expect(splitNoticeUpdatedAt("2026-04-27")).toEqual({
      datePart: "2026-04-27",
      timePart: "",
    });
  });
});
