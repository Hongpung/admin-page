import { useState } from "react";

export function ClubRoleModalSearchBar({
  onReset,
  onKeywordChange,
}: {
  onReset: () => void;
  onKeywordChange: (value: string) => void;
}) {
  const [keyword, setKeyword] = useState("");

  const handleReset = () => {
    setKeyword("");
    onReset();
  };

  const handleChange = (value: string) => {
    setKeyword(value);
    onKeywordChange(value);
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-row items-center justify-between">
        <label className="text-sm text-gray-600">검색</label>
        <button
          type="button"
          className="text-sm text-blue-500 hover:text-blue-700"
          onClick={handleReset}
        >
          초기화
        </button>
      </div>

      <input
        type="text"
        value={keyword}
        placeholder="이름, 닉네임 검색"
        className="w-full rounded border border-[#446fdb] px-3 py-2 outline-[#1e3a80]"
        onChange={(e) => handleChange(e.currentTarget.value || "")}
      />
    </div>
  );
}
