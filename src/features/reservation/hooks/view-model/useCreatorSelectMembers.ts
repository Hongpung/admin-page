"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reservationMemberSearchQueryOptions } from "../../queries";
import { useCreatorSearchFilters } from "../state/useCreatorSearchFilters";

type Args = {
  visible: boolean;
};

export function useCreatorSelectMembers({ visible }: Args) {
  const filters = useCreatorSearchFilters();
  const {
    keyword,
    clubId,
    role,
    rawPage,
    getPage,
    pageSize,
  } = filters;

  const membersQuery = useQuery({
    ...reservationMemberSearchQueryOptions({
      username: keyword.length > 0 ? keyword : undefined,
      clubId,
      role,
      page: rawPage,
      pageSize,
    }),
    enabled: visible,
  });

  const searchingMembers = membersQuery.data?.members ?? null;
  const totalMembers = membersQuery.data?.total ?? 0;
  const page = getPage(totalMembers);
  const isLoading = membersQuery.isLoading || membersQuery.isFetching;
  const maxPage = useMemo(
    () => (totalMembers > 0 ? Math.ceil(totalMembers / pageSize) : 1),
    [pageSize, totalMembers],
  );

  return {
    filters,
    searchingMembers,
    totalMembers,
    page,
    isLoading,
    maxPage,
  };
}
