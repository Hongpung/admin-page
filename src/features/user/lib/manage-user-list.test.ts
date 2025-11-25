import { describe, expect, it } from "vitest";
import type { MemberListItemResDto } from "../types";
import { sortUsersByEnrollmentNumber } from "./manage-user-list";

function createMember(
  memberId: number,
  enrollmentNumber: string,
): MemberListItemResDto {
  return {
    memberId,
    name: `user-${memberId}`,
    nickname: null,
    enrollmentNumber,
    club: "A",
    email: `user-${memberId}@example.com`,
    role: ["USER"],
    profileImageUrl: null,
    instagramUrl: null,
    blogUrl: null,
  };
}

describe("sortUsersByEnrollmentNumber", () => {
  it("sorts users by enrollmentNumber ascending", () => {
    const users = [
      createMember(1, "3"),
      createMember(2, "1"),
      createMember(3, "2"),
    ];

    expect(
      sortUsersByEnrollmentNumber(users).map((u) => u.enrollmentNumber),
    ).toEqual(["1", "2", "3"]);
  });

  it("does not mutate original array", () => {
    const users = [createMember(1, "2"), createMember(2, "1")];

    void sortUsersByEnrollmentNumber(users);

    expect(users.map((u) => u.enrollmentNumber)).toEqual(["2", "1"]);
  });
});
