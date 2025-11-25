import { describe, expect, it } from "vitest";
import { normalizeSignupList } from "./signup-list";

describe("normalizeSignupList", () => {
  it("returns input when raw is array", () => {
    const raw = [{ signupId: 1 }, { signupId: 2 }];
    expect(normalizeSignupList(raw)).toBe(raw);
  });

  it("returns empty array when raw is not array", () => {
    expect(normalizeSignupList(null)).toEqual([]);
    expect(normalizeSignupList(undefined)).toEqual([]);
    expect(normalizeSignupList({ signupId: 1 })).toEqual([]);
  });
});
