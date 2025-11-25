import { describe, expect, it } from "vitest";
import { parseClubIdQuery } from "./club-url";

describe("parseClubIdQuery", () => {
  it("없거나 잘못되었거나 유효한 쿼리를 파싱한다", () => {
    expect(parseClubIdQuery(null)).toEqual({ kind: "missing" });
    expect(parseClubIdQuery("abc")).toEqual({ kind: "invalid" });
    expect(parseClubIdQuery("10")).toEqual({ kind: "valid", clubId: 10 });
  });

  it("음수와 안전하지 않은 값을 거부한다", () => {
    expect(parseClubIdQuery("-1")).toEqual({ kind: "invalid" });
    expect(parseClubIdQuery(String(Number.MAX_SAFE_INTEGER + 1))).toEqual({
      kind: "invalid",
    });
  });
});
