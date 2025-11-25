import { describe, expect, it } from "vitest";
import { parseNoticeIdParam } from "./notice-url";

describe("parseNoticeIdParam", () => {
  it("없는 공지 식별자는 null로 파싱한다", () => {
    expect(parseNoticeIdParam(null)).toBeNull();
    expect(parseNoticeIdParam("")).toBeNull();
  });

  it("숫자 공지 식별자를 파싱한다", () => {
    expect(parseNoticeIdParam("10")).toBe(10);
  });

  it("숫자가 아닌 공지 식별자는 null로 파싱한다", () => {
    expect(parseNoticeIdParam("abc")).toBeNull();
  });
});
