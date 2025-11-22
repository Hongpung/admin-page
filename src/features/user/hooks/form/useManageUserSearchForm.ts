import { useEffect, useState } from "react";

type Args = {
  keyword: string;
  clubId?: string;
  role?: string;
};

export function useManageUserSearchForm({ keyword, clubId, role }: Args) {
  const [keywordInput, setKeywordInput] = useState(keyword);
  const [clubIdInput, setClubIdInput] = useState(clubId ?? "none");
  const [roleInput, setRoleInput] = useState(role ?? "none");

  useEffect(() => {
    setKeywordInput(keyword);
    setClubIdInput(clubId ?? "none");
    setRoleInput(role ?? "none");
  }, [keyword, clubId, role]);

  const resetForm = () => {
    setKeywordInput("");
    setClubIdInput("none");
    setRoleInput("none");
  };

  return {
    keywordInput,
    clubIdInput,
    roleInput,
    setKeywordInput,
    setClubIdInput,
    setRoleInput,
    resetForm,
  };
}
