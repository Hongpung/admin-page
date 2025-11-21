import {
  buildInitialRoleAssignments,
  buildRoleAssigneeNames,
} from "../constants/club-detail.constants";
import type { ClubDetailFormValues, ClubInfo } from "../types";

export function buildClubDetailFormValues(
  club: ClubInfo,
): ClubDetailFormValues {
  return {
    clubId: club.clubId,
    clubName: club.clubName,
    file: null,
    profileImageUrl: club.profileImage ?? null,
    roleAssignments: buildInitialRoleAssignments(club),
    roleAssigneeNames: buildRoleAssigneeNames(club),
  };
}
