import { describe, expect, it } from "vitest";
import { buildPrimaryMembersBoard } from "./primary-members-board-service";
import type { ClubMember, ClubPrimaryMember } from "../types";

function member(memberId: number, name: string): ClubMember {
  return {
    memberId,
    name,
    nickname: "",
    email: `${name}@test.dev`,
    enrollmentNumber: `enroll-${memberId}`,
    roleAssignment: [],
    profileImageUrl: "",
    instagramUrl: "",
    blogUrl: "",
  };
}

function primary(memberId: number, updatedAt: string): ClubPrimaryMember {
  return {
    ...member(memberId, `member-${memberId}`),
    updatedAt,
  };
}

describe("주요 멤버 보드 생성", () => {
  it("주요 멤버 식별자 기준으로 활성 멤버와 비활성 멤버를 분리한다", () => {
    const result = buildPrimaryMembersBoard({
      members: [member(1, "a"), member(2, "b"), member(3, "c")],
      primaryMembers: [primary(2, "2026-01-01"), primary(3, "2026-01-02")],
    });

    expect(result.board).toEqual({ inactive: [1], active: [2, 3] });
    expect(result.initialActiveIds).toEqual([2, 3]);
  });

  it("알 수 없는 주요 멤버를 추가하고 수정 시각을 유지한다", () => {
    const result = buildPrimaryMembersBoard({
      members: [member(1, "a")],
      primaryMembers: [primary(99, "2026-01-01")],
    });

    expect(result.board).toEqual({ inactive: [1], active: [99] });
    expect(result.memberMap[99]?.updatedAt).toBe("2026-01-01");
  });
});
