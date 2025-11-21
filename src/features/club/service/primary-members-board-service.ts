import type { ClubMember } from "../types";
import type {
  BoardMember,
  BoardState,
} from "../types/primary-members";

type BuildBoardArgs = {
  members: ClubMember[];
  primaryMembers: BoardMember[];
};

type BuildBoardResult = {
  memberMap: Record<number, BoardMember>;
  board: BoardState;
  initialActiveIds: number[];
};

export function buildPrimaryMembersBoard({
  members,
  primaryMembers,
}: BuildBoardArgs): BuildBoardResult {
  const orderedIds: number[] = [];
  const nextMap = new Map<number, BoardMember>();

  members.forEach((member) => {
    orderedIds.push(member.memberId);
    nextMap.set(member.memberId, member);
  });

  primaryMembers.forEach((member) => {
    if (!nextMap.has(member.memberId)) {
      orderedIds.push(member.memberId);
      nextMap.set(member.memberId, member);
      return;
    }

    nextMap.set(member.memberId, {
      ...nextMap.get(member.memberId)!,
      updatedAt: member.updatedAt,
    });
  });

  const nextActive = primaryMembers
    .map((member) => member.memberId)
    .filter((memberId) => nextMap.has(memberId));

  const activeSet = new Set(nextActive);
  const nextInactive = orderedIds.filter((memberId) => !activeSet.has(memberId));

  return {
    memberMap: Object.fromEntries(nextMap.entries()),
    board: { inactive: nextInactive, active: nextActive },
    initialActiveIds: nextActive,
  };
}
