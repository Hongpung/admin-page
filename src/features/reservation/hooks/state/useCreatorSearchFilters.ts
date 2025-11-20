import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";

const MEMBERS_PER_PAGE = 10;

export function useCreatorSearchFilters() {
  const [rawPage, setRawPage] = useState(0);
  const [inputKeyword, setInputKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [clubId, setClubId] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<string | undefined>(undefined);

  const debouncedHandleChange = useMemo(
    () => debounce((value: string) => setKeyword(value), 800),
    [],
  );

  useEffect(
    () => () => {
      debouncedHandleChange.cancel();
    },
    [debouncedHandleChange],
  );

  const resetFilters = () => {
    setInputKeyword("");
    setKeyword("");
    setClubId(undefined);
    setRole(undefined);
    setRawPage(0);
  };

  const updateClubId = (nextClubId: string) => {
    setRawPage(0);
    setClubId(nextClubId === "none" ? undefined : nextClubId);
  };

  const updateRole = (nextRole: string) => {
    setRawPage(0);
    setRole(nextRole === "none" ? undefined : nextRole);
  };

  const onKeywordChange = (nextKeyword: string) => {
    setRawPage(0);
    setInputKeyword(nextKeyword);
    debouncedHandleChange(nextKeyword);
  };

  const getPage = (totalMembers: number) => {
    const maxPage = totalMembers > 0 ? Math.ceil(totalMembers / MEMBERS_PER_PAGE) : 1;
    return Math.min(rawPage, maxPage - 1);
  };

  return {
    keyword,
    inputKeyword,
    clubId,
    role,
    rawPage,
    setRawPage,
    onKeywordChange,
    updateClubId,
    updateRole,
    resetFilters,
    getPage,
    pageSize: MEMBERS_PER_PAGE,
  };
}
