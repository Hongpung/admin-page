import { queryOptions } from "@tanstack/react-query";
import {
  getAllClubProfiles,
  getClubMembersByClubId,
  getClubMembersBySubAdmin,
  getClubPrimaryMembersByClubId,
  getSubClubPrimaryMembers,
  getSubClubProfile,
  searchMembers,
} from "../api/club-api";

export const clubQueryKeys = {
  all: ["club"] as const,
  profiles: () => [...clubQueryKeys.all, "profiles"] as const,
  subProfile: () => [...clubQueryKeys.all, "subProfile"] as const,
  memberSearch: (clubId: number, keyword: string) =>
    [...clubQueryKeys.all, "memberSearch", clubId, keyword] as const,
  members: (clubId: number) => [...clubQueryKeys.all, "members", clubId] as const,
  subMembers: () => [...clubQueryKeys.all, "subMembers"] as const,
  primaryMembers: (clubId: number) =>
    [...clubQueryKeys.all, "primaryMembers", clubId] as const,
  subPrimaryMembers: () => [...clubQueryKeys.all, "subPrimaryMembers"] as const,
};

export function clubProfilesQueryOptions() {
  return queryOptions({
    queryKey: clubQueryKeys.profiles(),
    queryFn: getAllClubProfiles,
  });
}

export function subClubProfileQueryOptions() {
  return queryOptions({
    queryKey: clubQueryKeys.subProfile(),
    queryFn: getSubClubProfile,
  });
}

export function clubMemberSearchQueryOptions(clubId: number, keyword: string) {
  return queryOptions({
    queryKey: clubQueryKeys.memberSearch(clubId, keyword),
    queryFn: async () =>
      searchMembers({
        username: keyword.length > 0 ? keyword : undefined,
        clubId: String(clubId),
      }),
  });
}

export function clubMembersQueryOptions(clubId: number) {
  return queryOptions({
    queryKey: clubQueryKeys.members(clubId),
    queryFn: async () => getClubMembersByClubId(clubId),
  });
}

export function subClubMembersQueryOptions() {
  return queryOptions({
    queryKey: clubQueryKeys.subMembers(),
    queryFn: getClubMembersBySubAdmin,
  });
}

export function clubPrimaryMembersQueryOptions(clubId: number) {
  return queryOptions({
    queryKey: clubQueryKeys.primaryMembers(clubId),
    queryFn: async () => getClubPrimaryMembersByClubId(clubId),
  });
}

export function subClubPrimaryMembersQueryOptions() {
  return queryOptions({
    queryKey: clubQueryKeys.subPrimaryMembers(),
    queryFn: getSubClubPrimaryMembers,
  });
}
