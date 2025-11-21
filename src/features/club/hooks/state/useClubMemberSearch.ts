import { debounce } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { clubMemberSearchQueryOptions } from "../../queries/club-query-options";

export function useClubMemberSearch(clubId: number) {
  const [isSearching, setIsSearching] = useState(false);
  const [keyword, setKeyword] = useState("");

  const membersQuery = useQuery(clubMemberSearchQueryOptions(clubId, keyword));
  const searchingMembers = membersQuery.data?.members ?? null;

  const debouncedHandleChange = useMemo(
    () => debounce((value: string) => setKeyword(value), 800),
    []
  );

  useEffect(
    () => () => {
      debouncedHandleChange.cancel();
    },
    [debouncedHandleChange]
  );

  useEffect(() => {
    if (!membersQuery.isFetching) {
      setIsSearching(false);
    }
  }, [membersQuery.isFetching]);

  return {
    searchingMembers,
    isLoading: membersQuery.isLoading || membersQuery.isFetching || isSearching,
    setLoading: setIsSearching,
    setKeyword,
    debouncedHandleChange,
  };
}
