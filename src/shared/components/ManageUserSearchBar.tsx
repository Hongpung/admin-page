"use client";

import type { FormEvent } from "react";

type ManageUserSearchBarProps = {
  keywordInput: string;
  onKeywordChange: (value: string) => void;
  clubIdInput: string;
  onClubIdChange: (value: string) => void;
  roleInput: string;
  onRoleChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  className?: string;
};

const inputClass =
  "border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]";

/**
 * 유저 권한 관리 페이지 검색 폼.
 */
export default function ManageUserSearchBar({
  keywordInput,
  onKeywordChange,
  clubIdInput,
  onClubIdChange,
  roleInput,
  onRoleChange,
  onSubmit,
  onReset,
  className = "flex flex-row flex-wrap gap-4 h-12 items-center",
}: ManageUserSearchBarProps) {
  return (
    <form className={className} onSubmit={onSubmit}>
      <input
        type="text"
        name="keyword"
        id="keyword"
        placeholder="여기에 검색어"
        className={inputClass}
        value={keywordInput}
        onChange={(e) => onKeywordChange(e.currentTarget.value)}
      />

      <select
        name="clubId"
        id="clubId"
        className={inputClass}
        value={clubIdInput}
        onChange={(e) => onClubIdChange(e.currentTarget.value)}
      >
        <option value="none">동아리</option>
        <option value="0">들녘</option>
        <option value="1">산틀</option>
        <option value="2">악반</option>
        <option value="3">신명화랑</option>
      </select>

      <select
        name="role"
        id="role"
        className={inputClass}
        value={roleInput}
        onChange={(e) => onRoleChange(e.currentTarget.value)}
      >
        <option value="none">역할</option>
        <option value="패짱">패짱</option>
        <option value="상쇠">상쇠</option>
        <option value="상장구">상장구</option>
        <option value="수북">수북</option>
        <option value="수법고">수법고</option>
      </select>

      <button
        type="submit"
        className="bg-blue-500 text-white rounded px-2 py-0.5"
      >
        검색
      </button>
      <button
        type="button"
        className="bg-red-500 text-white rounded px-2 py-0.5"
        onClick={onReset}
      >
        초기화
      </button>
    </form>
  );
}
