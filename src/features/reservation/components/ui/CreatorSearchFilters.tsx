"use client";

import { RESERVATION_LABEL } from "../../constants/reservation-label.constants";

type Props = {
  keyword: string;
  clubId?: string;
  role?: string;
  onReset: () => void;
  onKeywordChange: (keyword: string) => void;
  onClubChange: (clubId: string) => void;
  onRoleChange: (role: string) => void;
};

export function CreatorSearchFilters({
  keyword,
  clubId,
  role,
  onReset,
  onKeywordChange,
  onClubChange,
  onRoleChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row justify-between">
        <div>{RESERVATION_LABEL.optionHeader}</div>
        <button type="button" className="cursor-pointer" onClick={onReset}>
          {RESERVATION_LABEL.reset}
        </button>
      </div>

      <div className="flex flex-row gap-4 flex-wrap">
        <input
          type="text"
          placeholder={RESERVATION_LABEL.keywordPlaceholder}
          className="border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]"
          value={keyword}
          onChange={(e) => {
            onKeywordChange(e.currentTarget.value || "");
          }}
        />
        <select
          name="clubId"
          id="clubId"
          onChange={(e) => {
            onClubChange(e.currentTarget.value);
          }}
          className="border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]"
          value={clubId ?? "none"}
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
          onChange={(e) => {
            onRoleChange(e.currentTarget.value);
          }}
          className="border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]"
          value={role ?? "none"}
        >
          <option value="none">역할</option>
          <option value="패짱">패짱</option>
          <option value="상쇠">상쇠</option>
          <option value="상장구">상장구</option>
          <option value="수북">수북</option>
          <option value="수법고">수법고</option>
        </select>
      </div>
    </div>
  );
}
