"use client";

import Modal from "@admin/shared/components/Modal";

type Props = {
  isOpen: boolean;
  userName?: string;
  nickname?: string | null;
  password: string;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function DeleteUserConfirmModal({
  isOpen,
  userName,
  nickname,
  password,
  onClose,
  onPasswordChange,
  onSubmit,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-5 rounded-lg bg-white p-6">
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold text-gray-900">회원 삭제</div>
          <div className="text-sm leading-6 text-gray-500">
            {userName}
            {`${nickname ? ` (${nickname})` : ""}`} 님을 삭제하려면 관리자
            비밀번호를 입력하세요.
          </div>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="관리자 비밀번호"
          autoComplete="current-password"
          className="w-full rounded-md border px-3 py-2"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-700"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="rounded-md bg-red-500 px-3 py-2 font-medium text-white"
            onClick={onSubmit}
          >
            삭제
          </button>
        </div>
      </div>
    </Modal>
  );
}
