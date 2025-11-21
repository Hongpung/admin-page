import type { ClubInfo, KoRole } from "../types";

export const DISPLAY_ROLES: KoRole[] = [
  "패짱",
  "상쇠",
  "상장구",
  "수북",
  "수법고",
];

export function buildInitialRoleAssignments(
  club: ClubInfo,
): Record<KoRole, number | null> {
  const nextAssignments = Object.fromEntries(
    DISPLAY_ROLES.map((role) => [role, null]),
  ) as Record<KoRole, number | null>;

  club.roleData.forEach((item) => {
    const roleName = item.role as KoRole;
    if (DISPLAY_ROLES.includes(roleName)) {
      nextAssignments[roleName] = item.member.memberId;
    }
  });

  return nextAssignments;
}

export function buildRoleAssigneeNames(
  club: ClubInfo,
): Record<KoRole, string | null> {
  const initial = Object.fromEntries(
    DISPLAY_ROLES.map((role) => [role, null]),
  ) as Record<KoRole, string | null>;

  club.roleData.forEach((item) => {
    const roleName = item.role as KoRole;
    if (DISPLAY_ROLES.includes(roleName)) {
      const nicknameText = item.member.nickname
        ? ` (${item.member.nickname})`
        : "";
      initial[roleName] = `${item.member.name}${nicknameText}`;
    }
  });

  return initial;
}
