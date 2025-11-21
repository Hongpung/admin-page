import type { SearchMember } from "../../types";

export function ClubRoleModalConfirmButton({
  selectedMember,
  onConfirm,
}: {
  selectedMember?: SearchMember;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-4 flex w-full flex-col">
      <button
        type="button"
        disabled={!selectedMember}
        className="self-center rounded-md px-4 py-2 text-sm disabled:bg-slate-100 disabled:text-gray-400 enabled:cursor-pointer enabled:bg-blue-500 enabled:text-white enabled:hover:bg-blue-600"
        onClick={onConfirm}
      >
        {selectedMember ? `${selectedMember.name} 선택 완료` : "선택"}
      </button>
    </div>
  );
}
