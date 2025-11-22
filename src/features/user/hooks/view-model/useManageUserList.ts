import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { manageUserSearchQueryOptions } from "../../queries";
import { sortUsersByEnrollmentNumber } from "../../lib";

type Args = {
  page: number;
  pageSize: number;
  keyword: string;
  clubId?: string;
  role?: string;
};

export function useManageUserList({
  page,
  pageSize,
  keyword,
  clubId,
  role,
}: Args) {
  const usersQuery = useQuery(
    manageUserSearchQueryOptions({
      username: keyword.length > 0 ? keyword : undefined,
      clubId,
      role,
      page,
      pageSize,
    }),
  );
  const userData = usersQuery.data?.members ?? null;
  const totalCount = usersQuery.data?.totalCount ?? 0;
  const maxPage = usersQuery.data?.totalPages ?? 0;

  const sortedMembers = useMemo(() => {
    if (!userData) return [];
    return sortUsersByEnrollmentNumber(userData);
  }, [userData]);

  return {
    maxPage,
    totalCount,
    userData,
    sortedMembers,
    isLoading: usersQuery.isLoading || usersQuery.isFetching,
    isError: usersQuery.isError,
  };
}
