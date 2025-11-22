import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { fetchUserData, updateMemberByAdmin } from "../api/manage-api";
import type { MemberSearchPaginatedResDto } from "../types";
import type { MemberDetailResDto, UpdateMemberByAdminReqDto } from "../types";

export type ManageUserSearchParams = {
  username?: string;
  clubId?: string;
  role?: string;
  page?: number;
  pageSize?: number;
};

export const manageUserQueryKeys = {
  all: ["user", "manage"] as const,
  detail: (memberId: number) => [...manageUserQueryKeys.all, "detail", memberId] as const,
  search: (params: ManageUserSearchParams) =>
    [
      ...manageUserQueryKeys.all,
      "search",
      params.username ?? "",
      params.clubId ?? "",
      params.role ?? "",
      params.page ?? 0,
      params.pageSize ?? 20,
    ] as const,
};

export type ManageUserUpdateMutationVariables = {
  memberId: number;
  payload: UpdateMemberByAdminReqDto;
};

export function manageUserSearchQueryOptions(params: ManageUserSearchParams) {
  return queryOptions<MemberSearchPaginatedResDto>({
    queryKey: manageUserQueryKeys.search(params),
    queryFn: async () => fetchUserData(params),
  });
}

export function manageUserUpdateMutationOptions() {
  return mutationOptions<
    MemberDetailResDto,
    Error,
    ManageUserUpdateMutationVariables
  >({
    mutationKey: [...manageUserQueryKeys.all, "update"],
    mutationFn: ({ memberId, payload }) =>
      updateMemberByAdmin(memberId, payload),
  });
}
