import { describe, expect, it } from "vitest";
import type { SignupListResDto } from "../types";
import {
  calculateTotalPages,
  clampPage,
  getPagedSignupRows,
} from "./accept-user-pagination";

function createRow(signupId: number): SignupListResDto {
  return {
    signupId,
    name: `user-${signupId}`,
    nickname: null,
    enrollmentNumber: String(signupId),
    club: "club",
    email: `user-${signupId}@example.com`,
  };
}

describe("calculateTotalPages", () => {
  it("returns 1 when totalCount is zero", () => {
    expect(calculateTotalPages(0, 10)).toBe(1);
  });

  it("calculates ceiling page count", () => {
    expect(calculateTotalPages(21, 10)).toBe(3);
  });
});

describe("clampPage", () => {
  it("clamps page within available range", () => {
    expect(clampPage(5, 3)).toBe(2);
  });

  it("returns 0 when totalPages is zero", () => {
    expect(clampPage(3, 0)).toBe(0);
  });
});

describe("getPagedSignupRows", () => {
  it("returns rows for requested page", () => {
    const rows = [
      createRow(1),
      createRow(2),
      createRow(3),
      createRow(4),
      createRow(5),
    ];
    const paged = getPagedSignupRows(rows, 1, 2);
    expect(paged.map((r) => r.signupId)).toEqual([3, 4]);
  });

  it("returns empty array when page start exceeds row length", () => {
    const rows = [createRow(1), createRow(2)];
    expect(getPagedSignupRows(rows, 3, 10)).toEqual([]);
  });
});
